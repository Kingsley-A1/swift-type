/**
 * Swift Rank — DB Service
 *
 * All DB operations for XP writes and leaderboard reads.
 * Keeps route handlers thin.
 */
import { db } from "@/db";
import {
  userXpLedger,
  swiftRankSnapshots,
  users,
  userStreaks,
  sessions,
} from "@/db/schema";
import { eq, and, desc, sql, sum, avg, count, max } from "drizzle-orm";
import {
  calculateSessionXp,
  resolveRankTier,
  CURRENT_PERIOD,
  type LeaderboardEntry,
  type XpLedgerEntry,
} from "./swiftRank";

// ─── WRITE: award XP for a session ───────────────────────────────────────────

export async function awardSessionXp(params: {
  userId: string;
  sessionId: string;
  wpm: number;
  accuracy: number;
  durationSeconds: number;
}) {
  const { userId, sessionId, wpm, accuracy, durationSeconds } = params;

  // Guard: skip if XP already awarded for this session (dedup)
  const [existing] = await db
    .select({ id: userXpLedger.id })
    .from(userXpLedger)
    .where(eq(userXpLedger.sessionId, sessionId))
    .limit(1);
  if (existing) return;

  // Fetch current streak
  const [streakRow] = await db
    .select({ currentStreak: userStreaks.currentStreak })
    .from(userStreaks)
    .where(eq(userStreaks.userId, userId))
    .limit(1);

  const currentStreak = streakRow?.currentStreak ?? 0;
  const period = CURRENT_PERIOD();

  const breakdown = calculateSessionXp({
    wpm,
    accuracy,
    durationSeconds,
    currentStreak,
  });

  // Write ledger entry
  await db.insert(userXpLedger).values({
    userId,
    sessionId,
    period,
    ...breakdown,
  });

  // Refresh the user's snapshot for this period
  await refreshUserSnapshot(userId, period);
}


// ─── REFRESH: recompute one user's snapshot ───────────────────────────────────

export async function refreshUserSnapshot(userId: string, period: string) {
  // Aggregate from ledger
  const [xpAgg] = await db
    .select({ totalXp: sum(userXpLedger.xpAwarded) })
    .from(userXpLedger)
    .where(and(eq(userXpLedger.userId, userId), eq(userXpLedger.period, period)));

  const totalXp = Number(xpAgg?.totalXp ?? 0);
  const tier = resolveRankTier(totalXp).name;

  // Aggregate from sessions for this period
  const periodStart = new Date(`${period}-01T00:00:00.000Z`);
  const periodEndYear = period.slice(0, 4);
  const periodEndMonth = String(Number(period.slice(5)) + 1).padStart(2, "0");
  const periodEnd = new Date(`${periodEndYear}-${periodEndMonth}-01T00:00:00.000Z`);

  const [sessionAgg] = await db
    .select({
      avgWpm: avg(sessions.wpm),
      avgAccuracy: avg(sessions.accuracy),
      totalSessions: count(sessions.id),
      totalDurationSeconds: sum(sessions.duration),
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        sql`${sessions.date} >= ${periodStart}`,
        sql`${sessions.date} < ${periodEnd}`,
      ),
    );

  const [streakRow] = await db
    .select({ bestStreak: userStreaks.bestStreak })
    .from(userStreaks)
    .where(eq(userStreaks.userId, userId))
    .limit(1);

  const avgWpm = Number(sessionAgg?.avgWpm ?? 0);
  const avgAccuracy = Number(sessionAgg?.avgAccuracy ?? 0);
  const totalSessions = Number(sessionAgg?.totalSessions ?? 0);
  const totalPracticeMinutes = Number(sessionAgg?.totalDurationSeconds ?? 0) / 60;
  const bestStreak = streakRow?.bestStreak ?? 0;

  // Upsert snapshot
  await db
    .insert(swiftRankSnapshots)
    .values({
      userId,
      period,
      totalXp,
      tier,
      avgWpm,
      avgAccuracy,
      totalSessions,
      totalPracticeMinutes,
      bestStreak,
    })
    .onConflictDoUpdate({
      target: [swiftRankSnapshots.userId, swiftRankSnapshots.period],
      set: {
        totalXp,
        tier,
        avgWpm,
        avgAccuracy,
        totalSessions,
        totalPracticeMinutes,
        bestStreak,
        snapshotAt: new Date(),
      },
    });

  // Recompute global ranks for this period (dense_rank on total_xp desc)
  await db.execute(sql`
    UPDATE swift_rank_snapshots AS s
    SET rank = sub.computed_rank
    FROM (
      SELECT id,
             RANK() OVER (PARTITION BY period ORDER BY total_xp DESC) AS computed_rank
      FROM swift_rank_snapshots
      WHERE period = ${period}
    ) AS sub
    WHERE s.id = sub.id
  `);
}

