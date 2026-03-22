import { db } from "@/db";
import { userGoals, userStreaks } from "@/db/schema";
import { and, asc, eq, gte, inArray } from "drizzle-orm";
import {
  GoalInput,
  GoalRecord,
  GoalSessionInput,
  GoalSnapshot,
  GoalStatus,
  GoalStreak,
  applySessionToGoal,
  createEmptyGoalSnapshot,
  createEmptyGoalStreak,
  createGoalWindow,
  expireGoalRecord,
  normalizeGoalRecord,
  shouldGoalBeCompleted,
  updateGoalStreak,
} from "./goals";
import { evaluateAndPersistRewards } from "./rewardService";
import type { RewardRecord } from "./rewards";

type GoalRow = typeof userGoals.$inferSelect;
type StreakRow = typeof userStreaks.$inferSelect;

export interface GoalMutationResult {
  snapshot: GoalSnapshot;
  rewardEvents: RewardRecord[];
}

function mapGoalRow(row: GoalRow): GoalRecord {
  return normalizeGoalRecord({
    id: row.id,
    title: row.title,
    periodType: row.periodType as GoalRecord["periodType"],
    goalType: row.goalType as GoalRecord["goalType"],
    targetValue: Number(row.targetValue),
    currentValue: Number(row.currentValue),
    requiredSessions: Number(row.requiredSessions),
    currentSessions: Number(row.currentSessions),
    status: row.status as GoalStatus,
    timezone: row.timezone,
    startedAt: row.startedAt.getTime(),
    endsAt: row.endsAt.getTime(),
    completedAt: row.completedAt ? row.completedAt.getTime() : null,
    createdAt: row.createdAt?.getTime() ?? Date.now(),
    updatedAt: row.updatedAt?.getTime() ?? Date.now(),
  });
}

function mapStreakRow(row?: StreakRow): GoalStreak {
  if (!row) {
    return createEmptyGoalStreak();
  }

  return {
    currentStreak: Number(row.currentStreak),
    bestStreak: Number(row.bestStreak),
    lastQualifiedAt: row.lastQualifiedAt ? row.lastQualifiedAt.getTime() : null,
  };
}

async function loadGoalSnapshot(userId: string): Promise<GoalSnapshot> {
  const now = new Date();
  const [goalRows, streakRows] = await Promise.all([
    db
      .select()
      .from(userGoals)
      .where(
        and(
          eq(userGoals.userId, userId),
          inArray(userGoals.status, ["active", "completed"]),
          gte(userGoals.endsAt, now),
        ),
      )
      .orderBy(asc(userGoals.startedAt)),
    db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, userId))
      .limit(1),
  ]);

  const snapshot = createEmptyGoalSnapshot();
  snapshot.streak = mapStreakRow(streakRows[0]);

  for (const row of goalRows) {
    const goal = mapGoalRow(row);
    if (goal.periodType === "daily") {
      snapshot.dailyGoal = goal;
    }
    if (goal.periodType === "weekly") {
      snapshot.weeklyGoal = goal;
    }
  }

  return snapshot;
}

async function expireStaleGoalsForUser(userId: string, now = Date.now()) {
  const activeGoals = await db
    .select()
    .from(userGoals)
    .where(and(eq(userGoals.userId, userId), eq(userGoals.status, "active")));

  for (const row of activeGoals) {
    const goal = mapGoalRow(row);
    const expiredGoal = expireGoalRecord(goal, now);
    if (expiredGoal.status !== goal.status) {
      await db
        .update(userGoals)
        .set({
          status: expiredGoal.status,
          updatedAt: new Date(expiredGoal.updatedAt),
        })
        .where(eq(userGoals.id, goal.id));
    }
  }
}

export async function getActiveGoals(userId: string): Promise<GoalSnapshot> {
  await expireStaleGoalsForUser(userId);
  return loadGoalSnapshot(userId);
}

