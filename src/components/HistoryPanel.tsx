import { useTypingStore, SessionHistory } from "@/store/useTypingStore";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, LineChart, Target, Zap, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchRewardsFromServer } from "@/lib/syncService";

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryPanel({ isOpen, onClose }: HistoryPanelProps) {
  const { savedSessions, clearHistory, rewards, goalStreak } = useTypingStore();
  const { status } = useSession();
  const [selectedSession, setSelectedSession] = useState<SessionHistory | null>(
    null,
  );

  useEffect(() => {
    if (!isOpen || status !== "authenticated") {
      return;
    }

    void fetchRewardsFromServer();
  }, [isOpen, status]);

  const recentGoalCompletions = useMemo(
    () =>
      rewards
        .filter((reward) => reward.rewardType === "goal_completion")
        .slice(0, 4),
    [rewards],
  );

  const streakMilestones = useMemo(
    () =>
      rewards.filter((reward) => reward.rewardType === "streak").slice(0, 4),
    [rewards],
  );

  const handlePanelClose = () => {
    setSelectedSession(null);
    onClose();
  };

  const averageWpm =
    savedSessions.length > 0
      ? Math.round(
          savedSessions.reduce((acc, curr) => acc + curr.wpm, 0) /
            savedSessions.length,
        )
      : 0;

  const averageAcc =
    savedSessions.length > 0
      ? Math.round(
          savedSessions.reduce((acc, curr) => acc + curr.accuracy, 0) /
            savedSessions.length,
        )
      : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handlePanelClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity"
          />

          {/* Offcanvas Sheet */}
          <motion.div
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.5 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col bg-white dark:bg-brand-dark sm:max-w-md shadow-2xl border-l border-gray-200 dark:border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-black/20">
              <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
                <LineChart className="text-brand-orange w-5 h-5" />
                Performance Metrics
              </div>
              <button
                onClick={handlePanelClose}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 focus:outline-none transition-colors"
                aria-label="Close panel"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto w-full relative custom-scrollbar">
              {/* Aggregate Dashboard Component */}
              <div className="p-6 pb-2">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
                  Lifetime Averages
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col p-4 rounded-xl bg-linear-to-br from-brand-orange/10 to-brand-orange/5 border border-brand-orange/20 shadow-sm">
                    <span className="flex items-center gap-2 text-xs font-semibold text-brand-orange mb-1">
                      <Zap size={14} /> WPM
                    </span>
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">
                      {averageWpm}
                    </span>
                  </div>
                  <div className="flex flex-col p-4 rounded-xl bg-linear-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 shadow-sm">
                    <span className="flex items-center gap-2 text-xs font-semibold text-blue-500 mb-1">
                      <Target size={14} /> Accuracy
                    </span>
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">
                      {averageAcc}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 pt-2">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                  Goal Momentum
                </h3>

                <div className="rounded-xl border border-gray-100 dark:border-white/8 bg-white dark:bg-white/2 p-4">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Streak summary:{" "}
                    <span className="text-brand-orange font-bold">
                      {goalStreak.currentStreak}
                    </span>{" "}
                    current ·{" "}
                    <span className="font-bold">{goalStreak.bestStreak}</span>{" "}
                    best
                  </p>

                  <div className="mt-3 space-y-2">
                    {recentGoalCompletions.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Goal completions will appear here once you close your
                        first target.
                      </p>
                    ) : (
                      recentGoalCompletions.map((reward) => (
                        <div
                          key={reward.id}
                          className="text-xs text-gray-600 dark:text-gray-300 flex items-center justify-between gap-3"
                        >
                          <span className="truncate">{reward.description}</span>
                          <span className="text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {new Date(reward.earnedAt).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {streakMilestones.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/10">
                      <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold mb-2">
                        Streak History
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {streakMilestones.map((reward) => (
                          <span
                            key={reward.id}
                            className="text-[11px] rounded-full px-2.5 py-1 border border-brand-orange/20 bg-brand-orange/5 text-brand-orange font-semibold"
                          >
                            {reward.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sessions List Component */}
              <div className="px-6 py-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Recent Sessions
                  </h3>
                  <span className="text-xs text-gray-400">
                    {savedSessions.length} total
                  </span>
                </div>

                <div className="space-y-3">
                  {savedSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-gray-700">
                      <Clock className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No sessions recorded yet.
                        <br />
                        Complete a typing drill to see history.
                      </p>
                    </div>
                  ) : (
                    savedSessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className="group flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-white dark:bg-transparent hover:border-brand-orange/50 dark:hover:border-brand-orange/50 hover:shadow-md transition-all custom-glass cursor-pointer"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {new Date(session.date).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                          <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            <span className="capitalize">{session.mode}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                            {session.duration}s
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div className="flex flex-col">
                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                              {session.wpm}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-brand-orange tracking-wider">
                              WPM
                            </span>
                          </div>
                          <div className="w-px h-8 bg-gray-100 dark:bg-white/10"></div>
                          <div className="flex flex-col">
                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                              {session.accuracy}%
                            </span>
                            <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">
                              Acc
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Footer / Actions */}
            {savedSessions.length > 0 && (
              <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-brand-dark">
                <button
                  onClick={clearHistory}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-600 hover:bg-red-500/10 font-semibold focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                >
                  <Trash2 size={16} />
                  Clear All History
                </button>
              </div>
            )}
            {/* Detailed Session Sliding View */}
            <AnimatePresence>
              {selectedSession && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 z-60 flex flex-col bg-white dark:bg-brand-dark"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-black/20">
                    <h2 className="text-lg font-bold flex items-center gap-2 mt-1">
                      <Clock size={18} className="text-brand-orange" />
                      Session Details
                    </h2>
                    <button
                      onClick={() => setSelectedSession(null)}
                      className="rounded-full p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 focus:outline-none transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Details Container */}
                  <div className="flex-1 overflow-y-auto w-full relative custom-scrollbar p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white dark:bg-brand-dark border border-brand-orange/20 shadow-sm rounded-2xl p-6 text-center">
                        <span className="text-4xl font-extrabold text-brand-orange block mb-1">
                          {selectedSession.wpm}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                          Net Speed
                        </span>
                      </div>
                      <div className="bg-white dark:bg-brand-dark border border-blue-500/20 shadow-sm rounded-2xl p-6 text-center">
                        <span className="text-4xl font-extrabold text-blue-500 block mb-1">
                          {selectedSession.accuracy}%
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                          Accuracy
                        </span>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-transparent border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden p-6 custom-glass">
                      <h3 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4">
                        Diagnostics Insight
                      </h3>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/10">
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                            Mode Active
                          </span>
                          <span className="text-sm font-bold capitalize text-gray-900 dark:text-gray-100">
                            {selectedSession.mode}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/10">
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                            Total Duration
                          </span>
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {selectedSession.duration}s
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/10">
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                            Total Keystrokes
                          </span>
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {selectedSession.keystrokes || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                            Error Count
                          </span>
                          <span className="text-sm font-extrabold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">
                            {Math.max(
                              0,
                              Math.round(
                                (selectedSession.keystrokes || 0) -
                                  (selectedSession.accuracy *
                                    (selectedSession.keystrokes || 0)) /
                                    100,
                              ),
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
