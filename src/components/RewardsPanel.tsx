"use client";

import { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gift, Sparkles, Target, Trophy, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTypingStore } from "@/store/useTypingStore";
import { fetchRewardsFromServer } from "@/lib/syncService";
import { RewardCard } from "@/components/RewardCard";

interface RewardsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGoals: () => void;
}

export function RewardsPanel({
  isOpen,
  onClose,
  onOpenGoals,
}: RewardsPanelProps) {
  const { status, data: session } = useSession();
  const { rewards, goalStreak } = useTypingStore();

  useEffect(() => {
    if (!isOpen || status !== "authenticated") {
      return;
    }

    void fetchRewardsFromServer();
  }, [isOpen, status]);

  const latestReward = useMemo(() => rewards[0] ?? null, [rewards]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity"
          />

          <motion.div
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.5 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-brand-dark sm:max-w-md"
          >
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4 dark:border-white/10 dark:bg-black/20">
              <div className="mt-1 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100">
                <Gift className="h-5 w-5 text-brand-orange" />
                Rewards
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-200 focus:outline-none dark:hover:bg-white/10"
                aria-label="Close rewards panel"
              >
                <X size={18} />
              </button>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-brand-orange/20 bg-linear-to-br from-brand-orange/10 to-brand-orange/5 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-brand-orange">
                    Total Rewards
                  </p>
                  <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
                    {rewards.length}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    Current Streak
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-3xl font-black text-gray-900 dark:text-white">
                    <Sparkles size={18} className="text-brand-orange" />
                    {goalStreak.currentStreak}
                  </p>
                </div>
              </div>

              {latestReward ? (
                <div className="mt-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                    Latest card
                  </p>
                  <RewardCard
                    reward={latestReward}
                    streakCount={goalStreak.currentStreak}
                    userName={session?.user?.name}
                    completedGoalTitle={
                      typeof latestReward.metadata?.goalTitle === "string"
                        ? latestReward.metadata.goalTitle
                        : undefined
                    }
                  />
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center dark:border-white/10 dark:bg-white/3">
                  <Trophy className="mx-auto h-7 w-7 text-brand-orange" />
                  <p className="mt-3 text-sm font-bold text-gray-800 dark:text-gray-100">
                    No rewards yet
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Set a goal and complete a focused session to unlock your
                    first reward card.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenGoals();
                    }}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-brand-orange/20 bg-brand-orange/10 px-3 py-2 text-xs font-bold text-brand-orange transition-colors hover:border-brand-orange/35"
                  >
                    <Target size={13} />
                    Set a Goal
                  </button>
                </div>
              )}

              {rewards.length > 0 && (
                <div className="mt-5 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                    Recent unlocks
                  </p>
                  {rewards.map((reward, i) => (
                    <motion.div
                      key={reward.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 + 0.1 }}
                      className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5 dark:border-white/8 dark:bg-white/3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {reward.title}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {reward.description}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
                        {new Date(reward.earnedAt).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
