import type { SessionHistory } from "@/store/useTypingStore";
import { useTypingStore } from "@/store/useTypingStore";
import {
  GoalInput,
  GoalRecord,
  GoalSnapshot,
  goalsMatchPlan,
  serializeGoalInput,
} from "@/lib/goals";
import { RewardRecord } from "@/lib/rewards";

function applyGoalSnapshot(snapshot?: GoalSnapshot | null) {
  if (!snapshot) {
    return;
  }

  useTypingStore.getState().setGoalSnapshot(snapshot);
}

function applyRewardEvents(events?: RewardRecord[] | null) {
  if (!events || events.length === 0) {
    return;
  }

  useTypingStore.getState().addRewardEvents(events);
}

export function applyGoalMutationResult(
  snapshot?: GoalSnapshot | null,
  rewardEvents?: RewardRecord[] | null,
) {
  applyGoalSnapshot(snapshot);
  applyRewardEvents(rewardEvents);
}

export async function syncSessionToServer(session: SessionHistory) {
  try {
    const response = await fetch("/api/sync/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    applyGoalMutationResult(data.goalSnapshot, data.rewardEvents);
  } catch {
    // Silently fail — localStorage is the source of truth
  }
}

export async function syncStatsToServer() {
  const { perKeyStats, nGramStats } = useTypingStore.getState();
  try {
    await fetch("/api/sync/stats", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ perKeyStats, nGramStats }),
    });
  } catch {
    // Silently fail
  }
}

export async function mergeLocalDataToServer() {
  const { savedSessions, perKeyStats, nGramStats } = useTypingStore.getState();
  if (savedSessions.length === 0 && Object.keys(perKeyStats).length === 0)
    return;

  try {
    const response = await fetch("/api/sync/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savedSessions, perKeyStats, nGramStats }),
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    applyGoalMutationResult(data.goalSnapshot, data.rewardEvents);
  } catch {
    // Silently fail
  }
}

export async function fetchGoalsFromServer() {
  try {
    const response = await fetch("/api/goals", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as
      | GoalSnapshot
      | { goalSnapshot: GoalSnapshot; rewardEvents?: RewardRecord[] };
    const snapshot = "goalSnapshot" in data ? data.goalSnapshot : data;
    const rewardEvents =
      "goalSnapshot" in data ? (data.rewardEvents ?? []) : [];
    applyGoalMutationResult(snapshot, rewardEvents);
    return snapshot;
  } catch {
    return null;
  }
}

export async function createGoalOnServer(goal: GoalInput) {
  const response = await fetch("/api/goals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(goal),
  });

  if (!response.ok) {
    throw new Error("Unable to create goal");
  }

  const data = (await response.json()) as {
    goalSnapshot: GoalSnapshot;
    rewardEvents?: RewardRecord[];
  };
  applyGoalMutationResult(data.goalSnapshot, data.rewardEvents);
  return data.goalSnapshot;
}

export async function patchGoalOnServer(
  goalId: string,
  patch: Partial<
    Pick<
      GoalRecord,
      "currentValue" | "currentSessions" | "status" | "completedAt"
    >
  >,
) {
  const response = await fetch(`/api/goals/${goalId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    throw new Error("Unable to update goal");
  }

  const data = (await response.json()) as {
    goalSnapshot: GoalSnapshot;
    rewardEvents?: RewardRecord[];
  };
  applyGoalMutationResult(data.goalSnapshot, data.rewardEvents);
  return data.goalSnapshot;
}

export async function fetchRewardsFromServer() {
  try {
    const response = await fetch("/api/rewards", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      rewards: RewardRecord[];
      recentGoalCompletions: Array<{
        id: string;
        title: string;
        periodType: string;
        completedAt: number | null;
      }>;
      streakSummary?: GoalSnapshot["streak"];
    };

    useTypingStore.getState().hydrateRewardHistory(data.rewards);
    if (data.streakSummary) {
      useTypingStore.getState().setGoalSnapshot({
        dailyGoal: useTypingStore.getState().dailyGoal,
        weeklyGoal: useTypingStore.getState().weeklyGoal,
        streak: data.streakSummary,
      });
    }

    return data;
  } catch {
    return null;
  }
}

export async function mergeLocalGoalsToServer() {
  const { dailyGoal, weeklyGoal } = useTypingStore.getState();
  const remoteSnapshot = await fetchGoalsFromServer();
  if (!remoteSnapshot) {
    return;
  }

  const reconcileGoal = async (
    localGoal: GoalRecord | null,
    remoteGoal: GoalRecord | null,
  ) => {
    if (!localGoal || localGoal.status === "cancelled") {
      return;
    }

    if (!remoteGoal) {
      await createGoalOnServer(serializeGoalInput(localGoal));
      return;
    }

    if (
      goalsMatchPlan(localGoal, remoteGoal) &&
      (localGoal.currentValue > remoteGoal.currentValue ||
        localGoal.currentSessions > remoteGoal.currentSessions ||
        (localGoal.status === "completed" && remoteGoal.status !== "completed"))
    ) {
      await patchGoalOnServer(remoteGoal.id, {
        currentValue: localGoal.currentValue,
        currentSessions: localGoal.currentSessions,
        status: localGoal.status === "completed" ? "completed" : undefined,
        completedAt: localGoal.completedAt ?? undefined,
      });
    }
  };

  await reconcileGoal(dailyGoal, remoteSnapshot.dailyGoal);
  await reconcileGoal(weeklyGoal, remoteSnapshot.weeklyGoal);
  // Removed: redundant second fetchGoalsFromServer() call — the snapshot
  // returned from patchGoalOnServer already reflects the updated state.
}
