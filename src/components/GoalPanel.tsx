"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Target,
  Flame,
  X,
  CheckCircle2,
  CalendarRange,
  ChevronLeft,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useTypingStore } from "@/store/useTypingStore";
import {
  GoalPeriodType,
  GoalRecord,
  GoalTemplate,
  createGoalFromTemplate,
  formatGoalProgress,
  getGoalReminderState,
  getGoalProgressRatio,
  getGoalTemplates,
} from "@/lib/goals";
import { createGoalOnServer, patchGoalOnServer } from "@/lib/syncService";

interface GoalPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function GoalCard({
  label,
  goal,
  onCancel,
}: {
  label: string;
  goal: GoalRecord | null;
  onCancel: (goal: GoalRecord) => void;
}) {
  if (!goal) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-4 bg-gray-50/70 dark:bg-white/3">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {label}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          No active goal yet. Pick a template below to start tracking progress.
        </p>
      </div>
    );
  }

  const progress = Math.round(getGoalProgressRatio(goal) * 100);
  const complete = goal.status === "completed";

  return (
    <div className="rounded-2xl border border-brand-orange/15 bg-white dark:bg-white/4 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
            {label}
          </p>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-1">
            {goal.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatGoalProgress(goal)}
          </p>
        </div>
        {complete ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 text-[11px] font-bold">
            <CheckCircle2 size={12} />
            Complete
          </span>
        ) : (
          <button
            onClick={() => onCancel(goal)}
            className="text-[11px] font-bold text-gray-400 hover:text-red-500 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #ff6b35, #ff8c5a)",
          }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
        <span>{progress}% tracked</span>
        <span>
          Ends{" "}
          {new Date(goal.endsAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}

export function GoalPanel({ isOpen, onClose }: GoalPanelProps) {
  const { status } = useSession();
  const {
    dailyGoal,
    weeklyGoal,
    goalStreak,
    setLocalGoal,
    cancelLocalGoal,
    refreshGoalStatuses,
  } = useTypingStore();
  const [selectedPeriod, setSelectedPeriod] = useState<GoalPeriodType>("daily");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<GoalTemplate | null>(
    null,
  );
  const [editTitle, setEditTitle] = useState("");
  const [editTargetValue, setEditTargetValue] = useState(0);
  const [editRequiredSessions, setEditRequiredSessions] = useState(1);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    refreshGoalStatuses();
  }, [isOpen, refreshGoalStatuses]);

  const templates = useMemo(
    () => getGoalTemplates(selectedPeriod),
    [selectedPeriod],
  );

  const reminder = useMemo(
    () =>
      getGoalReminderState({
        dailyGoal,
        weeklyGoal,
        streak: goalStreak,
      }),
    [dailyGoal, weeklyGoal, goalStreak],
  );

  const hasNoGoals = !dailyGoal && !weeklyGoal;

  function openEditForm(template: GoalTemplate) {
    setEditingTemplate(template);
    setEditTitle(template.title);
    setEditTargetValue(
      template.goalType === "minutes_practiced"
        ? Math.round(template.targetValue / 60)
        : template.targetValue,
    );
    setEditRequiredSessions(template.requiredSessions);
  }

  const handleCreateGoal = async () => {
    if (!editingTemplate || isSubmitting) return;

    const finalTargetValue =
      editingTemplate.goalType === "minutes_practiced"
        ? editTargetValue * 60
        : editTargetValue;

    const customTemplate: GoalTemplate = {
      ...editingTemplate,
      title: editTitle.trim() || editingTemplate.title,
      targetValue: finalTargetValue,
      requiredSessions: editRequiredSessions,
    };

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const goal = createGoalFromTemplate(customTemplate, timezone);

    setIsSubmitting(true);
    try {
      if (status === "authenticated") {
        await createGoalOnServer({
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
        });
      } else {
        setLocalGoal(goal);
      }
      setEditingTemplate(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelGoal = async (goal: GoalRecord) => {
    if (status === "authenticated") {
      await patchGoalOnServer(goal.id, { status: "cancelled" });
      return;
    }

    cancelLocalGoal(goal.periodType);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-55 bg-black/35 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ x: "100%", opacity: 0.7 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.7 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed inset-y-0 right-0 z-56 w-full sm:max-w-md flex flex-col"
            style={{
              background: "var(--container-bg)",
              borderLeft: "1px solid var(--container-border)",
              backdropFilter: "blur(24px) saturate(180%)",
              boxShadow: "-24px 0 64px rgba(0,0,0,0.14)",
            }}
          >
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/8 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #ff6b35, #ff8c5a)",
                  }}
                >
                  <Target size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black text-gray-900 dark:text-white">
                    Goals
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Set a clear target. Let Swift keep you honest.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                aria-label="Close goals panel"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-5">
              <div className="rounded-2xl border border-brand-orange/15 bg-linear-to-br from-brand-orange/10 to-brand-orange/5 p-4">
                <div className="flex items-center gap-2 text-brand-orange font-bold text-sm">
                  <Flame size={15} />
                  Streak Summary
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="rounded-xl bg-white/70 dark:bg-white/5 p-3 border border-white/40 dark:border-white/10">
                    <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold">
                      Current
                    </p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                      {goalStreak.currentStreak}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/70 dark:bg-white/5 p-3 border border-white/40 dark:border-white/10">
                    <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold">
                      Best
                    </p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                      {goalStreak.bestStreak}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <GoalCard
                  label="Today's Goal"
                  goal={dailyGoal}
                  onCancel={handleCancelGoal}
                />
                <GoalCard
                  label="Weekly Goal"
                  goal={weeklyGoal}
                  onCancel={handleCancelGoal}
                />
              </div>

              {hasNoGoals && (
                <div className="rounded-2xl border border-dashed border-brand-orange/30 bg-brand-orange/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-brand-orange">
                    Quick Start
                  </p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-1">
                    Start with one daily goal to make progress visible every
                    session.
                  </p>
                </div>
              )}

              {reminder.kind !== "none" && (
                <div className="rounded-2xl border border-brand-orange/15 bg-brand-orange/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-brand-orange">
                    Reminder
                  </p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-1">
                    {reminder.title}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {reminder.message}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-gray-100 dark:border-white/8 bg-white/70 dark:bg-white/3 p-4">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-sm">
                  <CalendarRange size={15} className="text-brand-orange" />
                  Create Goal
                </div>

                <div className="mt-4 inline-flex rounded-xl p-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8">
                  {(["daily", "weekly"] as GoalPeriodType[]).map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        selectedPeriod === period
                          ? "bg-white dark:bg-white/10 text-brand-orange shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                      }`}
                    >
                      {period === "daily" ? "Daily" : "Weekly"}
                    </button>
                  ))}
                </div>

                <div className="mt-4 space-y-3">
                  {editingTemplate ? (
                    /* ── Inline edit form ── */
                    <div className="rounded-2xl border border-brand-orange/20 bg-white dark:bg-white/5 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-orange">
                          Customize Goal
                        </p>
                        <button
                          onClick={() => setEditingTemplate(null)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                          <ChevronLeft size={12} /> Back
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                            Goal Name
                          </label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/3 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-brand-orange/40 dark:focus:border-brand-orange/30 transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                            {editingTemplate.goalType ===
                              "sessions_completed" && "Sessions to complete"}
                            {editingTemplate.goalType === "average_accuracy" &&
                              "Target accuracy (%)"}
                            {editingTemplate.goalType === "minutes_practiced" &&
                              "Minutes to practice"}
                            {editingTemplate.goalType === "target_wpm" &&
                              "Target WPM"}
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={editTargetValue}
                            onChange={(e) =>
                              setEditTargetValue(Number(e.target.value))
                            }
                            className="mt-1 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/3 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-brand-orange/40 dark:focus:border-brand-orange/30 transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                            Min. sessions to qualify
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={editRequiredSessions}
                            onChange={(e) =>
                              setEditRequiredSessions(
                                Math.max(1, Number(e.target.value)),
                              )
                            }
                            className="mt-1 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/3 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-brand-orange/40 dark:focus:border-brand-orange/30 transition-all"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleCreateGoal}
                        disabled={isSubmitting || !editTitle.trim()}
                        className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                        style={{
                          background:
                            "linear-gradient(135deg, #ff6b35, #ff8c5a)",
                        }}
                      >
                        {isSubmitting ? "Creating…" : "Create Goal"}
                      </button>
                    </div>
                  ) : (
                    /* ── Template list ── */
                    templates.map((template) => (
                      <button
                        key={template.key}
                        onClick={() => openEditForm(template)}
                        className="w-full text-left rounded-2xl border border-gray-100 dark:border-white/8 bg-white dark:bg-white/3 hover:border-brand-orange/25 dark:hover:border-brand-orange/25 p-4 transition-all"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                              {template.title}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {template.description}
                            </p>
                          </div>
                          <span className="text-[11px] font-bold text-brand-orange whitespace-nowrap">
                            Customize
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {status !== "authenticated" && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-4 leading-relaxed">
                    Goals work without sign-in. Sign in when you want cloud sync
                    and Swift AI coaching based on your live targets.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
