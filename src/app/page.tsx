"use client";

import { Header } from "@/components/Header";
import { Controls } from "@/components/Controls";
import { TypingDisplay } from "@/components/TypingDisplay";
import { LiveStats } from "@/components/LiveStats";
import { Keyboard } from "@/components/Keyboard";
import { PostSessionStats } from "@/components/PostSessionStats";
import { UserGuide } from "@/components/UserGuide";
import { SwiftAI } from "@/components/SwiftAI";
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
  } = useTypingStore();

  const { status } = useSession();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSwiftAIOpen, setIsSwiftAIOpen] = useState(false);
  const hasMerged = useRef(false);

  // One-time merge: push localStorage data to DB on first authenticated load
  useEffect(() => {
    if (status === "authenticated" && !hasMerged.current) {
      hasMerged.current = true;
      mergeLocalDataToServer();
    }
  }, [status]);

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
      <UserGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <SwiftAI isOpen={isSwiftAIOpen} onClose={() => setIsSwiftAIOpen(false)} />

      {/* Full-viewport container — no scroll */}
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
          onGuideOpen={() => setIsGuideOpen(true)}
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
        <div className="flex-shrink-0 flex justify-center pt-1 pb-0.5">
          <span
            className="text-[11px] font-medium tracking-wide"
            style={{ color: "rgba(253, 175, 8, 0.96)" }}
          >
            Engineered by Kingsley Maduabuchi
          </span>
        </div>
      </main>
    </>
  );
}
