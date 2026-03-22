"use client";

import { useTypingStore } from "@/store/useTypingStore";
import React, { useEffect, useRef, memo, forwardRef } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

const CharSpan = memo(
  forwardRef<
    HTMLSpanElement,
    { char: string; typed: string | undefined; isCaret: boolean }
  >(({ char, typed, isCaret }, ref) => {
    let colorClass = "text-gray-600 dark:text-gray-400"; // untyped
    let bgClass = "";

    if (typed != null) {
      if (typed === char) {
        colorClass = "text-brand-orange";
      } else {
        colorClass = "text-red-600 dark:text-red-500 underline decoration-red-600 dark:decoration-red-500 underline-offset-4";
        if (char === " ") {
          bgClass = "bg-red-500/20 rounded-[2px]";
        }
      }
    }

    return (
      <span ref={ref} className={clsx("relative inline-block", colorClass, bgClass)}>
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
  })
);
CharSpan.displayName = "CharSpan";

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
          const isCaret = i === typedText.length && isActive;

          return (
            <CharSpan
              key={i}
              ref={isCaret ? activeCharRef : null}
              char={char}
              typed={typed}
              isCaret={isCaret}
            />
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
    </div>
  );
}
