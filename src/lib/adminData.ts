import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  adminAuditLogs,
  adminSessions,
  adminUsers,
  chatSessions,
  sessions,
  userGoals,
  userPreferences,
  userReviews,
  userRewards,
  userStats,
  userStreaks,
  users,
} from "@/db/schema";
import { getChatMessages } from "@/lib/r2";
import { withAdminTables } from "@/lib/ensureAdminTables";

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date | null;
}

interface SessionRow {
  id: string;
  userId: string;
  date: Date;
  wpm: number;
  accuracy: number;
  mode: string;
  duration: number;
  keystrokes: number;
}

interface GoalRow {
  id: string;
  userId: string;
  title: string;
  periodType: string;
  goalType: string;
  targetValue: number;
  currentValue: number;
  requiredSessions: number;
  currentSessions: number;
  status: string;
  timezone: string;
  startedAt: Date;
  endsAt: Date;
  completedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface StreakRow {
  userId: string;
  currentStreak: number;
  bestStreak: number;
  lastQualifiedAt: Date | null;
  updatedAt: Date | null;
}

interface RewardRow {
  id: string;
  userId: string;
  rewardType: string;
  rewardKey: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  earnedAt: Date;
}

interface ReviewRow {
  id: string;
  userId: string;
  userName: string;
  userImage: string | null;
  content: string;
  role: string;
  organisation: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface ChatSessionRow {
  id: string;
  userId: string;
  title: string;
  isPinned: boolean | null;
  feedback: Record<string, "up" | "down" | null> | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface AdminRow {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date | null;
  lastLoginAt: Date | null;
}

interface AdminSessionRow {
  id: string;
  adminUserId: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date | null;
  lastSeenAt: Date | null;
  endedAt: Date | null;
}

interface AdminAuditRow {
  id: string;
  adminUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  durationMs: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date | null;
}

export interface AdminTrendPoint {
  label: string;
  users: number;
  sessions: number;
  chats: number;
  reviews: number;
  goalsCompleted: number;
  practiceMinutes: number;
}

export interface AdminUserSummary {
  userId: string;
  name: string;
  email: string;
  createdAt: Date | null;
  lastActiveAt: Date | null;
  sessionsCount: number;
  recentSessions7d: number;
  totalPracticeSeconds: number;
  averageWpm: number;
  averageAccuracy: number;
  activeGoals: number;
  completedGoals: number;
  rewardsCount: number;
  reviewsCount: number;
  chatSessionsCount: number;
  currentStreak: number;
  bestStreak: number;
}

export interface AdminDashboardData {
  summary: {
    totalUsers: number;
    activeUsers7d: number;
    totalTypingSessions: number;
    totalPracticeHours: number;
    averageWpm: number;
    averageAccuracy: number;
    activeGoals: number;
    completedGoals: number;
    totalReviews: number;
    totalRewards: number;
    totalChatSessions: number;
    totalAdmins: number;
    activeAdminSessions: number;
  };
  trends: AdminTrendPoint[];
  users: AdminUserSummary[];
  topUsers: AdminUserSummary[];
}

export interface AdminAuditEntry {
  id: string;
  actorType: "admin" | "user";
  actorId: string;
  actorName: string;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  occurredAt: Date;
  durationMs: number | null;
  metadata: Record<string, unknown>;
}

export interface AdminUserDetail {
  overview: AdminUserSummary & {
    goalCompletionRate: number;
    totalKeystrokes: number;
    longestChatSpanMs: number;
  };
  preferences: typeof userPreferences.$inferSelect | null;
  streak: typeof userStreaks.$inferSelect | null;
  sessions: SessionRow[];
  goals: GoalRow[];
  rewards: RewardRow[];
  reviews: ReviewRow[];
  chats: Array<
    ChatSessionRow & {
      messageCount: number;
      durationMs: number | null;
      messages: unknown[];
    }
  >;
  activities: AdminAuditEntry[];
  topKeys: Array<{
    key: string;
    hits: number;
    misses: number;
    averageTimeMs: number;
  }>;
  topNGrams: Array<{
    ngram: string;
    occurrences: number;
    misses: number;
    averageTimeMs: number;
  }>;
}

function groupByUserId<T extends { userId: string }>(rows: T[]) {
  const map = new Map<string, T[]>();

  for (const row of rows) {
    const existing = map.get(row.userId) ?? [];
    existing.push(row);
    map.set(row.userId, existing);
  }

  return map;
}

function roundNumber(value: number) {
  return Number.isFinite(value) ? Math.round(value) : 0;
}

function maxDate(values: Array<Date | null | undefined>) {
  return values.reduce<Date | null>((latest, current) => {
    if (!current) {
      return latest;
    }

    if (!latest || current.getTime() > latest.getTime()) {
      return current;
    }

    return latest;
  }, null);
}

function createTrendSeries(days = 14) {
  const result: AdminTrendPoint[] = [];
  const now = new Date();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - offset);
    result.push({
      label: day.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      users: 0,
      sessions: 0,
      chats: 0,
      reviews: 0,
      goalsCompleted: 0,
      practiceMinutes: 0,
    });
  }

