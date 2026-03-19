"use client";

import { useTypingStore } from "@/store/useTypingStore";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

export function TypingDisplay() {
  const {
    targetText,
    typedText,
    isActive,
    isFinished,
    typeChar,
    deleteChar,
    resetSession,
    endSession,
  } = useTypingStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeCharRef = useRef<HTMLSpanElement>(null);

  // Keep focus on input when active
  useEffect(() => {
    if (isActive) inputRef.current?.focus();
  }, [isActive]);

  // Auto-scroll the container to keep the active character vertically centered
  useEffect(() => {
    if (isActive && activeCharRef.current && containerRef.current) {
      activeCharRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [typedText.length, isActive]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab") { e.preventDefault(); resetSession(); return; }
    if (e.key === "Escape") { e.preventDefault(); if (isActive) endSession(); return; }
    if (!isActive) return;
    if (e.key === "Backspace") { deleteChar(); return; }
    if (e.key.length === 1) {
      e.preventDefault();
      const correct = targetText[typedText.length] === e.key;
      typeChar(e.key);
      if (typeof window !== "undefined" && (window as any).__swiftTypePlaySound) {
        (window as any).__swiftTypePlaySound(correct ? "correct" : "error");
      }
    }
  };

  const chars = targetText.split("");

  return (
    <div
      ref={containerRef}
      className="typing-panel relative w-full px-6 py-4 mb-2 cursor-text overflow-y-auto"
      style={{ minHeight: "88px", maxHeight: "140px", scrollbarWidth: "none" }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Hidden input receiver */}
      <input
        ref={inputRef}
        type="text"
        className="absolute opacity-0 pointer-events-none w-0 h-0"
        onKeyDown={handleKeyDown}
        aria-label="Typing input"
        readOnly
      />

      {/* Characters */}
      <div
        className="relative z-10 flex flex-wrap text-[1.2rem] leading-[1.75]"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {chars.map((char, i) => {
          const typed = typedText[i];
          let colorClass = "text-gray-600 dark:text-gray-400"; // untyped — strong obsidian

          if (typed != null) {
            colorClass =
              typed === char
                ? "text-brand-orange"
                : "text-red-600 dark:text-red-500 underline decoration-red-600 dark:decoration-red-500 underline-offset-4";
          }

          const isCaret = i === typedText.length && isActive;

          return (
            <span
              key={i}
              ref={isCaret ? activeCharRef : null}
              className={clsx("relative inline-block", colorClass)}
            >
              {isCaret && (
                <motion.span
                  className="absolute left-[-1px] top-[10%] h-[82%] w-[2px] bg-brand-orange rounded-full block"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 0.85 }}
                />
              )}
              {char === " " ? "\u00A0" : char}
            </span>
          );
        })}

        {/* Caret at end */}
        {isActive && typedText.length === targetText.length && (
          <motion.span
            className="inline-block w-[2px] h-[1.1em] bg-brand-orange rounded-full ml-0.5 mt-[0.25em]"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 0.85 }}
          />
        )}
      </div>

      {/* Idle state — minimal, no overlays */}
      {!isActive && !isFinished && typedText.length === 0 && targetText.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        </div>
      )}
    </div>
  );
}
