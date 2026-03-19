import { create } from "zustand";
import { persist } from "zustand/middleware";

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

  // Actions
  setConfig: (
    config: Partial<Pick<TypeState, "level" | "duration" | "wordCount" | "curriculumStage" | "mode" | "hasPlayedIntro">>,
  ) => void;
  startSession: (text: string) => void;
  resetSession: () => void;
  typeChar: (char: string) => void;
  deleteChar: () => void;
  tick: () => void;
  endSession: () => void;
  clearHistory: () => void;
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
      targetText: "swift type teaches you touch typing happy learning click enter to start",
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

      setConfig: (
        config: Partial<Pick<TypeState, "level" | "duration" | "wordCount" | "curriculumStage" | "mode" | "hasPlayedIntro">>,
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
                ? Math.max(0, Math.round(((updateObj.keystrokes - updateObj.mistakes) / 5) / timeElapsedStr))
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

            Object.assign(updateObj, {
              isActive: false,
              isFinished: true,
              savedSessions: [newSession, ...state.savedSessions].slice(0, 200),
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
            timeElapsedStr > 0 ? Math.max(0, Math.round(((state.keystrokes - state.mistakes) / 5) / timeElapsedStr)) : 0;

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

            return {
              timeLeft: 0,
              isActive: false,
              isFinished: true,
              wpmHistory: newWpmHistory,
              savedSessions: [newSession, ...state.savedSessions].slice(0, 200), // Keep last 200
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
            timeElapsedStr > 0 ? Math.max(0, Math.round(((state.keystrokes - state.mistakes) / 5) / timeElapsedStr)) : 0;
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

          return {
            isActive: false,
            isFinished: true,
            savedSessions: [newSession, ...state.savedSessions].slice(0, 200),
          };
        }),

      clearHistory: () => set({ savedSessions: [] }),
    }),
    {
      name: "swiftyper-storage",
      partialize: (state: TypeState) =>
        ({
          savedSessions: state.savedSessions,
          perKeyStats: state.perKeyStats,
          nGramStats: state.nGramStats || {},
          hasPlayedIntro: state.hasPlayedIntro,
        }) as unknown as TypeState,
    },
  ),
);