  return result;
}

function applyTrendEvent(
  series: AdminTrendPoint[],
  date: Date | null | undefined,
  apply: (point: AdminTrendPoint) => void,
) {
  if (!date) {
    return;
  }

  const label = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const point = series.find((entry) => entry.label === label);

  if (point) {
    apply(point);
  }
}

function getDateDiffMs(start?: Date | null, end?: Date | null) {
  if (!start || !end) {
    return null;
  }

  return Math.max(0, end.getTime() - start.getTime());
}

function buildUserSummary(
  user: UserRow,
  sessionRows: SessionRow[],
  goalRows: GoalRow[],
  rewardRows: RewardRow[],
  reviewRows: ReviewRow[],
  chatRows: ChatSessionRow[],
  streakRow: StreakRow | undefined,
): AdminUserSummary {
  const totalPracticeSeconds = sessionRows.reduce(
    (sum, row) => sum + Number(row.duration),
    0,
  );
  const totalWpm = sessionRows.reduce((sum, row) => sum + Number(row.wpm), 0);
  const totalAccuracy = sessionRows.reduce(
    (sum, row) => sum + Number(row.accuracy),
    0,
  );
  const sevenDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;
  const lastActiveAt = maxDate([
    user.createdAt,
    ...sessionRows.map((row) => row.date),
    ...goalRows.flatMap((row) => [row.updatedAt, row.completedAt, row.createdAt]),
    ...rewardRows.map((row) => row.earnedAt),
    ...reviewRows.flatMap((row) => [row.updatedAt, row.createdAt]),
    ...chatRows.flatMap((row) => [row.updatedAt, row.createdAt]),
  ]);

  return {
    userId: user.id,
    name: user.name?.trim() || user.email,
    email: user.email,
    createdAt: user.createdAt,
    lastActiveAt,
    sessionsCount: sessionRows.length,
    recentSessions7d: sessionRows.filter(
      (row) => row.date.getTime() >= sevenDaysAgo,
    ).length,
    totalPracticeSeconds,
    averageWpm: sessionRows.length
      ? roundNumber(totalWpm / sessionRows.length)
      : 0,
    averageAccuracy: sessionRows.length
      ? roundNumber(totalAccuracy / sessionRows.length)
      : 0,
    activeGoals: goalRows.filter((row) => row.status === "active").length,
    completedGoals: goalRows.filter((row) => row.status === "completed").length,
    rewardsCount: rewardRows.length,
    reviewsCount: reviewRows.length,
    chatSessionsCount: chatRows.length,
    currentStreak: Number(streakRow?.currentStreak ?? 0),
    bestStreak: Number(streakRow?.bestStreak ?? 0),
  };
}

function buildUserActivityEntries(
  user: UserRow,
  sessionRows: SessionRow[],
  goalRows: GoalRow[],
  rewardRows: RewardRow[],
  reviewRows: ReviewRow[],
  chatRows: ChatSessionRow[],
): AdminAuditEntry[] {
  const entries: AdminAuditEntry[] = [];

  entries.push({
    id: `user-created-${user.id}`,
    actorType: "user",
    actorId: user.id,
    actorName: user.name?.trim() || user.email,
    actorEmail: user.email,
    action: "user.registered",
    entityType: "user",
    entityId: user.id,
    occurredAt: user.createdAt ?? new Date(),
    durationMs: null,
    metadata: {},
  });

  for (const row of sessionRows) {
    entries.push({
      id: `session-${row.id}`,
      actorType: "user",
      actorId: user.id,
      actorName: user.name?.trim() || user.email,
      actorEmail: user.email,
      action: "typing.session.completed",
      entityType: "typing_session",
      entityId: row.id,
      occurredAt: row.date,
      durationMs: row.duration * 1000,
      metadata: {
        wpm: row.wpm,
        accuracy: row.accuracy,
        mode: row.mode,
        keystrokes: row.keystrokes,
      },
    });
  }

  for (const row of goalRows) {
    if (row.createdAt) {
      entries.push({
        id: `goal-created-${row.id}`,
        actorType: "user",
        actorId: user.id,
        actorName: user.name?.trim() || user.email,
        actorEmail: user.email,
        action: "goal.created",
        entityType: "goal",
        entityId: row.id,
        occurredAt: row.createdAt,
        durationMs: getDateDiffMs(row.startedAt, row.endsAt),
        metadata: {
          title: row.title,
          goalType: row.goalType,
          targetValue: row.targetValue,
          status: row.status,
        },
      });
    }

    if (row.completedAt) {
      entries.push({
        id: `goal-completed-${row.id}`,
        actorType: "user",
        actorId: user.id,
        actorName: user.name?.trim() || user.email,
        actorEmail: user.email,
        action: "goal.completed",
        entityType: "goal",
        entityId: row.id,
        occurredAt: row.completedAt,
        durationMs: getDateDiffMs(row.startedAt, row.completedAt),
        metadata: {
          title: row.title,
          goalType: row.goalType,
          targetValue: row.targetValue,
        },
      });
    }
  }

  for (const row of reviewRows) {
    const occurredAt = row.updatedAt ?? row.createdAt;
    if (!occurredAt) {
      continue;
    }

    entries.push({
      id: `review-${row.id}`,
      actorType: "user",
      actorId: user.id,
      actorName: user.name?.trim() || user.email,
      actorEmail: user.email,
      action: "review.submitted",
      entityType: "review",
      entityId: row.id,
      occurredAt,
      durationMs: null,
      metadata: {
        role: row.role,
        organisation: row.organisation,
      },
    });
  }

  for (const row of rewardRows) {
    entries.push({
      id: `reward-${row.id}`,
      actorType: "user",
      actorId: user.id,
      actorName: user.name?.trim() || user.email,
      actorEmail: user.email,
      action: "reward.earned",
      entityType: "reward",
      entityId: row.id,
      occurredAt: row.earnedAt,
      durationMs: null,
      metadata: {
        rewardType: row.rewardType,
        rewardKey: row.rewardKey,
        title: row.title,
      },
    });
  }

  for (const row of chatRows) {
    if (row.createdAt) {
      entries.push({
        id: `chat-created-${row.id}`,
        actorType: "user",
        actorId: user.id,
        actorName: user.name?.trim() || user.email,
        actorEmail: user.email,
        action: "swift_ai.chat.started",
        entityType: "chat_session",
        entityId: row.id,
        occurredAt: row.createdAt,
        durationMs: getDateDiffMs(row.createdAt, row.updatedAt),
        metadata: {
          title: row.title,
          isPinned: row.isPinned ?? false,
        },
      });
    }

    if (
      row.createdAt &&
      row.updatedAt &&
      row.updatedAt.getTime() > row.createdAt.getTime()
    ) {
      entries.push({
        id: `chat-updated-${row.id}`,
        actorType: "user",
        actorId: user.id,
        actorName: user.name?.trim() || user.email,
        actorEmail: user.email,
        action: "swift_ai.chat.updated",
        entityType: "chat_session",
        entityId: row.id,
        occurredAt: row.updatedAt,
        durationMs: getDateDiffMs(row.createdAt, row.updatedAt),
        metadata: {
          title: row.title,
          feedback: row.feedback ?? {},
        },
      });
    }
  }

  return entries.sort(
    (left, right) => right.occurredAt.getTime() - left.occurredAt.getTime(),
  );
}

async function getAllCoreRows() {
  return Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)),
    db.select().from(sessions).orderBy(desc(sessions.date)),
    db.select().from(userGoals).orderBy(desc(userGoals.updatedAt)),
    db.select().from(userStreaks),
    db.select().from(userRewards).orderBy(desc(userRewards.earnedAt)),
    db.select().from(userReviews).orderBy(desc(userReviews.updatedAt)),
    db.select().from(chatSessions).orderBy(desc(chatSessions.updatedAt)),
  ]) as Promise<
    [
      UserRow[],
      SessionRow[],
      GoalRow[],
      StreakRow[],
      RewardRow[],
      ReviewRow[],
      ChatSessionRow[],
    ]
  >;
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  return withAdminTables(async () => {
    const [coreRows, adminRows, adminSessionRows] = await Promise.all([
      getAllCoreRows(),
      db.select().from(adminUsers),
      db.select().from(adminSessions),
    ]);

    const [
      userRows,
      sessionRows,
      goalRows,
      streakRows,
      rewardRows,
      reviewRows,
      chatRows,
    ] = coreRows;

    const sessionsByUser = groupByUserId(sessionRows);
    const goalsByUser = groupByUserId(goalRows);
    const rewardsByUser = groupByUserId(rewardRows);
    const reviewsByUser = groupByUserId(reviewRows);
    const chatsByUser = groupByUserId(chatRows);
    const streakByUser = new Map(streakRows.map((row) => [row.userId, row]));

    const summaries = userRows
      .map((user) =>
        buildUserSummary(
          user,
          sessionsByUser.get(user.id) ?? [],
          goalsByUser.get(user.id) ?? [],
          rewardsByUser.get(user.id) ?? [],
          reviewsByUser.get(user.id) ?? [],
          chatsByUser.get(user.id) ?? [],
          streakByUser.get(user.id),
        ),
      )
      .sort((left, right) => {
        const leftActive = left.lastActiveAt?.getTime() ?? 0;
        const rightActive = right.lastActiveAt?.getTime() ?? 0;
        return rightActive - leftActive;
      });

    const trends = createTrendSeries(14);

    for (const row of userRows) {
      applyTrendEvent(trends, row.createdAt, (point) => {
        point.users += 1;
      });
    }

    for (const row of sessionRows) {
      applyTrendEvent(trends, row.date, (point) => {
        point.sessions += 1;
        point.practiceMinutes += Math.round(row.duration / 60);
      });
    }

    for (const row of chatRows) {
      applyTrendEvent(trends, row.createdAt, (point) => {
        point.chats += 1;
      });
    }

    for (const row of reviewRows) {
      applyTrendEvent(trends, row.createdAt, (point) => {
        point.reviews += 1;
      });
    }

    for (const row of goalRows) {
      applyTrendEvent(trends, row.completedAt, (point) => {
        point.goalsCompleted += 1;
      });
    }

    const sevenDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;
    const totalPracticeSeconds = sessionRows.reduce(
      (sum, row) => sum + row.duration,
      0,
    );

    return {
      summary: {
        totalUsers: userRows.length,
        activeUsers7d: summaries.filter(
          (row) => (row.lastActiveAt?.getTime() ?? 0) >= sevenDaysAgo,
        ).length,
        totalTypingSessions: sessionRows.length,
        totalPracticeHours: roundNumber(totalPracticeSeconds / 3600),
        averageWpm: sessionRows.length
          ? roundNumber(
              sessionRows.reduce((sum, row) => sum + row.wpm, 0) /
                sessionRows.length,
            )
          : 0,
        averageAccuracy: sessionRows.length
          ? roundNumber(
              sessionRows.reduce((sum, row) => sum + row.accuracy, 0) /
                sessionRows.length,
            )
          : 0,
        activeGoals: goalRows.filter((row) => row.status === "active").length,
        completedGoals: goalRows.filter((row) => row.status === "completed")
          .length,
        totalReviews: reviewRows.length,
        totalRewards: rewardRows.length,
        totalChatSessions: chatRows.length,
        totalAdmins: adminRows.length,
        activeAdminSessions: adminSessionRows.filter((row) => !row.endedAt)
          .length,
      },
      trends,
      users: summaries,
      topUsers: [...summaries]
        .sort((left, right) => {
          if (right.totalPracticeSeconds !== left.totalPracticeSeconds) {
            return right.totalPracticeSeconds - left.totalPracticeSeconds;
          }

          return right.averageWpm - left.averageWpm;
        })
        .slice(0, 5),
    };
  });
}

