export type GoalPeriodType = "daily" | "weekly";
export type GoalType =
  | "sessions_completed"
  | "minutes_practiced"
  | "average_accuracy"
  | "target_wpm";
export type GoalStatus = "active" | "completed" | "expired" | "cancelled";

export interface GoalSessionInput {
  date: number;
  wpm: number;
  accuracy: number;
  duration: number;
  timezone?: string;
}

export interface GoalRecord {
  id: string;
  title: string;
  periodType: GoalPeriodType;
  goalType: GoalType;
  targetValue: number;
  currentValue: number;
  requiredSessions: number;
  currentSessions: number;
  status: GoalStatus;
  timezone: string;
  startedAt: number;
  endsAt: number;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface GoalStreak {
  currentStreak: number;
  bestStreak: number;
  lastQualifiedAt: number | null;
}

export interface GoalSnapshot {
  dailyGoal: GoalRecord | null;
  weeklyGoal: GoalRecord | null;
  streak: GoalStreak;
}

export type GoalReminderKind =
  | "none"
  | "no_goal"
  | "behind_today"
  | "streak_risk";

export interface GoalReminderState {
  kind: GoalReminderKind;
  title: string;
  message: string;
}

export interface GoalTemplate {
  key: string;
  title: string;
  description: string;
  periodType: GoalPeriodType;
  goalType: GoalType;
  targetValue: number;
  requiredSessions: number;
}

export interface GoalInput {
  title: string;
  periodType: GoalPeriodType;
  goalType: GoalType;
  targetValue: number;
  requiredSessions?: number;
  timezone?: string;
  startedAt: number;
  endsAt: number;
  currentValue?: number;
  currentSessions?: number;
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    key: "daily-3-sessions",
    title: "Complete 3 sessions today",
    description: "Build daily consistency with 3 focused runs.",
    periodType: "daily",
    goalType: "sessions_completed",
    targetValue: 3,
    requiredSessions: 1,
  },
  {
    key: "daily-95-accuracy",
    title: "Reach 95% accuracy in 3 sessions",
    description: "Prioritise clean technique over rushing.",
    periodType: "daily",
    goalType: "average_accuracy",
    targetValue: 95,
    requiredSessions: 3,
  },
  {
    key: "weekly-15-minutes",
    title: "Practice 15 min this week",
    description: "A realistic weekly rhythm that compounds fast.",
    periodType: "weekly",
    goalType: "minutes_practiced",
    targetValue: 15 * 60,
    requiredSessions: 1,
  },
  {
    key: "weekly-45-wpm",
    title: "Hit 45 WPM this week",
    description: "A clear speed target with visible upside.",
    periodType: "weekly",
    goalType: "target_wpm",
    targetValue: 45,
    requiredSessions: 1,
  },
];

export function createEmptyGoalStreak(): GoalStreak {
  return {
    currentStreak: 0,
    bestStreak: 0,
    lastQualifiedAt: null,
  };
}

export function createEmptyGoalSnapshot(): GoalSnapshot {
  return {
    dailyGoal: null,
    weeklyGoal: null,
    streak: createEmptyGoalStreak(),
  };
}

export function getGoalTemplates(periodType?: GoalPeriodType): GoalTemplate[] {
  return periodType
    ? GOAL_TEMPLATES.filter((template) => template.periodType === periodType)
    : GOAL_TEMPLATES;
}

export function createGoalWindow(periodType: GoalPeriodType, now = Date.now()) {
  const current = new Date(now);
  const startedAt = new Date(current);

  if (periodType === "daily") {
    startedAt.setHours(0, 0, 0, 0);
    const endsAt = new Date(startedAt);
    endsAt.setDate(endsAt.getDate() + 1);
    endsAt.setMilliseconds(-1);

    return {
      startedAt: startedAt.getTime(),
      endsAt: endsAt.getTime(),
    };
  }

  const day = startedAt.getDay();
  const diff = day === 0 ? 6 : day - 1;
  startedAt.setDate(startedAt.getDate() - diff);
  startedAt.setHours(0, 0, 0, 0);

  const endsAt = new Date(startedAt);
  endsAt.setDate(endsAt.getDate() + 7);
  endsAt.setMilliseconds(-1);

  return {
    startedAt: startedAt.getTime(),
    endsAt: endsAt.getTime(),
  };
}

