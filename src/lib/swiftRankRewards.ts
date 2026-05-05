/**
 * Swift Rank — Monthly Rewards Service
 *
 * Called at the end of each monthly period to:
 * 1. Freeze the current period's snapshot
 * 2. Grant rank-tier achievement badges to all participants via user_rewards
 * 3. Award special "top 3" medals for the top performers per tier
 */
import { db } from "@/db";
import { swiftRankSnapshots, userRewards, users } from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { getTierInfo } from "./swiftRank";

interface MonthlyRewardResult {
  period: string;
  processed: number;
  rewarded: number;
  errors: string[];
}

/**
 * Grant monthly Swift Rank rewards for a given period.
 * Safe to call multiple times (uses rewardKey uniqueness to dedup).
 */
export async function grantMonthlyRankRewards(
  period: string,
): Promise<MonthlyRewardResult> {
  const result: MonthlyRewardResult = {
    period,
    processed: 0,
    rewarded: 0,
    errors: [],
  };

  // 1. Fetch all snapshots for the period, ordered by rank
  const snapshots = await db
    .select({
      id: swiftRankSnapshots.id,
      userId: swiftRankSnapshots.userId,
      rank: swiftRankSnapshots.rank,
      tier: swiftRankSnapshots.tier,
      totalXp: swiftRankSnapshots.totalXp,
    })
    .from(swiftRankSnapshots)
    .where(eq(swiftRankSnapshots.period, period))
    .orderBy(asc(swiftRankSnapshots.rank));

  result.processed = snapshots.length;

  const now = new Date();
  const earnedAt = now;

  for (const snap of snapshots) {
    const tierInfo = getTierInfo(snap.tier);
    const rewardsToGrant: Array<{
      rewardType: string;
      rewardKey: string;
      title: string;
      description: string;
      metadata: Record<string, unknown>;
    }> = [];

    // --- Tier achievement badge (every participant above Rookie gets one) ---
    if (snap.tier !== "Rookie") {
      rewardsToGrant.push({
        rewardType: "rank",
        rewardKey: `swift-rank:${period}:${snap.tier.toLowerCase()}`,
        title: `${tierInfo.emoji} ${snap.tier} — ${period}`,
        description: `Achieved ${snap.tier} tier in the Swift Rank leaderboard for ${period}.`,
        metadata: { period, tier: snap.tier, totalXp: snap.totalXp, rank: snap.rank },
      });
    }

    // --- Top 3 global medal ---
    if (snap.rank && snap.rank <= 3) {
      const medals = ["🥇 Champion", "🥈 Runner-up", "🥉 Third Place"];
      const medalKey = ["champion", "runner-up", "third"][snap.rank - 1];
      rewardsToGrant.push({
        rewardType: "rank",
        rewardKey: `swift-rank:${period}:${medalKey}`,
        title: `${medals[snap.rank - 1]} — ${period}`,
        description: `Finished #${snap.rank} globally in Swift Rank for ${period}.`,
        metadata: { period, rank: snap.rank, tier: snap.tier, totalXp: snap.totalXp },
      });
    }

    // Insert each reward — skip on conflict (unique key guard)
    for (const reward of rewardsToGrant) {
      try {
        await db
          .insert(userRewards)
          .values({
            userId: snap.userId,
            rewardType: reward.rewardType,
            rewardKey: reward.rewardKey,
            title: reward.title,
            description: reward.description,
            metadata: reward.metadata,
            earnedAt,
          })
          .onConflictDoNothing();
        result.rewarded++;
      } catch (e) {
        result.errors.push(
          `userId=${snap.userId} key=${reward.rewardKey}: ${String(e)}`,
        );
      }
    }
  }

  return result;
}

/**
 * Fetch rank reward history for a specific user — shown in admin audit.
 */
export async function getUserRankRewards(userId: string) {
  return db
    .select()
    .from(userRewards)
    .where(
      and(
        eq(userRewards.userId, userId),
        eq(userRewards.rewardType, "rank"),
      ),
    )
    .orderBy(desc(userRewards.earnedAt));
}