export async function getAdminUserDetail(userId: string) {
  return withAdminTables(async () => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return null;
    }

    const [
      sessionRows,
      goalRows,
      rewardRows,
      reviewRows,
      chatRows,
      preferenceRows,
      streakRows,
      statsRows,
    ] = await Promise.all([
      db.select().from(sessions).where(eq(sessions.userId, userId)).orderBy(desc(sessions.date)),
      db.select().from(userGoals).where(eq(userGoals.userId, userId)).orderBy(desc(userGoals.updatedAt)),
      db.select().from(userRewards).where(eq(userRewards.userId, userId)).orderBy(desc(userRewards.earnedAt)),
      db.select().from(userReviews).where(eq(userReviews.userId, userId)).orderBy(desc(userReviews.updatedAt)),
      db.select().from(chatSessions).where(eq(chatSessions.userId, userId)).orderBy(desc(chatSessions.updatedAt)),
      db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1),
      db.select().from(userStreaks).where(eq(userStreaks.userId, userId)).limit(1),
      db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1),
    ]);

    const summary = buildUserSummary(
      user,
      sessionRows,
      goalRows,
      rewardRows,
      reviewRows,
      chatRows,
      streakRows[0],
    );

    const chats = await Promise.all(
      chatRows.map(async (row) => {
        try {
          const messages = await getChatMessages(userId, row.id);
          return {
            ...row,
            messageCount: Array.isArray(messages) ? messages.length : 0,
            durationMs: getDateDiffMs(row.createdAt, row.updatedAt),
            messages,
          };
        } catch {
          return {
            ...row,
            messageCount: 0,
            durationMs: getDateDiffMs(row.createdAt, row.updatedAt),
            messages: [],
          };
        }
      }),
    );

    const activities = buildUserActivityEntries(
      user,
      sessionRows,
      goalRows,
      rewardRows,
      reviewRows,
      chatRows,
    );

    const stats = statsRows[0];
    const perKeyStats = (stats?.perKeyStats ?? {}) as Record<
      string,
      { hits: number; misses: number; totalTimeMs: number }
    >;
    const nGramStats = (stats?.nGramStats ?? {}) as Record<
      string,
      { occurrences: number; misses: number; totalTimeMs: number }
    >;

    const topKeys = Object.entries(perKeyStats)
      .map(([key, value]) => ({
        key,
        hits: Number(value.hits ?? 0),
        misses: Number(value.misses ?? 0),
        averageTimeMs:
          Number(value.hits ?? 0) + Number(value.misses ?? 0) > 0
            ? roundNumber(
                Number(value.totalTimeMs ?? 0) /
                  Math.max(1, Number(value.hits ?? 0) + Number(value.misses ?? 0)),
              )
            : 0,
      }))
      .sort((left, right) => {
        if (right.misses !== left.misses) {
          return right.misses - left.misses;
        }

        return right.averageTimeMs - left.averageTimeMs;
      })
      .slice(0, 10);

    const topNGrams = Object.entries(nGramStats)
      .map(([ngram, value]) => ({
        ngram,
        occurrences: Number(value.occurrences ?? 0),
        misses: Number(value.misses ?? 0),
        averageTimeMs:
          Number(value.occurrences ?? 0) > 0
            ? roundNumber(Number(value.totalTimeMs ?? 0) / Number(value.occurrences ?? 0))
            : 0,
      }))
      .sort((left, right) => {
        if (right.misses !== left.misses) {
          return right.misses - left.misses;
        }

        return right.averageTimeMs - left.averageTimeMs;
      })
      .slice(0, 10);

    const completedGoals = goalRows.filter((row) => row.status === "completed").length;

    return {
      overview: {
        ...summary,
        goalCompletionRate: goalRows.length
          ? roundNumber((completedGoals / goalRows.length) * 100)
          : 0,
        totalKeystrokes: sessionRows.reduce((sum, row) => sum + row.keystrokes, 0),
        longestChatSpanMs: chats.reduce(
          (max, row) => Math.max(max, row.durationMs ?? 0),
          0,
        ),
      },
      preferences: preferenceRows[0] ?? null,
      streak: streakRows[0] ?? null,
      sessions: sessionRows,
      goals: goalRows,
      rewards: rewardRows,
      reviews: reviewRows,
      chats,
      activities: activities.slice(0, 50),
      topKeys,
      topNGrams,
    } satisfies AdminUserDetail;
  });
}