export async function updateStreak(
  userId: string,
  completedAt: number,
  timezone: string,
) {
  const current = await db
    .select()
    .from(userStreaks)
    .where(eq(userStreaks.userId, userId))
    .limit(1);

  const nextStreak = updateGoalStreak(
    mapStreakRow(current[0]),
    completedAt,
    timezone,
  );

  await db
    .insert(userStreaks)
    .values({
      userId,
      currentStreak: nextStreak.currentStreak,
      bestStreak: nextStreak.bestStreak,
      lastQualifiedAt: nextStreak.lastQualifiedAt
        ? new Date(nextStreak.lastQualifiedAt)
        : null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userStreaks.userId,
      set: {
        currentStreak: nextStreak.currentStreak,
        bestStreak: nextStreak.bestStreak,
        lastQualifiedAt: nextStreak.lastQualifiedAt
          ? new Date(nextStreak.lastQualifiedAt)
          : null,
        updatedAt: new Date(),
      },
    });

  return nextStreak;
}

export async function completeGoal(goalId: string, completedAt = Date.now()) {
  const rows = await db
    .select()
    .from(userGoals)
    .where(eq(userGoals.id, goalId))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return null;
  }

  const goal = mapGoalRow(row);
  await db
    .update(userGoals)
    .set({
      status: "completed",
      completedAt: new Date(completedAt),
      updatedAt: new Date(completedAt),
    })
    .where(eq(userGoals.id, goalId));

  if (goal.periodType === "daily") {
    await updateStreak(row.userId, completedAt, goal.timezone);
  }

  return goalId;
}

export async function expireGoal(goalId: string) {
  await db
    .update(userGoals)
    .set({
      status: "expired",
      updatedAt: new Date(),
    })
    .where(eq(userGoals.id, goalId));
}

