import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  GoalPeriodType,
  GoalRecord,
  GoalSnapshot,
  GoalStreak,
  applySessionToGoalSnapshot,
  createEmptyGoalSnapshot,
} from "@/lib/goals";
import {
  RewardRecord,
  createRewardRecord,
  evaluateRewardUnlocks,
} from "@/lib/rewards";

export interface WpmDataPoint {
  second: number;
  wpm: number;
  raw: number;
}

export interface SessionHistory {
  id: string;
  date: number;
  wpm: number;
  accuracy: number;
  mode: string;
  duration: number;
  keystrokes: number;
  historyData: WpmDataPoint[];
}

export interface KeyStats {
  hits: number;
  misses: number;
  totalTimeMs: number; // For identifying slow keys
}

// Track bigrams for N-gram adaptive learning
export interface NGramStats {
  occurrences: number;
  misses: number;
  totalTimeMs: number;
}

function getUpdatedGoalState(
  state: Pick<TypeState, "dailyGoal" | "weeklyGoal" | "goalStreak">,
  session: SessionHistory,
) {
  const snapshot = applySessionToGoalSnapshot(
    {
      dailyGoal: state.dailyGoal,
      weeklyGoal: state.weeklyGoal,
      streak: state.goalStreak,
    },
    session,
  );

  return {
    dailyGoal: snapshot.dailyGoal,
    weeklyGoal: snapshot.weeklyGoal,
    goalStreak: snapshot.streak,
  };
}

function getVisibleGoal(goal: GoalRecord | null, now = Date.now()) {
  if (!goal) {
    return null;
  }

  if (now > goal.endsAt) {
    return null;
  }

  return goal;
}

function getNewlyCompletedGoals(
  previousState: Pick<TypeState, "dailyGoal" | "weeklyGoal">,
  nextState: Pick<TypeState, "dailyGoal" | "weeklyGoal">,
): GoalRecord[] {
  const completedGoals: GoalRecord[] = [];

  const evaluateTransition = (
    previousGoal: GoalRecord | null,
    nextGoal: GoalRecord | null,
  ) => {
    if (!previousGoal || !nextGoal) {
      return;
    }

    if (
      previousGoal.id === nextGoal.id &&
      previousGoal.status !== "completed" &&
      nextGoal.status === "completed"
    ) {
      completedGoals.push(nextGoal);
    }
  };

  evaluateTransition(previousState.dailyGoal, nextState.dailyGoal);
  evaluateTransition(previousState.weeklyGoal, nextState.weeklyGoal);

  return completedGoals;
}

function getLocalRewardEvents(
  state: Pick<TypeState, "dailyGoal" | "weeklyGoal" | "goalStreak" | "rewards">,
  session: SessionHistory,
  nextGoalState: Pick<TypeState, "dailyGoal" | "weeklyGoal" | "goalStreak">,
): RewardRecord[] {
  const completedGoals = getNewlyCompletedGoals(state, nextGoalState);
  const existingKeys = new Set(state.rewards.map((reward) => reward.rewardKey));
  const unlocks = evaluateRewardUnlocks(existingKeys, {
    completedGoals,
    streak: nextGoalState.goalStreak,
    session,
  });

  return unlocks.map((unlock) => createRewardRecord(unlock, session.date));
}

interface TypeState {
  // Config
  level: string;
  duration: number;
  wordCount: number;
  curriculumStage: number;
  mode: "timed" | "words" | "curriculum";
  hasPlayedIntro: boolean;

  // Active Session
  isActive: boolean;
  isFinished: boolean;
  timeLeft: number;
  targetText: string;
  typedText: string;
  wordIndex: number;
  charIndex: number;

  // Real-time Analytics
  startTime: number | null;
  lastKeystrokeTime: number | null;
  mistakes: number;
  keystrokes: number;
  wpmHistory: WpmDataPoint[];
  perKeyStats: Record<string, KeyStats>;
  nGramStats: Record<string, NGramStats>; // New for Phase 4

  // Global History (Persisted)
  savedSessions: SessionHistory[];
  dailyGoal: GoalRecord | null;
  weeklyGoal: GoalRecord | null;
  goalStreak: GoalStreak;
  rewards: RewardRecord[];
  rewardQueue: RewardRecord[];

