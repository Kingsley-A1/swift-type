"use client";

import { Header } from "@/components/Header";
import { Controls } from "@/components/Controls";
import { TypingDisplay } from "@/components/TypingDisplay";
import { LiveStats } from "@/components/LiveStats";
import { Keyboard } from "@/components/Keyboard";
import { PostSessionStats } from "@/components/PostSessionStats";
import { UserGuide } from "@/components/UserGuide";
import { SwiftAI } from "@/components/SwiftAI";
import { GoalPanel } from "@/components/GoalPanel";
import { GoalCompleteModal } from "@/components/GoalCompleteModal";
import { AppSidebar } from "@/components/AppSidebar";
import { RewardsPanel } from "@/components/RewardsPanel";
import { HistoryPanel } from "@/components/HistoryPanel";
import { ProfilePanel } from "@/components/ProfilePanel";
import { ReviewsPanel } from "@/components/ReviewsPanel";
import { useTypingStore } from "@/store/useTypingStore";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { getRandomWords } from "@/data/dictionary";
import {
  CURRICULUM_STAGES,
  generateCurriculumText,
} from "@/lib/adaptiveEngine";
import {
  syncSessionToServer,
  syncStatsToServer,
  mergeLocalDataToServer,
  mergeLocalGoalsToServer,
  fetchRewardsFromServer,
} from "@/lib/syncService";

type PanelId = "goals" | "history" | "guide" | "rewards" | "profile" | "swiftai" | "reviews" | null;

