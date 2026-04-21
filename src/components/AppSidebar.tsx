"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  LineChart,
  LogOut,
  Menu,
  Shield,
  Star,
  Target,
  Trophy,
  X,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTypingStore } from "@/store/useTypingStore";
import { useSession, signOut } from "next-auth/react";
import {
  formatGoalProgress,
  getGoalProgressRatio,
  getPrimaryGoal,
} from "@/lib/goals";

interface AppSidebarProps {
  isGoalsOpen: boolean;
  isHistoryOpen: boolean;
  isDocsOpen: boolean;
  isRewardsOpen: boolean;
  isReviewsOpen: boolean;
  onOpenGoals: () => void;
  onOpenHistory: () => void;
  onOpenDocs: () => void;
  onOpenRewards: () => void;
  onOpenProfile: () => void;
  onOpenReviews: () => void;
}

interface SidebarNavItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  highlighted?: boolean;
  trailing?: ReactNode;
  onClick: () => void;
  expanded: boolean;
}

function SidebarNavItem({
  icon,
  label,
  active = false,
  highlighted = false,
  trailing,
  onClick,
  expanded,
}: SidebarNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
        active
          ? "bg-brand-orange/10 text-brand-orange"
          : "text-gray-600 hover:bg-white/70 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/8 dark:hover:text-white"
      }`}
      title={expanded ? undefined : label}
    >
      {highlighted && (
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-orange shadow-[0_0_0_4px_rgba(255,107,53,0.14)]" />
      )}

      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center">
        {icon}
      </span>

      <AnimatePresence>
        {expanded && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.16 }}
            className="min-w-0 flex-1 truncate text-[13px] font-semibold"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {expanded && trailing}
    </button>
  );
}

export function AppSidebar({
  isGoalsOpen,
  isHistoryOpen,
  isDocsOpen,
  isRewardsOpen,
  isReviewsOpen,
  onOpenGoals,
  onOpenHistory,
  onOpenDocs,
  onOpenRewards,
  onOpenProfile,
  onOpenReviews,
}: AppSidebarProps) {
  const { dailyGoal, weeklyGoal, goalStreak, savedSessions } = useTypingStore();
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [hasOwnReview, setHasOwnReview] = useState<boolean | null>(null);
  const router = useRouter();

  const primaryGoal = useMemo(
    () =>
      getPrimaryGoal({
        dailyGoal,
        weeklyGoal,
        streak: goalStreak,
      }),
    [dailyGoal, weeklyGoal, goalStreak],
  );

  const hasActiveGoal = Boolean(primaryGoal && primaryGoal.status === "active");
  const goalProgress = primaryGoal
    ? Math.round(getGoalProgressRatio(primaryGoal) * 100)
    : 0;

  const compactGoalSummary = primaryGoal
    ? formatGoalProgress(primaryGoal)
        .replace(" sessions", "")
        .replace(" min", "m")
    : "No goal";

  const isAuthed = status === "authenticated";
  const shouldPromptReview =
    isAuthed &&
    hasOwnReview === false &&
    savedSessions.length >= 5 &&
    !isReviewsOpen;

  useEffect(() => {
    if (!isAuthed) {
      setHasOwnReview(null);
      return;
    }

    const controller = new AbortController();

    void fetch("/api/reviews", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load review status");
        }
        return response.json() as Promise<{ myReview?: { id: string } | null }>;
      })
      .then((payload) => setHasOwnReview(Boolean(payload.myReview)))
      .catch(() => {
        // Keep the indicator conservative when the status cannot be resolved.
        setHasOwnReview(null);
      });

    return () => controller.abort();
  }, [isAuthed, isReviewsOpen]);

  function close() {
    setIsOpen(false);
  }

  return (
    <motion.aside
      animate={{ width: isOpen ? 240 : 72 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      className="fixed left-0 top-0 bottom-0 z-70 overflow-hidden border-r border-gray-200/60 bg-white/60 p-2 pt-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#0f1218]/60"
      style={{ boxShadow: isOpen ? "8px 0 32px rgba(0,0,0,0.05)" : "none" }}
      aria-label="App navigation"
    >
      <div className="flex h-full flex-col">
        {/* Hamburger / close toggle */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="mb-4 flex h-10 w-full items-center rounded-xl px-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
        >
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center">
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </span>
          <AnimatePresence>
            {isOpen && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.14 }}
                className="ml-2 text-sm font-bold"
              >
                Swift Type
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Nav items */}
        <div className="space-y-1">
          <SidebarNavItem
            icon={<Target size={18} />}
            label="Goals"
            active={isGoalsOpen}
            highlighted={hasActiveGoal}
            onClick={() => {
              onOpenGoals();
              close();
            }}
            expanded={isOpen}
            trailing={
              isOpen && hasActiveGoal ? (
                <span className="rounded-full border border-brand-orange/20 bg-brand-orange/10 px-2 py-0.5 text-[10px] font-bold text-brand-orange">
                  {compactGoalSummary}
                </span>
              ) : undefined
            }
          />

          {hasActiveGoal && (
            <div className="px-3 pb-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200/80 dark:bg-white/10">
                <motion.div
                  initial={false}
                  animate={{ width: `${goalProgress}%` }}
                  transition={{ duration: 0.25 }}
                  className="h-full rounded-full bg-linear-to-r from-brand-orange to-orange-300"
                />
              </div>
            </div>
          )}

          <SidebarNavItem
            icon={<LineChart size={18} />}
            label="History"
            active={isHistoryOpen}
            onClick={() => {
              onOpenHistory();
              close();
            }}
            expanded={isOpen}
          />

          <SidebarNavItem
            icon={<BookOpen size={18} />}
            label="Docs"
            active={isDocsOpen}
            onClick={() => {
              onOpenDocs();
              close();
            }}
            expanded={isOpen}
          />

          <SidebarNavItem
            icon={<Shield size={18} />}
            label="Privacy"
            onClick={() => {
              router.push("/privacy");
              close();
            }}
            expanded={isOpen}
          />

          <SidebarNavItem
            icon={<FileText size={18} />}
            label="Terms"
            onClick={() => {
              router.push("/terms");
              close();
            }}
            expanded={isOpen}
          />

          <SidebarNavItem
            icon={<Trophy size={18} />}
            label="Rewards"
            active={isRewardsOpen}
            onClick={() => {
              onOpenRewards();
              close();
            }}
            expanded={isOpen}
          />

          <SidebarNavItem
            icon={<Star size={18} />}
            label="Reviews"
            active={isReviewsOpen}
            highlighted={shouldPromptReview}
            onClick={() => {
              onOpenReviews();
              close();
            }}
            expanded={isOpen}
            trailing={
              shouldPromptReview && isOpen ? (
                <span className="rounded-full border border-brand-orange/20 bg-brand-orange/10 px-2 py-0.5 text-[10px] font-bold text-brand-orange">
                  New
                </span>
              ) : undefined
            }
          />
        </div>

        {/* Bottom: profile + signout */}
        <div className="mt-auto">
          {isAuthed ? (
            <div className="border-t border-gray-100 dark:border-white/8 pt-3 space-y-1">
              <button
                onClick={() => {
                  onOpenProfile?.();
                  close();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
                title={isOpen ? undefined : "View profile"}
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center">
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="h-6 w-6 rounded-full border border-gray-200 dark:border-white/10"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-orange/20 text-[10px] font-bold text-brand-orange">
                      {(session?.user?.name || "U")[0].toUpperCase()}
                    </div>
                  )}
                </span>
                <AnimatePresence>
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.16 }}
                      className="min-w-0 flex-1 truncate text-[13px] font-semibold"
                    >
                      {session?.user?.name?.split(" ")[0] || "Profile"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <button
                onClick={() => signOut()}
                className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-gray-500 transition-all hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                title={isOpen ? undefined : "Sign Out"}
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center">
                  <LogOut size={16} />
                </span>
                <AnimatePresence>
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.16 }}
                      className="min-w-0 flex-1 truncate text-[12px] font-semibold"
                    >
                      Sign Out
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          ) : (
            <div className="px-2 pb-2 mt-4">
              <div className="h-px w-8 bg-gray-200 dark:bg-white/10 mb-3 mx-auto" />
              <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 dark:text-gray-600">
                {isOpen ? "Swift Type" : "ST"}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
