"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Sparkles, X } from "lucide-react";
import { RewardCard } from "@/components/RewardCard";
import type { RewardRecord } from "@/lib/rewards";

interface GoalCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryReward: RewardRecord | null;
  companionReward: RewardRecord | null;
  streakCount: number;
  completedGoalTitle?: string;
  userName?: string | null;
}

function badgeLabel(reward: RewardRecord | null) {
  if (!reward) {
    return null;
  }

  if (reward.rewardType === "rank") {
    return "Rank unlocked";
  }

  if (reward.rewardType === "streak") {
    return "Streak milestone";
  }

  if (reward.rewardType === "milestone") {
    return "Milestone unlocked";
  }

  return "Badge unlocked";
}

export function GoalCompleteModal({
  isOpen,
  onClose,
  primaryReward,
  companionReward,
  streakCount,
  completedGoalTitle,
  userName,
}: GoalCompleteModalProps) {
  const companionLabel = badgeLabel(companionReward);

  return (
    <AnimatePresence>
      {isOpen && primaryReward && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-70 bg-black/45 backdrop-blur-[3px]"
          />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 z-80 w-[92vw] max-w-140 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1116] p-5 sm:p-6 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              aria-label="Close reward modal"
            >
              <X size={16} />
            </button>

            <div className="pr-8">
              <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-brand-orange">
                Goal complete
              </p>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1 inline-flex items-center gap-2">
                <CheckCircle2 size={22} className="text-emerald-500" />
                Nice work.
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                {completedGoalTitle ?? primaryReward.description}
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-brand-orange/15 bg-brand-orange/5 p-3">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                Current streak:{" "}
                <span className="text-brand-orange font-black">
                  {streakCount}
                </span>
              </p>

              {companionReward && companionLabel && (
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 inline-flex items-center gap-1.5">
                  <Sparkles size={13} className="text-brand-orange" />
                  {companionLabel}:{" "}
                  <span className="font-semibold">{companionReward.title}</span>
                </p>
              )}
            </div>

            <div className="mt-4">
              <RewardCard
                reward={primaryReward}
                streakCount={streakCount}
                completedGoalTitle={completedGoalTitle}
                userName={userName}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
