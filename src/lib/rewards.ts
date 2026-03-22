import type { GoalRecord, GoalSessionInput, GoalStreak } from "@/lib/goals";

export type RewardType = "goal_completion" | "streak" | "milestone" | "rank";

export interface RewardUnlock {
  rewardType: RewardType;
  rewardKey: string;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface RewardRecord extends RewardUnlock {
  id: string;
  earnedAt: number;
}

export interface RewardEvaluationInput {
  completedGoals?: GoalRecord[];
  streak?: GoalStreak;
  session?: GoalSessionInput;
}

function toCount(value: number | undefined) {
  return Number.isFinite(value) ? Number(value) : 0;
}

export function createRewardRecord(
  unlock: RewardUnlock,
  earnedAt = Date.now(),
): RewardRecord {
  return {
    id: crypto.randomUUID(),
    earnedAt,
    ...unlock,
  };
}

export function evaluateRewardUnlocks(
  existingRewardKeys: Set<string>,
  input: RewardEvaluationInput,
): RewardUnlock[] {
  const unlocks: RewardUnlock[] = [];

  const addUnlock = (unlock: RewardUnlock) => {
    if (existingRewardKeys.has(unlock.rewardKey)) {
      return;
    }

    existingRewardKeys.add(unlock.rewardKey);
    unlocks.push(unlock);
  };

  const completedGoals = input.completedGoals ?? [];
  for (const goal of completedGoals) {
    const periodLabel = goal.periodType === "daily" ? "Daily" : "Weekly";
    addUnlock({
      rewardType: "goal_completion",
      rewardKey: `goal:${goal.id}`,
      title: `${periodLabel} Goal Complete`,
      description: goal.title,
      metadata: {
        goalId: goal.id,
        goalTitle: goal.title,
        periodType: goal.periodType,
        goalType: goal.goalType,
        targetValue: goal.targetValue,
        completedAt: goal.completedAt,
      },
    });

    if (goal.periodType === "daily") {
      addUnlock({
        rewardType: "rank",
        rewardKey: "rank:starter",
        title: "Rank Unlocked: Starter",
        description: "You completed your first daily commitment.",
      });
    }

    if (goal.periodType === "weekly") {
      addUnlock({
        rewardType: "rank",
        rewardKey: "rank:fluent",
        title: "Rank Unlocked: Fluent",
        description: "You closed out a weekly objective with consistency.",
      });
    }
  }

  const streak = input.streak;
  const currentStreak = toCount(streak?.currentStreak);
  if (currentStreak >= 3) {
    addUnlock({
      rewardType: "streak",
      rewardKey: "streak:3",
      title: "3-Day Streak",
      description: "Consistency is becoming a habit.",
      metadata: { threshold: 3, currentStreak },
    });

    addUnlock({
      rewardType: "rank",
      rewardKey: "rank:consistent",
      title: "Rank Unlocked: Consistent",
      description: "Three focused days in a row.",
    });
  }

  if (currentStreak >= 7) {
    addUnlock({
      rewardType: "streak",
      rewardKey: "streak:7",
      title: "7-Day Streak",
      description: "A full week of deliberate practice.",
      metadata: { threshold: 7, currentStreak },
    });

    addUnlock({
      rewardType: "rank",
      rewardKey: "rank:focused",
      title: "Rank Unlocked: Focused",
      description: "One week of sustained typing discipline.",
    });
  }

  if (currentStreak >= 30) {
    addUnlock({
      rewardType: "streak",
      rewardKey: "streak:30",
      title: "30-Day Streak",
      description: "Elite-level consistency unlocked.",
      metadata: { threshold: 30, currentStreak },
    });

    addUnlock({
      rewardType: "rank",
      rewardKey: "rank:elite",
      title: "Rank Unlocked: Elite",
      description: "You sustained momentum for a full month.",
    });
  }

  const session = input.session;
  if (session) {
    if (toCount(session.wpm) >= 50) {
      addUnlock({
        rewardType: "milestone",
        rewardKey: "milestone:wpm50",
        title: "Speed Milestone: 50 WPM",
        description: "You broke through the 50 WPM barrier.",
        metadata: { wpm: session.wpm },
      });

      addUnlock({
        rewardType: "rank",
        rewardKey: "rank:velocity",
        title: "Rank Unlocked: Velocity",
        description: "Your speed now has real momentum.",
      });
    }

    if (toCount(session.accuracy) >= 95) {
      addUnlock({
        rewardType: "milestone",
        rewardKey: "milestone:accuracy95",
        title: "Precision Milestone: 95% Accuracy",
        description: "You delivered a high-precision session.",
        metadata: { accuracy: session.accuracy },
      });
    }
  }

  return unlocks;
}
