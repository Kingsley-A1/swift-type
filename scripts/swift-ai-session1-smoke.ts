import { resolveSwiftAIToolParts } from "../src/lib/swift-ai-tool-parts.ts";

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(
      message ?? `Expected ${String(expected)}, received ${String(actual)}`,
    );
  }
}

function main() {
  const createGoal = resolveSwiftAIToolParts([
    {
      type: "tool-createGoal",
      state: "output-available",
      output: JSON.stringify({
        success: true,
        goalTitle: "Complete 3 sessions today",
        goalSnapshot: {
          dailyGoal: {
            id: "goal-1",
            title: "Complete 3 sessions today",
            periodType: "daily",
            goalType: "sessions_completed",
            targetValue: 3,
            currentValue: 0,
            requiredSessions: 1,
            currentSessions: 0,
            status: "active",
            timezone: "UTC",
            startedAt: 1,
            endsAt: 2,
            completedAt: null,
            createdAt: 1,
            updatedAt: 1,
          },
          weeklyGoal: null,
          streak: {
            currentStreak: 1,
            bestStreak: 1,
            lastQualifiedAt: 1,
          },
        },
        rewardEvents: [
          {
            id: "reward-1",
            rewardType: "goal_completion",
            rewardKey: "goal:goal-1",
            title: "Daily Goal Complete",
            description: "Complete 3 sessions today",
            earnedAt: 1,
          },
        ],
      }),
      toolCallId: "goal-1",
    },
  ]);
  assertEqual(createGoal.length, 1);
  assertEqual(createGoal[0]?.kind, "create-goal");
  assertEqual(
    createGoal[0]?.label,
    "Complete 3 sessions today · View Goals",
  );
  if (createGoal[0]?.kind === "create-goal") {
    assertEqual(createGoal[0].goalSnapshot?.streak.currentStreak, 1);
    assertEqual(createGoal[0].rewardEvents?.[0]?.rewardKey, "goal:goal-1");
  }

  const navigate = resolveSwiftAIToolParts([
    {
      type: "tool-navigateTo",
      state: "input-available",
      input: { target: "reviews", label: "Open Reviews Panel" },
      toolCallId: "nav-1",
    },
  ]);
  assertEqual(navigate.length, 1);
  assertEqual(navigate[0]?.kind, "navigate");
  assertEqual(navigate[0]?.label, "Open Reviews Panel");

  const session = resolveSwiftAIToolParts([
    {
      type: "tool-startSession",
      state: "input-available",
      input: { mode: "timed", level: "intermediate", duration: 60 },
      toolCallId: "session-1",
    },
  ]);
  assertEqual(session.length, 1);
  assertEqual(session[0]?.kind, "start-session");
  assertEqual(session[0]?.label, "Start timed session");

  const malformed = resolveSwiftAIToolParts([
    {
      type: "tool-navigateTo",
      state: "output-available",
      output: "{bad json",
      toolCallId: "broken-1",
    },
  ]);
  assertEqual(malformed.length, 1);
  assertEqual(malformed[0]?.kind, "error");

  console.log("Swift AI Session 1 smoke passed");
}

main();