export function createGoalFromTemplate(
  template: GoalTemplate,
  timezone: string,
  now = Date.now(),
): GoalRecord {
  const window = createGoalWindow(template.periodType, now);

  return {
    id: crypto.randomUUID(),
    title: template.title,
    periodType: template.periodType,
    goalType: template.goalType,
    targetValue: template.targetValue,
    currentValue: 0,
    requiredSessions: template.requiredSessions,
    currentSessions: 0,
    status: "active",
    timezone,
    startedAt: window.startedAt,
    endsAt: window.endsAt,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeGoalRecord(goal: GoalRecord): GoalRecord {
  return {
    ...goal,
    targetValue: Number(goal.targetValue),
    currentValue: Number(goal.currentValue),
    requiredSessions: Number(goal.requiredSessions),
    currentSessions: Number(goal.currentSessions),
    startedAt: Number(goal.startedAt),
    endsAt: Number(goal.endsAt),
    completedAt: goal.completedAt ? Number(goal.completedAt) : null,
    createdAt: Number(goal.createdAt),
    updatedAt: Number(goal.updatedAt),
  };
}

export function goalsMatchPlan(left: GoalRecord, right: GoalRecord): boolean {
  return (
    left.periodType === right.periodType &&
    left.goalType === right.goalType &&
    left.targetValue === right.targetValue &&
    left.requiredSessions === right.requiredSessions &&
    left.startedAt === right.startedAt &&
    left.endsAt === right.endsAt
  );
}

export function isGoalExpired(goal: GoalRecord, now = Date.now()): boolean {
  return goal.status === "active" && now > goal.endsAt;
}

export function expireGoalRecord(
  goal: GoalRecord,
  now = Date.now(),
): GoalRecord {
  if (!isGoalExpired(goal, now)) {
    return goal;
  }

  return {
    ...goal,
    status: "expired",
    updatedAt: now,
  };
}

export function shouldGoalBeCompleted(goal: GoalRecord): boolean {
  switch (goal.goalType) {
    case "sessions_completed":
    case "minutes_practiced":
    case "target_wpm":
      return goal.currentValue >= goal.targetValue;
    case "average_accuracy":
      return (
        goal.currentSessions >= goal.requiredSessions &&
        goal.currentValue >= goal.targetValue
      );
    default:
      return false;
  }
}

export function applySessionToGoal(
  goal: GoalRecord,
  session: GoalSessionInput,
): GoalRecord {
  const normalizedGoal = normalizeGoalRecord(goal);
  if (normalizedGoal.status !== "active") {
    return normalizedGoal;
  }

  if (
    session.date < normalizedGoal.startedAt ||
    session.date > normalizedGoal.endsAt
  ) {
    return normalizedGoal;
  }

  const nextGoal: GoalRecord = {
    ...normalizedGoal,
    updatedAt: session.date,
  };

  switch (normalizedGoal.goalType) {
    case "sessions_completed": {
      nextGoal.currentValue += 1;
      break;
    }
    case "minutes_practiced": {
      nextGoal.currentValue += Math.max(0, Math.round(session.duration));
      break;
    }
    case "target_wpm": {
      nextGoal.currentValue = Math.max(nextGoal.currentValue, session.wpm);
      break;
    }
    case "average_accuracy": {
      const nextSessions = nextGoal.currentSessions + 1;
      const weightedAccuracy =
        nextGoal.currentSessions > 0
          ? (nextGoal.currentValue * nextGoal.currentSessions +
              session.accuracy) /
            nextSessions
          : session.accuracy;
      nextGoal.currentSessions = nextSessions;
      nextGoal.currentValue = Math.round(weightedAccuracy);
      break;
    }
  }

  if (normalizedGoal.goalType !== "average_accuracy") {
    nextGoal.currentSessions = Math.max(
      nextGoal.currentSessions,
      normalizedGoal.currentSessions,
    );
  }

  if (shouldGoalBeCompleted(nextGoal)) {
    nextGoal.status = "completed";
    nextGoal.completedAt = session.date;
  }

  return nextGoal;
}

function getDaySerial(timestamp: number, timezone: string): number {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date(timestamp));
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

export function updateGoalStreak(
  streak: GoalStreak,
  completedAt: number,
  timezone: string,
): GoalStreak {
  const currentSerial = getDaySerial(completedAt, timezone);

  if (streak.lastQualifiedAt) {
    const previousSerial = getDaySerial(streak.lastQualifiedAt, timezone);
    if (previousSerial === currentSerial) {
      return streak;
    }

    if (previousSerial === currentSerial - 1) {
      const currentStreak = streak.currentStreak + 1;
      return {
        currentStreak,
        bestStreak: Math.max(streak.bestStreak, currentStreak),
        lastQualifiedAt: completedAt,
      };
    }
  }

  return {
    currentStreak: 1,
    bestStreak: Math.max(streak.bestStreak, 1),
    lastQualifiedAt: completedAt,
  };
}

export function getGoalSnapshotTimezone(
  snapshot: GoalSnapshot,
  fallbackTimezone = "UTC",
): string {
  return (
    snapshot.dailyGoal?.timezone ||
    snapshot.weeklyGoal?.timezone ||
    fallbackTimezone
  );
}

export function didGoalStreakChange(
  previous: GoalStreak,
  next: GoalStreak,
): boolean {
  return (
    previous.currentStreak !== next.currentStreak ||
    previous.bestStreak !== next.bestStreak ||
    previous.lastQualifiedAt !== next.lastQualifiedAt
  );
}

export function applySessionToGoalSnapshot(
  snapshot: GoalSnapshot,
  session: GoalSessionInput,
): GoalSnapshot {
  const dailyGoal = snapshot.dailyGoal
    ? expireGoalRecord(snapshot.dailyGoal, session.date)
    : null;
  const weeklyGoal = snapshot.weeklyGoal
    ? expireGoalRecord(snapshot.weeklyGoal, session.date)
    : null;

  const nextDailyGoal = dailyGoal
    ? applySessionToGoal(dailyGoal, session)
    : null;
  const nextWeeklyGoal = weeklyGoal
    ? applySessionToGoal(weeklyGoal, session)
    : null;

  const nextStreak = updateGoalStreak(
    snapshot.streak,
    session.date,
    getGoalSnapshotTimezone(snapshot, session.timezone || "UTC"),
  );

  return {
    dailyGoal: nextDailyGoal,
    weeklyGoal: nextWeeklyGoal,
    streak: nextStreak,
  };
}

export function formatGoalProgress(goal: GoalRecord): string {
  switch (goal.goalType) {
    case "sessions_completed":
      return `${goal.currentValue}/${goal.targetValue} sessions`;
    case "minutes_practiced":
      return `${Math.floor(goal.currentValue / 60)}/${Math.floor(
        goal.targetValue / 60,
      )} min`;
    case "target_wpm":
      return `${goal.currentValue}/${goal.targetValue} WPM`;
    case "average_accuracy":
      return `${goal.currentSessions}/${goal.requiredSessions} sessions · ${goal.currentValue}% avg`;
    default:
      return "In progress";
  }
}

export function getGoalProgressRatio(goal: GoalRecord): number {
  if (goal.goalType === "average_accuracy") {
    if (goal.currentSessions < goal.requiredSessions) {
      return Math.min(goal.currentSessions / goal.requiredSessions, 1);
    }

    return Math.min(goal.currentValue / goal.targetValue, 1);
  }

  return Math.min(goal.currentValue / goal.targetValue, 1);
}

export function formatGoalLabel(goal: GoalRecord): string {
  return goal.periodType === "daily" ? "Today's Goal" : "Weekly Goal";
}

export function serializeGoalInput(goal: GoalRecord): GoalInput {
  return {
    title: goal.title,
    periodType: goal.periodType,
    goalType: goal.goalType,
    targetValue: goal.targetValue,
    requiredSessions: goal.requiredSessions,
    timezone: goal.timezone,
    startedAt: goal.startedAt,
    endsAt: goal.endsAt,
    currentValue: goal.currentValue,
    currentSessions: goal.currentSessions,
  };
}

export function getPrimaryGoal(snapshot: GoalSnapshot): GoalRecord | null {
  return snapshot.dailyGoal ?? snapshot.weeklyGoal;
}

export function getGoalReminderState(
  snapshot: GoalSnapshot,
  now = Date.now(),
): GoalReminderState {
  if (!snapshot.dailyGoal && !snapshot.weeklyGoal) {
    return {
      kind: "no_goal",
      title: "No active goal",
      message: "Set a daily or weekly target to keep momentum visible.",
    };
  }

  const dailyGoal = snapshot.dailyGoal;
  if (dailyGoal && dailyGoal.status === "active") {
    const windowProgress = Math.min(
      Math.max(
        (now - dailyGoal.startedAt) / (dailyGoal.endsAt - dailyGoal.startedAt),
        0,
      ),
      1,
    );
    const goalProgress = getGoalProgressRatio(dailyGoal);

    if (windowProgress >= 0.6 && goalProgress < windowProgress * 0.75) {
      return {
        kind: "behind_today",
        title: "Behind today",
        message: "A short focused run now keeps your daily goal realistic.",
      };
    }
  }

  if (snapshot.streak.currentStreak > 0 && snapshot.streak.lastQualifiedAt) {
    const last = new Date(snapshot.streak.lastQualifiedAt);
    const current = new Date(now);
    const isSameDay =
      last.getFullYear() === current.getFullYear() &&
      last.getMonth() === current.getMonth() &&
      last.getDate() === current.getDate();

    if (!isSameDay && current.getHours() >= 18) {
      return {
        kind: "streak_risk",
        title: "Streak at risk",
        message: "One session tonight protects your current streak.",
      };
    }
  }

  return {
    kind: "none",
    title: "On track",
    message: "Keep your rhythm and close your active goal window.",
  };
}