export async function createGoal(
  userId: string,
  input: GoalInput,
): Promise<GoalMutationResult> {
  await expireStaleGoalsForUser(userId);

  const now = Date.now();
  const timezone = input.timezone || "UTC";
  const window =
    input.startedAt && input.endsAt
      ? { startedAt: input.startedAt, endsAt: input.endsAt }
      : createGoalWindow(input.periodType, now);

  await db
    .update(userGoals)
    .set({
      status: "cancelled",
      updatedAt: new Date(now),
    })
    .where(
      and(
        eq(userGoals.userId, userId),
        eq(userGoals.periodType, input.periodType),
        eq(userGoals.status, "active"),
      ),
    );

  const baseGoal: GoalRecord = {
    id: crypto.randomUUID(),
    title: input.title,
    periodType: input.periodType,
    goalType: input.goalType,
    targetValue: input.targetValue,
    currentValue: input.currentValue ?? 0,
    requiredSessions: input.requiredSessions ?? 1,
    currentSessions: input.currentSessions ?? 0,
    status: "active",
    timezone,
    startedAt: window.startedAt,
    endsAt: window.endsAt,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const nextGoal = shouldGoalBeCompleted(baseGoal)
    ? {
        ...baseGoal,
        status: "completed" as const,
        completedAt: now,
      }
    : baseGoal;

  await db.insert(userGoals).values({
    id: nextGoal.id,
    userId,
    title: nextGoal.title,
    periodType: nextGoal.periodType,
    goalType: nextGoal.goalType,
    targetValue: nextGoal.targetValue,
    currentValue: nextGoal.currentValue,
    requiredSessions: nextGoal.requiredSessions,
    currentSessions: nextGoal.currentSessions,
    status: nextGoal.status,
    timezone: nextGoal.timezone,
    startedAt: new Date(nextGoal.startedAt),
    endsAt: new Date(nextGoal.endsAt),
    completedAt: nextGoal.completedAt ? new Date(nextGoal.completedAt) : null,
    createdAt: new Date(nextGoal.createdAt),
    updatedAt: new Date(nextGoal.updatedAt),
  });

  if (nextGoal.status === "completed" && nextGoal.periodType === "daily") {
    await updateStreak(userId, nextGoal.completedAt ?? now, nextGoal.timezone);
  }

  const snapshot = await loadGoalSnapshot(userId);
  const rewardEvents = await evaluateAndPersistRewards(userId, {
    completedGoals: nextGoal.status === "completed" ? [nextGoal] : [],
    streak: snapshot.streak,
  });

  return { snapshot, rewardEvents };
}

export async function patchGoal(
  userId: string,
  goalId: string,
  input: Partial<
    Pick<
      GoalRecord,
      "currentValue" | "currentSessions" | "status" | "completedAt"
    >
  >,
): Promise<GoalMutationResult | null> {
  const rows = await db
    .select()
    .from(userGoals)
    .where(and(eq(userGoals.id, goalId), eq(userGoals.userId, userId)))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  const goal = mapGoalRow(row);
  const now = Date.now();
  const nextGoal: GoalRecord = {
    ...goal,
    currentValue:
      input.currentValue !== undefined
        ? Math.max(goal.currentValue, Number(input.currentValue))
        : goal.currentValue,
    currentSessions:
      input.currentSessions !== undefined
        ? Math.max(goal.currentSessions, Number(input.currentSessions))
        : goal.currentSessions,
    status: input.status ?? goal.status,
    completedAt:
      input.completedAt !== undefined ? input.completedAt : goal.completedAt,
    updatedAt: now,
  };

  if (nextGoal.status === "active" && shouldGoalBeCompleted(nextGoal)) {
    nextGoal.status = "completed";
    nextGoal.completedAt = nextGoal.completedAt ?? now;
  }

  await db
    .update(userGoals)
    .set({
      currentValue: nextGoal.currentValue,
      currentSessions: nextGoal.currentSessions,
      status: nextGoal.status,
      completedAt: nextGoal.completedAt ? new Date(nextGoal.completedAt) : null,
      updatedAt: new Date(now),
    })
    .where(eq(userGoals.id, goalId));

  let streakUpdated = false;
  if (
    goal.status !== "completed" &&
    nextGoal.status === "completed" &&
    nextGoal.periodType === "daily" &&
    nextGoal.completedAt
  ) {
    await updateStreak(userId, nextGoal.completedAt, nextGoal.timezone);
    streakUpdated = true;
  }

  const snapshot = await loadGoalSnapshot(userId);
  const rewardEvents = await evaluateAndPersistRewards(userId, {
    completedGoals:
      goal.status !== "completed" && nextGoal.status === "completed"
        ? [nextGoal]
        : [],
    streak: streakUpdated ? snapshot.streak : undefined,
  });

  return { snapshot, rewardEvents };
}

export async function updateGoalProgressFromSession(
  userId: string,
  session: GoalSessionInput,
): Promise<GoalMutationResult> {
  await expireStaleGoalsForUser(userId, session.date);

  const activeRows = await db
    .select()
    .from(userGoals)
    .where(and(eq(userGoals.userId, userId), eq(userGoals.status, "active")))
    .orderBy(asc(userGoals.startedAt));

  const completedGoals: GoalRecord[] = [];
  let streakUpdated = false;

  for (const row of activeRows) {
    const goal = mapGoalRow(row);
    const nextGoal = applySessionToGoal(goal, session);

    if (
      nextGoal.currentValue !== goal.currentValue ||
      nextGoal.currentSessions !== goal.currentSessions ||
      nextGoal.status !== goal.status
    ) {
      await db
        .update(userGoals)
        .set({
          currentValue: nextGoal.currentValue,
          currentSessions: nextGoal.currentSessions,
          status: nextGoal.status,
          completedAt: nextGoal.completedAt
            ? new Date(nextGoal.completedAt)
            : null,
          updatedAt: new Date(nextGoal.updatedAt),
        })
        .where(eq(userGoals.id, goal.id));

      if (
        goal.status !== "completed" &&
        nextGoal.status === "completed" &&
        nextGoal.periodType === "daily" &&
        nextGoal.completedAt
      ) {
        await updateStreak(userId, nextGoal.completedAt, nextGoal.timezone);
        streakUpdated = true;
      }

      if (goal.status !== "completed" && nextGoal.status === "completed") {
        completedGoals.push(nextGoal);
      }
    }
  }

  const snapshot = await loadGoalSnapshot(userId);
  const rewardEvents = await evaluateAndPersistRewards(userId, {
    completedGoals,
    streak: streakUpdated ? snapshot.streak : undefined,
    session,
  });

  return { snapshot, rewardEvents };
}