// ─── READ: leaderboard page ───────────────────────────────────────────────────

export async function getLeaderboard(
  period: string,
  limit = 50,
  offset = 0,
): Promise<{ entries: LeaderboardEntry[]; total: number }> {
  const rows = await db
    .select({
      userId: swiftRankSnapshots.userId,
      rank: swiftRankSnapshots.rank,
      tier: swiftRankSnapshots.tier,
      totalXp: swiftRankSnapshots.totalXp,
      avgWpm: swiftRankSnapshots.avgWpm,
      avgAccuracy: swiftRankSnapshots.avgAccuracy,
      totalSessions: swiftRankSnapshots.totalSessions,
      totalPracticeMinutes: swiftRankSnapshots.totalPracticeMinutes,
      bestStreak: swiftRankSnapshots.bestStreak,
      isAnonymous: swiftRankSnapshots.isAnonymous,
      name: users.name,
      image: users.image,
    })
    .from(swiftRankSnapshots)
    .innerJoin(users, eq(swiftRankSnapshots.userId, users.id))
    .where(eq(swiftRankSnapshots.period, period))
    .orderBy(desc(swiftRankSnapshots.totalXp))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(swiftRankSnapshots)
    .where(eq(swiftRankSnapshots.period, period));

  const entries: LeaderboardEntry[] = rows.map((r) => {
    const { emoji } = resolveRankTier(r.totalXp);
    return {
      userId: r.userId,
      displayName: r.isAnonymous ? "Anonymous Typist" : (r.name ?? "Unknown"),
      avatarUrl: r.isAnonymous ? null : r.image,
      rank: r.rank ?? 0,
      tier: r.tier,
      tierEmoji: emoji,
      totalXp: r.totalXp,
      avgWpm: Math.round(r.avgWpm),
      avgAccuracy: Math.round(r.avgAccuracy),
      totalSessions: r.totalSessions,
      totalPracticeMinutes: Math.round(r.totalPracticeMinutes),
      bestStreak: r.bestStreak,
      isAnonymous: r.isAnonymous,
    };
  });

  return { entries, total: Number(total) };
}

// ─── READ: single user rank + ledger ─────────────────────────────────────────

export async function getUserRankDetail(userId: string, period: string) {
  const [snapshot] = await db
    .select()
    .from(swiftRankSnapshots)
    .where(
      and(
        eq(swiftRankSnapshots.userId, userId),
        eq(swiftRankSnapshots.period, period),
      ),
    )
    .limit(1);

  const ledger: XpLedgerEntry[] = await db
    .select({
      id: userXpLedger.id,
      sessionId: userXpLedger.sessionId,
      period: userXpLedger.period,
      xpAwarded: userXpLedger.xpAwarded,
      wpmContribution: userXpLedger.wpmContribution,
      accuracyContribution: userXpLedger.accuracyContribution,
      durationContribution: userXpLedger.durationContribution,
      streakContribution: userXpLedger.streakContribution,
      createdAt: userXpLedger.createdAt,
    })
    .from(userXpLedger)
    .where(
      and(eq(userXpLedger.userId, userId), eq(userXpLedger.period, period)),
    )
    .orderBy(desc(userXpLedger.createdAt))
    .limit(20);

  return { snapshot: snapshot ?? null, ledger };
}

// ─── READ: user's own snapshot summary ───────────────────────────────────────

export async function getUserSnapshot(userId: string, period: string) {
  const [row] = await db
    .select()
    .from(swiftRankSnapshots)
    .where(
      and(
        eq(swiftRankSnapshots.userId, userId),
        eq(swiftRankSnapshots.period, period),
      ),
    )
    .limit(1);
  return row ?? null;
}
