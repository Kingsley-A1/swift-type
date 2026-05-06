export type TypingLevel = "beginner" | "intermediate" | "advanced";

export interface TimedDurationChoice {
  seconds: number;
  label: string;
}

export const TIMED_DURATION_CHOICES: TimedDurationChoice[] = Array.from(
  { length: 15 },
  (_, index) => {
    const minutes = index + 1;

    return {
      seconds: minutes * 60,
      label: `${minutes} min`,
    };
  },
);

function normalizeTypingLevel(level: string): TypingLevel {
  if (level === "advanced" || level === "intermediate" || level === "beginner") {
    return level;
  }

  return "beginner";
}

export function getTimedWordCount(level: string, durationSeconds: number): number {
  const normalizedLevel = normalizeTypingLevel(level);
  const baselineWpmByLevel: Record<TypingLevel, number> = {
    beginner: 18,
    intermediate: 45,
    advanced: 75,
  };

  const boundedDuration = Math.max(15, Math.floor(durationSeconds || 60));
  const expectedWords = (baselineWpmByLevel[normalizedLevel] * boundedDuration) / 60;

  // Keep a small buffer so users rarely run out of words, but avoid impossible targets.
  return Math.max(18, Math.ceil(expectedWords * 1.15) + 8);
}