export default function Home() {
  const {
    isFinished,
    isActive,
    mode,
    level,
    duration,
    wordCount,
    curriculumStage,
    startSession,
    resetSession,
    endSession,
    refreshGoalStatuses,
    rewardQueue,
    goalStreak,
    clearRewardQueue,
  } = useTypingStore();

  const { data: session, status } = useSession();

  // ── Single panel state: only one panel open at a time ─────────────────────
  const [openPanel, setOpenPanel] = useState<PanelId>(null);
  const bootstrappedUserId = useRef<string | null>(null);

  const openOnly = (panel: PanelId) => setOpenPanel(panel);
  const closePanel = () => setOpenPanel(null);

  const isGuideOpen    = openPanel === "guide";
  const isSwiftAIOpen  = openPanel === "swiftai";
  const isGoalOpen     = openPanel === "goals";
  const isHistoryOpen  = openPanel === "history";
  const isRewardsOpen  = openPanel === "rewards";
  const isProfileOpen  = openPanel === "profile";
  const isReviewsOpen  = openPanel === "reviews";
  const anyPanelOpen   = openPanel !== null;

  // Keep guest goals fresh
  useEffect(() => {
    refreshGoalStatuses();
    const intervalId = window.setInterval(refreshGoalStatuses, 60_000);
    return () => window.clearInterval(intervalId);
  }, [refreshGoalStatuses]);

  // One-time bootstrap per authenticated user
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;
    if (bootstrappedUserId.current === session.user.id) return;
    bootstrappedUserId.current = session.user.id;
    void (async () => {
      await mergeLocalDataToServer();
      await mergeLocalGoalsToServer();
      await fetchRewardsFromServer();
    })();
  }, [session?.user?.id, status]);

  const primaryReward =
    rewardQueue.find((r) => r.rewardType === "goal_completion") ??
    rewardQueue[0] ??
    null;
  const companionReward =
    rewardQueue.find((r) => r.rewardType === "rank") ??
    rewardQueue.find((r) => r.rewardType === "streak") ??
    rewardQueue.find((r) => r.rewardType === "milestone") ??
    null;
  const completedGoalTitle =
    typeof primaryReward?.metadata?.goalTitle === "string"
      ? primaryReward.metadata.goalTitle
      : primaryReward?.description;

  const prevSessionCount = useRef(useTypingStore.getState().savedSessions.length);

  // Auto-sync new sessions to DB
  useEffect(() => {
    if (status !== "authenticated") return;
    const unsub = useTypingStore.subscribe((state) => {
      const newLen = state.savedSessions.length;
      if (newLen > prevSessionCount.current) {
        prevSessionCount.current = newLen;
        syncSessionToServer(state.savedSessions[0]);
        syncStatsToServer();
      }
    });
    return unsub;
  }, [status]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      // Esc: close open panel first; if none open and session active, stop it
      if (e.key === "Escape") {
        e.preventDefault();
        if (anyPanelOpen) { closePanel(); return; }
        if (isActive) endSession();
        return;
      }

      if (isGuideOpen || isSwiftAIOpen) return;

      if (e.key === "Enter" && !isActive && !isFinished) {
        e.preventDefault();
        const state = useTypingStore.getState();
        if (
          !state.hasPlayedIntro &&
          state.targetText === "swift type teaches you touch typing happy learning click enter to start"
        ) {
          state.setConfig({ mode: "timed", duration: 60, hasPlayedIntro: true });
          startSession(state.targetText);
          return;
        }
        const baseWpm = level === "advanced" ? 100 : level === "intermediate" ? 60 : 20;
        const count = mode === "timed" ? Math.ceil((baseWpm * duration) / 60) : wordCount;
        startSession(
          mode === "curriculum"
            ? generateCurriculumText(curriculumStage, count)
            : getRandomWords(level as any, count),
        );
      }
      if (e.key === "Tab") { e.preventDefault(); resetSession(); }

      // Ctrl/Cmd+Shift+S — toggle Swift AI
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setOpenPanel((p) => (p === "swiftai" ? null : "swiftai"));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isActive, isFinished, isGuideOpen, isSwiftAIOpen, anyPanelOpen, mode, level, startSession, resetSession, endSession]);

  return (
    <>
      <UserGuide
        isOpen={isGuideOpen}
        onClose={closePanel}
        onAskSwift={() => openOnly("swiftai")}
        isSwiftAIOpen={isSwiftAIOpen}
      />
      <SwiftAI
        isOpen={isSwiftAIOpen}
        onClose={closePanel}
        onDocsOpen={() => openOnly("guide")}
        isDocsOpen={isGuideOpen}
      />
      <HistoryPanel isOpen={isHistoryOpen} onClose={closePanel} />
      <GoalPanel isOpen={isGoalOpen} onClose={closePanel} />
      <RewardsPanel
        isOpen={isRewardsOpen}
        onClose={closePanel}
        onOpenGoals={() => openOnly("goals")}
      />
      <ReviewsPanel isOpen={isReviewsOpen} onClose={closePanel} />
      <GoalCompleteModal
        isOpen={rewardQueue.length > 0}
        onClose={clearRewardQueue}
        primaryReward={primaryReward}
        companionReward={companionReward}
        streakCount={goalStreak.currentStreak}
        completedGoalTitle={completedGoalTitle}
        userName={session?.user?.name}
      />

      <AppSidebar
        isGoalsOpen={isGoalOpen}
        isHistoryOpen={isHistoryOpen}
        isDocsOpen={isGuideOpen}
        isRewardsOpen={isRewardsOpen}
        isReviewsOpen={isReviewsOpen}
        onOpenGoals={() => openOnly("goals")}
        onOpenHistory={() => openOnly("history")}
        onOpenDocs={() => openOnly("guide")}
        onOpenRewards={() => openOnly("rewards")}
        onOpenProfile={() => openOnly("profile")}
        onOpenReviews={() => openOnly("reviews")}
      />

      <ProfilePanel
        isOpen={isProfileOpen}
        onClose={closePanel}
        onAskGenius={() => openOnly("swiftai")}
        onViewStats={() => openOnly("history")}
        onPractice={closePanel}
      />

      {/* Full-viewport container */}
      <div className="h-dvh pl-[72px]">
        <main
          className="w-full max-w-5xl mx-auto flex flex-col"
          style={{
            height: "100dvh",
            padding: "16px 24px",
            borderLeft: "1px solid rgba(255,107,53,0.09)",
            borderRight: "1px solid rgba(255,107,53,0.09)",
          }}
        >
          <Header
            onHistoryOpen={() => openOnly("history")}
            onSwiftAIOpen={() => openOnly("swiftai")}
          />
          <Controls />

          {!isFinished ? (
            <>
              <TypingDisplay />
              <LiveStats />
            </>
          ) : (
            <PostSessionStats />
          )}

          {!isFinished && (
            <div className="flex-1 min-h-0 flex flex-col justify-end">
              <Keyboard isBlocked={anyPanelOpen} />
            </div>
          )}

          <div className="shrink-0 flex justify-center pt-1 pb-0.5">
            <span
              className="text-[11px] font-medium tracking-wide"
              style={{ color: "rgba(253, 175, 8, 0.96)" }}
            >
              Engineered by Kingsley Maduabuchi
            </span>
          </div>
        </main>
      </div>
    </>
  );
}
