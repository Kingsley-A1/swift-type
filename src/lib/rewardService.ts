import { db } from "@/db";
import { userRewards } from "@/db/schema";
import type { GoalRecord, GoalSessionInput, GoalStreak } from "@/lib/goals";
import {
  RewardRecord,
  RewardUnlock,
  evaluateRewardUnlocks,
} from "@/lib/rewards";
import { desc, eq } from "drizzle-orm";

interface RewardEvaluationArgs {
  completedGoals?: GoalRecord[];
  streak?: GoalStreak;
  session?: GoalSessionInput;
}

type RewardRow = typeof userRewards.$inferSelect;

function mapRewardRow(row: RewardRow): RewardRecord {
  return {
    id: row.id,
    rewardType: row.rewardType as RewardRecord["rewardType"],
    rewardKey: row.rewardKey,
    title: row.title,
    description: row.description ?? "",
    metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
    earnedAt: row.earnedAt.getTime(),
  };
}

export async function getRecentRewards(
  userId: string,
  limit = 25,
): Promise<RewardRecord[]> {
  const rows = await db
    .select()
    .from(userRewards)
    .where(eq(userRewards.userId, userId))
    .orderBy(desc(userRewards.earnedAt))
    .limit(limit);

  return rows.map(mapRewardRow);
}

export async function awardRewards(
  userId: string,
  unlocks: RewardUnlock[],
  earnedAt = Date.now(),
): Promise<RewardRecord[]> {
  if (unlocks.length === 0) {
    return [];
  }

  const insertedRows = await db
    .insert(userRewards)
    .values(
      unlocks.map((unlock) => ({
        id: crypto.randomUUID(),
        userId,
        rewardType: unlock.rewardType,
        rewardKey: unlock.rewardKey,
        title: unlock.title,
        description: unlock.description,
        metadata: unlock.metadata ?? {},
        earnedAt: new Date(earnedAt),
      })),
    )
    .onConflictDoNothing({
      target: [userRewards.userId, userRewards.rewardKey],
    })
    .returning();

  return insertedRows.map(mapRewardRow);
}

export async function evaluateAndPersistRewards(
  userId: string,
  args: RewardEvaluationArgs,
): Promise<RewardRecord[]> {
  const existingRewards = await db
    .select({ rewardKey: userRewards.rewardKey })
    .from(userRewards)
    .where(eq(userRewards.userId, userId));

  const existingKeys = new Set(existingRewards.map((row) => row.rewardKey));
  const unlocks = evaluateRewardUnlocks(existingKeys, {
    completedGoals: args.completedGoals,
    streak: args.streak,
    session: args.session,
  });

  return awardRewards(userId, unlocks);
}