export async function getAdminAuditTrail(limit = 250) {
  return withAdminTables(async () => {
    const [
      adminAuditRows,
      adminRows,
      userRows,
      sessionRows,
      goalRows,
      rewardRows,
      reviewRows,
      chatRows,
    ] = await Promise.all([
      db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.createdAt)).limit(limit),
      db.select().from(adminUsers) as Promise<AdminRow[]>,
      db.select().from(users) as Promise<UserRow[]>,
      db.select().from(sessions).orderBy(desc(sessions.date)).limit(limit) as Promise<SessionRow[]>,
      db.select().from(userGoals).orderBy(desc(userGoals.updatedAt)).limit(limit) as Promise<GoalRow[]>,
      db.select().from(userRewards).orderBy(desc(userRewards.earnedAt)).limit(limit) as Promise<RewardRow[]>,
      db.select().from(userReviews).orderBy(desc(userReviews.updatedAt)).limit(limit) as Promise<ReviewRow[]>,
      db.select().from(chatSessions).orderBy(desc(chatSessions.updatedAt)).limit(limit) as Promise<ChatSessionRow[]>,
    ]);

    const adminById = new Map(adminRows.map((row) => [row.id, row]));
    const userById = new Map(userRows.map((row) => [row.id, row]));
    const entries: AdminAuditEntry[] = [];

    for (const row of adminAuditRows as AdminAuditRow[]) {
      const admin = row.adminUserId ? adminById.get(row.adminUserId) : null;

      if (!row.createdAt) {
        continue;
      }

      entries.push({
        id: row.id,
        actorType: "admin",
        actorId: admin?.id ?? row.adminUserId ?? "unknown-admin",
        actorName: admin?.name ?? "Unknown Admin",
        actorEmail: admin?.email ?? null,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        occurredAt: row.createdAt,
        durationMs: row.durationMs,
        metadata: row.metadata ?? {},
      });
    }

    for (const row of sessionRows) {
      const user = userById.get(row.userId);
      if (!user) {
        continue;
      }

      entries.push({
        id: `audit-session-${row.id}`,
        actorType: "user",
        actorId: user.id,
        actorName: user.name?.trim() || user.email,
        actorEmail: user.email,
        action: "typing.session.completed",
        entityType: "typing_session",
        entityId: row.id,
        occurredAt: row.date,
        durationMs: row.duration * 1000,
        metadata: {
          wpm: row.wpm,
          accuracy: row.accuracy,
          mode: row.mode,
        },
      });
    }

    for (const row of goalRows) {
      const user = userById.get(row.userId);
      if (!user || !row.createdAt) {
        continue;
      }

      entries.push({
        id: `audit-goal-${row.id}`,
        actorType: "user",
        actorId: user.id,
        actorName: user.name?.trim() || user.email,
        actorEmail: user.email,
        action: row.completedAt ? "goal.completed" : "goal.updated",
        entityType: "goal",
        entityId: row.id,
        occurredAt: row.completedAt ?? row.updatedAt ?? row.createdAt,
        durationMs: row.completedAt ? getDateDiffMs(row.startedAt, row.completedAt) : null,
        metadata: {
          title: row.title,
          status: row.status,
        },
      });
    }

    for (const row of rewardRows) {
      const user = userById.get(row.userId);
      if (!user) {
        continue;
      }

      entries.push({
        id: `audit-reward-${row.id}`,
        actorType: "user",
        actorId: user.id,
        actorName: user.name?.trim() || user.email,
        actorEmail: user.email,
        action: "reward.earned",
        entityType: "reward",
        entityId: row.id,
        occurredAt: row.earnedAt,
        durationMs: null,
        metadata: {
          rewardType: row.rewardType,
          rewardKey: row.rewardKey,
        },
      });
    }

    for (const row of reviewRows) {
      const user = userById.get(row.userId);
      const occurredAt = row.updatedAt ?? row.createdAt;

      if (!user || !occurredAt) {
        continue;
      }

      entries.push({
        id: `audit-review-${row.id}`,
        actorType: "user",
        actorId: user.id,
        actorName: user.name?.trim() || user.email,
        actorEmail: user.email,
        action: "review.submitted",
        entityType: "review",
        entityId: row.id,
        occurredAt,
        durationMs: null,
        metadata: {
          role: row.role,
          organisation: row.organisation,
        },
      });
    }

    for (const row of chatRows) {
      const user = userById.get(row.userId);
      const occurredAt = row.updatedAt ?? row.createdAt;

      if (!user || !occurredAt) {
        continue;
      }

      entries.push({
        id: `audit-chat-${row.id}`,
        actorType: "user",
        actorId: user.id,
        actorName: user.name?.trim() || user.email,
        actorEmail: user.email,
        action: row.createdAt && row.updatedAt && row.updatedAt > row.createdAt
          ? "swift_ai.chat.updated"
          : "swift_ai.chat.started",
        entityType: "chat_session",
        entityId: row.id,
        occurredAt,
        durationMs: getDateDiffMs(row.createdAt, row.updatedAt),
        metadata: {
          title: row.title,
          feedback: row.feedback ?? {},
        },
      });
    }

    return entries
      .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())
      .slice(0, limit);
  });
}