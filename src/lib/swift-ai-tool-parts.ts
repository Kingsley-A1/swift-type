import type { GoalSnapshot } from "./goals";
import type { RewardRecord } from "./rewards";

export interface SwiftAISessionConfig {
  mode: "timed" | "words" | "curriculum";
  level: "beginner" | "intermediate" | "advanced";
  duration?: number;
  wordCount?: number;
}

export type SwiftAIToolTarget =
  | "goals"
  | "history"
  | "guide"
  | "rewards"
  | "profile"
  | "reviews"
  | "privacy"
  | "terms";

export type SwiftAIToolDescriptor =
  | {
      id: string;
      kind: "pending";
      label: string;
    }
  | {
      id: string;
      kind: "create-goal";
      label: string;
      target: "goals";
      goalSnapshot?: GoalSnapshot;
      rewardEvents?: RewardRecord[];
    }
  | {
      id: string;
      kind: "navigate";
      label: string;
      target: SwiftAIToolTarget;
    }
  | {
      id: string;
      kind: "start-session";
      label: string;
      config: SwiftAISessionConfig;
    }
  | {
      id: string;
      kind: "error";
      label: string;
    };

interface ToolPartLike {
  type?: unknown;
  state?: unknown;
  input?: unknown;
  output?: unknown;
  toolCallId?: unknown;
}

const validTargets = new Set<SwiftAIToolTarget>([
  "goals",
  "history",
  "guide",
  "rewards",
  "profile",
  "reviews",
  "privacy",
  "terms",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function parsePayload(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string") {
    try {
      return asRecord(JSON.parse(value));
    } catch {
      return null;
    }
  }

  return asRecord(value);
}

function getToolName(part: ToolPartLike): string | null {
  return typeof part.type === "string" && part.type.startsWith("tool-")
    ? part.type.slice(5)
    : null;
}

function getToolId(part: ToolPartLike, fallback: string): string {
  return typeof part.toolCallId === "string" ? part.toolCallId : fallback;
}

function parseNavigationPayload(payload: Record<string, unknown> | null) {
  if (!payload || !validTargets.has(payload.target as SwiftAIToolTarget)) {
    return null;
  }

  return {
    target: payload.target as SwiftAIToolTarget,
    label:
      typeof payload.label === "string" && payload.label.trim().length > 0
        ? payload.label
        : `Open ${payload.target}`,
  };
}

function parseSessionPayload(payload: Record<string, unknown> | null) {
  if (!payload) {
    return null;
  }

  const mode = payload.mode;
  const level = payload.level;
  if (
    (mode !== "timed" && mode !== "words" && mode !== "curriculum") ||
    (level !== "beginner" && level !== "intermediate" && level !== "advanced")
  ) {
    return null;
  }

  return {
    mode,
    level,
    duration:
      typeof payload.duration === "number" ? payload.duration : undefined,
    wordCount:
      typeof payload.wordCount === "number" ? payload.wordCount : undefined,
  } as SwiftAISessionConfig;
}

function parseGoalSnapshot(value: unknown): GoalSnapshot | undefined {
  const snapshot = asRecord(value);
  if (!snapshot) {
    return undefined;
  }

  const streak = asRecord(snapshot.streak);
  if (!streak) {
    return undefined;
  }

  return value as GoalSnapshot;
}

function parseRewardEvents(value: unknown): RewardRecord[] | undefined {
  return Array.isArray(value) ? (value as RewardRecord[]) : undefined;
}

export function resolveSwiftAIToolParts(
  parts: readonly unknown[],
): SwiftAIToolDescriptor[] {
  const descriptors: SwiftAIToolDescriptor[] = [];

  parts.forEach((part, index) => {
    const candidate = asRecord(part) as ToolPartLike | null;
    if (!candidate) {
      return;
    }

    const toolName = getToolName(candidate);
    if (!toolName) {
      return;
    }

    const id = getToolId(candidate, `${toolName}-${index}`);

    if (candidate.state === "input-streaming") {
      descriptors.push({
        id,
        kind: "pending",
        label: "Taking action...",
      });
      return;
    }

    if (
      candidate.state !== "input-available" &&
      candidate.state !== "output-available"
    ) {
      return;
    }

    if (toolName === "createGoal") {
      const payload = parsePayload(candidate.output);
      if (payload?.success === true) {
        descriptors.push({
          id,
          kind: "create-goal",
          label:
            typeof payload.goalTitle === "string" && payload.goalTitle.trim()
              ? `${payload.goalTitle} · View Goals`
              : "Goal created · View Goals",
          target: "goals",
          goalSnapshot: parseGoalSnapshot(payload.goalSnapshot),
          rewardEvents: parseRewardEvents(payload.rewardEvents),
        });
        return;
      }

      descriptors.push({
        id,
        kind: "error",
        label:
          typeof payload?.error === "string" && payload.error.trim()
            ? payload.error
            : "Goal action unavailable",
      });
      return;
    }

    if (toolName === "navigateTo") {
      const payload =
        parseNavigationPayload(parsePayload(candidate.input)) ||
        parseNavigationPayload(parsePayload(candidate.output));

      if (payload) {
        descriptors.push({
          id,
          kind: "navigate",
          label: payload.label,
          target: payload.target,
        });
        return;
      }

      descriptors.push({
        id,
        kind: "error",
        label: "Navigation action unavailable",
      });
      return;
    }

    if (toolName === "startSession") {
      const payload =
        parseSessionPayload(parsePayload(candidate.input)) ||
        parseSessionPayload(parsePayload(candidate.output));

      if (payload) {
        descriptors.push({
          id,
          kind: "start-session",
          label: `Start ${payload.mode} session`,
          config: payload,
        });
        return;
      }

      descriptors.push({
        id,
        kind: "error",
        label: "Session action unavailable",
      });
    }
  });

  return descriptors;
}
