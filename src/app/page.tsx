"use client";

import { Header } from "@/components/Header";
import { Controls } from "@/components/Controls";
import { TypingDisplay } from "@/components/TypingDisplay";
import { LiveStats } from "@/components/LiveStats";
import { Keyboard } from "@/components/Keyboard";
import { PostSessionStats } from "@/components/PostSessionStats";
import { UserGuide } from "@/components/UserGuide";
import { SwiftAI } from "@/components/SwiftAI";
import { PrivacyPolicy } from "@/components/PrivacyPolicy";
import { GoalPanel } from "@/components/GoalPanel";
import { GoalCompleteModal } from "@/components/GoalCompleteModal";
import { AppSidebar } from "@/components/AppSidebar";
import { RewardsPanel } from "@/components/RewardsPanel";
import { HistoryPanel } from "@/components/HistoryPanel";
import { ProfilePanel } from "@/components/ProfilePanel";
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
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSwiftAIOpen, setIsSwiftAIOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isGoalOpen, setIsGoalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const bootstrappedUserId = useRef<string | null>(null);

  // Keep guest goals fresh and hide finished windows after they expire.
  useEffect(() => {
    refreshGoalStatuses();
    const intervalId = window.setInterval(refreshGoalStatuses, 60_000);
    return () => window.clearInterval(intervalId);
  }, [refreshGoalStatuses]);

  // One-time bootstrapping per authenticated user: merge local sessions, then merge local goals.
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      return;
    }

    if (bootstrappedUserId.current === session.user.id) {
      return;
    }

    bootstrappedUserId.current = session.user.id;

    void (async () => {
      await mergeLocalDataToServer();
      await mergeLocalGoalsToServer();
      await fetchRewardsFromServer();
    })();
  }, [session?.user?.id, status]);

  const primaryReward =
    rewardQueue.find((reward) => reward.rewardType === "goal_completion") ??
    rewardQueue[0] ??
    null;
  const companionReward =
    rewardQueue.find((reward) => reward.rewardType === "rank") ??
    rewardQueue.find((reward) => reward.rewardType === "streak") ??
    rewardQueue.find((reward) => reward.rewardType === "milestone") ??
    null;

  const completedGoalTitle =
    typeof primaryReward?.metadata?.goalTitle === "string"
      ? primaryReward.metadata.goalTitle
      : primaryReward?.description;

  const prevSessionCount = useRef(
    useTypingStore.getState().savedSessions.length,
  );

  // Auto-sync: whenever a new session is saved, push it to DB
  useEffect(() => {
    if (status !== "authenticated") return;

    const unsub = useTypingStore.subscribe((state) => {
      const newLen = state.savedSessions.length;
      if (newLen > prevSessionCount.current) {
        prevSessionCount.current = newLen;
        const latest = state.savedSessions[0];
        syncSessionToServer(latest);
        syncStatsToServer();
      }
    });

    return unsub;
  }, [status]);

  // Global keyboard shortcuts (Enter=start, Tab=reset, Esc=stop)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isGuideOpen || isSwiftAIOpen) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "Enter" && !isActive && !isFinished) {
        e.preventDefault();

        const state = useTypingStore.getState();
        if (
          !state.hasPlayedIntro &&
          state.targetText ===
            "swift type teaches you touch typing happy learning click enter to start"
        ) {
          state.setConfig({
            mode: "timed",
            duration: 60,
            hasPlayedIntro: true,
          });
          startSession(state.targetText);
          return;
        }

        const baseWpm =
          level === "advanced" ? 100 : level === "intermediate" ? 60 : 20;
        const count =
          mode === "timed" ? Math.ceil((baseWpm * duration) / 60) : wordCount;
        startSession(
          mode === "curriculum"
            ? generateCurriculumText(curriculumStage, count)
            : getRandomWords(level as any, count),
        );
      }
      if (e.key === "Tab") {
        e.preventDefault();
        resetSession();
      }
      if (e.key === "Escape" && isActive) {
        e.preventDefault();
        endSession();
      }
      // Ctrl/Cmd + Shift + S — toggle Swift AI panel
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "s"
      ) {
        e.preventDefault();
        setIsSwiftAIOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    isActive,
    isFinished,
    isGuideOpen,
    isSwiftAIOpen,
    mode,
    level,
    startSession,
    resetSession,
    endSession,
  ]);

  return (
    <>
      <UserGuide
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onAskSwift={() => setIsSwiftAIOpen(true)}
        isSwiftAIOpen={isSwiftAIOpen}
      />
      <SwiftAI
        isOpen={isSwiftAIOpen}
        onClose={() => setIsSwiftAIOpen(false)}
        onDocsOpen={() => setIsGuideOpen(true)}
        isDocsOpen={isGuideOpen}
      />
      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
      <GoalPanel isOpen={isGoalOpen} onClose={() => setIsGoalOpen(false)} />
      <PrivacyPolicy
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
      <RewardsPanel
        isOpen={isRewardsOpen}
        onClose={() => setIsRewardsOpen(false)}
        onOpenGoals={() => setIsGoalOpen(true)}
      />
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
        isPrivacyOpen={isPrivacyOpen}
        isRewardsOpen={isRewardsOpen}
        onOpenGoals={() => setIsGoalOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenDocs={() => setIsGuideOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenRewards={() => setIsRewardsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <ProfilePanel
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onAskGenius={() => setIsSwiftAIOpen(true)}
        onViewStats={() => setIsHistoryOpen(true)}
        onPractice={() => setIsProfileOpen(false)}
      />

      {/* Full-viewport container — no scroll */}
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
          {/* Header */}
          <Header
            onHistoryOpen={() => setIsHistoryOpen(true)}
            onSwiftAIOpen={() => setIsSwiftAIOpen(true)}
          />

          {/* Controls */}
          <Controls />

          {/* Typing area + Stats OR Post-session */}
          {!isFinished ? (
            <>
              <TypingDisplay />
              <LiveStats />
            </>
          ) : (
            <PostSessionStats />
          )}

          {/* Keyboard — takes remaining space */}
          {!isFinished && (
            <div className="flex-1 min-h-0 flex flex-col justify-end">
              <Keyboard />
            </div>
          )}

          {/* Credit */}
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