  // Actions
  setConfig: (
    config: Partial<
      Pick<
        TypeState,
        | "level"
        | "duration"
        | "wordCount"
        | "curriculumStage"
        | "mode"
        | "hasPlayedIntro"
      >
    >,
  ) => void;
  startSession: (text: string) => void;
  resetSession: () => void;
  typeChar: (char: string) => void;
  deleteChar: () => void;
  tick: () => void;
  endSession: () => void;
  clearHistory: () => void;
  setGoalSnapshot: (snapshot: GoalSnapshot) => void;
  setLocalGoal: (goal: GoalRecord) => void;
  cancelLocalGoal: (periodType: GoalPeriodType) => void;
  refreshGoalStatuses: () => void;
  addRewardEvents: (rewards: RewardRecord[]) => void;
  clearRewardQueue: () => void;
  hydrateRewardHistory: (rewards: RewardRecord[]) => void;
}

export const useTypingStore = create<TypeState>()(
  persist(
    (set, get): TypeState => ({
      level: "beginner",
      duration: 60,
      wordCount: 30,
      curriculumStage: 1,
      mode: "timed",
      hasPlayedIntro: false,

      isActive: false,
      isFinished: false,
      timeLeft: 60,
      targetText:
        "swift type teaches you touch typing happy learning click enter to start",
      typedText: "",
      wordIndex: 0,
      charIndex: 0,

      startTime: null,
      lastKeystrokeTime: null,
      mistakes: 0,
      keystrokes: 0,
      wpmHistory: [],
      perKeyStats: {},
      nGramStats: {},

      savedSessions: [],
      dailyGoal: null,
      weeklyGoal: null,
      goalStreak: createEmptyGoalSnapshot().streak,
      rewards: [],
      rewardQueue: [],

      setConfig: (
        config: Partial<
          Pick<
            TypeState,
            | "level"
            | "duration"
            | "wordCount"
            | "curriculumStage"
            | "mode"
            | "hasPlayedIntro"
          >
        >,
      ) => set((state: TypeState) => ({ ...state, ...config })),

      startSession: (text: string) =>
        set({
          isActive: true,
          isFinished: false,
          timeLeft: get().duration,
          targetText: text,
          typedText: "",
          wordIndex: 0,
          charIndex: 0,
          startTime: Date.now(),
          lastKeystrokeTime: Date.now(),
          mistakes: 0,
          keystrokes: 0,
          wpmHistory: [],
        }),

      resetSession: () =>
        set({
          isActive: false,
          isFinished: false,
          timeLeft: get().duration,
          typedText: "",
          charIndex: 0,
          startTime: null,
          lastKeystrokeTime: null,
          mistakes: 0,
          keystrokes: 0,
          wpmHistory: [],
        }),

      typeChar: (char: string) =>
        set((state: TypeState) => {
          if (!state.isActive) return state;

          const isCorrect = state.targetText[state.typedText.length] === char;
          const targetChar = state.targetText[state.typedText.length];
          const now = Date.now();
          const timeDiff = state.lastKeystrokeTime
            ? now - state.lastKeystrokeTime
            : 0;

          // Track N-gram / Per-Key stats for adaptive learning
          const currentKeyStats = state.perKeyStats[targetChar] || {
            hits: 0,
            misses: 0,
            totalTimeMs: 0,
          };

          // N-gram logic: bigram tracking (previous char + current char)
          let newNGramStats = state.nGramStats;
          if (state.typedText.length > 0) {
            const prevChar = state.targetText[state.typedText.length - 1];
            // Only track alphabetic n-grams
            if (/[a-zA-Z]/.test(prevChar) && /[a-zA-Z]/.test(targetChar)) {
              const bigram = (prevChar + targetChar).toLowerCase();
              const currentBgStats = state.nGramStats[bigram] || {
                occurrences: 0,
                misses: 0,
                totalTimeMs: 0,
              };
              newNGramStats = {
                ...state.nGramStats,
                [bigram]: {
                  occurrences: currentBgStats.occurrences + 1,
                  misses: currentBgStats.misses + (!isCorrect ? 1 : 0),
                  totalTimeMs: currentBgStats.totalTimeMs + timeDiff,
                },
              };
            }
          }

          const newTypedText = state.typedText + char;
          const isFinished = newTypedText.length >= state.targetText.length;

          const updateObj: any = {
            typedText: newTypedText,
            keystrokes: state.keystrokes + 1,
            mistakes: state.mistakes + (isCorrect ? 0 : 1),
            lastKeystrokeTime: now,
            perKeyStats: {
              ...state.perKeyStats,
              [targetChar]: {
                hits: currentKeyStats.hits + (isCorrect ? 1 : 0),
                misses: currentKeyStats.misses + (!isCorrect ? 1 : 0),
                totalTimeMs: currentKeyStats.totalTimeMs + timeDiff,
              },
            },
            nGramStats: newNGramStats,
          };

          if (isFinished) {
            const timeElapsedStr = (now - (state.startTime || now)) / 1000 / 60;
            const rawWPM =
              timeElapsedStr > 0
                ? updateObj.keystrokes / 5 / timeElapsedStr
                : 0;
            const netWPM =
              timeElapsedStr > 0
                ? Math.max(
                    0,
                    Math.round(
                      (updateObj.keystrokes - updateObj.mistakes) /
                        5 /
                        timeElapsedStr,
                    ),
                  )
                : 0;
            const accuracy =
              updateObj.keystrokes > 0
                ? Math.round(
                    ((updateObj.keystrokes - updateObj.mistakes) /
                      updateObj.keystrokes) *
                      100,
                  )
                : 0;

            const newSession: SessionHistory = {
              id: crypto.randomUUID(),
              date: now,
              wpm: netWPM,
              accuracy,
              mode: state.mode,
              duration: state.duration - state.timeLeft, // how long it took
              keystrokes: updateObj.keystrokes,
              historyData: state.wpmHistory,
            };

            const nextGoalState = getUpdatedGoalState(state, newSession);
            const localRewardEvents = getLocalRewardEvents(
              state,
              newSession,
              nextGoalState,
            );

            Object.assign(updateObj, {
              isActive: false,
              isFinished: true,
              savedSessions: [newSession, ...state.savedSessions].slice(0, 200),
              rewards: [...localRewardEvents, ...state.rewards].slice(0, 120),
              rewardQueue: [...state.rewardQueue, ...localRewardEvents],
              ...nextGoalState,
            });
          }

          return updateObj;
        }),

      deleteChar: () =>
        set((state: TypeState) => {
          if (!state.isActive || state.typedText.length === 0) return state;
          return {
            typedText: state.typedText.slice(0, -1),
          };
        }),

      tick: () =>
        set((state: TypeState) => {
          if (!state.isActive) return state;

          const now = Date.now();
          const timeElapsedStr = (now - (state.startTime || now)) / 1000 / 60;
          const rawWPM =
            timeElapsedStr > 0 ? state.keystrokes / 5 / timeElapsedStr : 0;
          const netWPM =
            timeElapsedStr > 0
              ? Math.max(
                  0,
                  Math.round(
                    (state.keystrokes - state.mistakes) / 5 / timeElapsedStr,
                  ),
                )
              : 0;

          const currentElapsedSeconds = Math.floor(
            (now - (state.startTime || now)) / 1000,
          );
          const newWpmHistory = [
            ...state.wpmHistory,
            {
              second: currentElapsedSeconds,
              wpm: netWPM,
              raw: Math.round(rawWPM),
            },
          ];

          if (state.mode !== "timed") {
            return { wpmHistory: newWpmHistory };
          }

          if (state.timeLeft <= 1) {
            // Finish session, save history
            const accuracy =
              state.keystrokes > 0
                ? Math.round(
                    ((state.keystrokes - state.mistakes) / state.keystrokes) *
                      100,
                  )
                : 0;

            const newSession: SessionHistory = {
              id: crypto.randomUUID(),
              date: now,
              wpm: netWPM,
              accuracy,
              mode: state.mode,
              duration: state.duration,
              keystrokes: state.keystrokes,
              historyData: newWpmHistory,
            };

            const nextGoalState = getUpdatedGoalState(state, newSession);
            const localRewardEvents = getLocalRewardEvents(
              state,
              newSession,
              nextGoalState,
            );

            return {
              timeLeft: 0,
              isActive: false,
              isFinished: true,
              wpmHistory: newWpmHistory,
              savedSessions: [newSession, ...state.savedSessions].slice(0, 200), // Keep last 200
              rewards: [...localRewardEvents, ...state.rewards].slice(0, 120),
              rewardQueue: [...state.rewardQueue, ...localRewardEvents],
              ...nextGoalState,
            };
          }

          return {
            timeLeft: state.timeLeft - 1,
            wpmHistory: newWpmHistory,
          };
        }),

      endSession: () =>
        set((state: TypeState) => {
          const timeElapsedStr =
            (Date.now() - (state.startTime || Date.now())) / 1000 / 60;
          const rawWPM =
            timeElapsedStr > 0 ? state.keystrokes / 5 / timeElapsedStr : 0;
          const netWPM =
            timeElapsedStr > 0
              ? Math.max(
                  0,
                  Math.round(
                    (state.keystrokes - state.mistakes) / 5 / timeElapsedStr,
                  ),
                )
              : 0;
          const accuracy =
            state.keystrokes > 0
              ? Math.round(
                  ((state.keystrokes - state.mistakes) / state.keystrokes) *
                    100,
                )
              : 0;

          const newSession: SessionHistory = {
            id: crypto.randomUUID(),
            date: Date.now(),
            wpm: netWPM,
            accuracy,
            mode: state.mode,
            duration: state.duration - state.timeLeft,
            keystrokes: state.keystrokes,
            historyData: state.wpmHistory,
          };

          const nextGoalState = getUpdatedGoalState(state, newSession);
          const localRewardEvents = getLocalRewardEvents(
            state,
            newSession,
            nextGoalState,
          );

          return {
            isActive: false,
            isFinished: true,
            savedSessions: [newSession, ...state.savedSessions].slice(0, 200),
            rewards: [...localRewardEvents, ...state.rewards].slice(0, 120),
            rewardQueue: [...state.rewardQueue, ...localRewardEvents],
            ...nextGoalState,
          };
        }),

      clearHistory: () => set({ savedSessions: [] }),

      setGoalSnapshot: (snapshot: GoalSnapshot) =>
        set({
          dailyGoal: snapshot.dailyGoal,
          weeklyGoal: snapshot.weeklyGoal,
          goalStreak: snapshot.streak,
        }),

      setLocalGoal: (goal: GoalRecord) =>
        set((state: TypeState) => ({
          dailyGoal: goal.periodType === "daily" ? goal : state.dailyGoal,
          weeklyGoal: goal.periodType === "weekly" ? goal : state.weeklyGoal,
        })),

      cancelLocalGoal: (periodType: GoalPeriodType) =>
        set((state: TypeState) => ({
          dailyGoal: periodType === "daily" ? null : state.dailyGoal,
          weeklyGoal: periodType === "weekly" ? null : state.weeklyGoal,
        })),

      refreshGoalStatuses: () =>
        set((state: TypeState) => ({
          dailyGoal: getVisibleGoal(state.dailyGoal),
          weeklyGoal: getVisibleGoal(state.weeklyGoal),
        })),

      addRewardEvents: (events: RewardRecord[]) =>
        set((state: TypeState) => {
          if (events.length === 0) {
            return state;
          }

          const rewardMap = new Map(
            state.rewards.map((reward) => [reward.rewardKey, reward]),
          );
          const queueKeys = new Set(
            state.rewardQueue.map((reward) => reward.rewardKey),
          );
          const nextQueue = [...state.rewardQueue];
          for (const event of events) {
            rewardMap.set(event.rewardKey, event);
            if (!queueKeys.has(event.rewardKey)) {
              nextQueue.push(event);
              queueKeys.add(event.rewardKey);
            }
          }

          const mergedRewards = Array.from(rewardMap.values())
            .sort((left, right) => right.earnedAt - left.earnedAt)
            .slice(0, 120);

          return {
            rewards: mergedRewards,
            rewardQueue: nextQueue,
          };
        }),

      clearRewardQueue: () => set({ rewardQueue: [] }),

      hydrateRewardHistory: (rewards: RewardRecord[]) =>
        set((state: TypeState) => ({
          rewards,
          rewardQueue: state.rewardQueue,
        })),
    }),
    {
      name: "swiftyper-storage",
      partialize: (state: TypeState) =>
        ({
          savedSessions: state.savedSessions,
          perKeyStats: state.perKeyStats,
          nGramStats: state.nGramStats || {},
          hasPlayedIntro: state.hasPlayedIntro,
          dailyGoal: state.dailyGoal,
          weeklyGoal: state.weeklyGoal,
          goalStreak: state.goalStreak,
          rewards: state.rewards,
        }) as unknown as TypeState,
    },
  ),
);
