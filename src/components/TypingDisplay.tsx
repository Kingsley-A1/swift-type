"use client";

import { useTypingStore } from "@/store/useTypingStore";
import React, { useEffect, useRef, useState, memo, forwardRef } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

const CharSpan = memo(
  forwardRef<
    HTMLSpanElement,
    {
      expectedChar: string;
      displayChar: string;
      typed: string | undefined;
      isCaret: boolean;
    }
  >(({ expectedChar, displayChar, typed, isCaret }, ref) => {
    let colorClass = "text-gray-600 dark:text-gray-400"; // untyped
    let bgClass = "";

    if (typed != null) {
      if (typed === expectedChar) {
        colorClass = "text-brand-orange";
      } else {
        colorClass =
          "text-red-600 dark:text-red-500 underline decoration-red-600 dark:decoration-red-500 underline-offset-4";
        if (expectedChar === " ") {
          bgClass = "bg-red-500/20 rounded-[2px]";
        }
      }
    }

    return (
      <span
        ref={ref}
        className={clsx("relative inline-block", colorClass, bgClass)}
      >
        {isCaret && (
          <motion.span
            className="absolute -left-px top-[10%] h-[82%] w-0.5 bg-brand-orange rounded-full block"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 0.85 }}
          />
        )}
        {displayChar === " " ? "\u00A0" : displayChar}
      </span>
    );
  }),
);
CharSpan.displayName = "CharSpan";

export function TypingDisplay({ isBlocked = false }: { isBlocked?: boolean }) {
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
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeCharRef = useRef<HTMLSpanElement>(null);

  // Keep focus on input when active (but not when blocked by a panel)
  useEffect(() => {
    if (isBlocked) {
      inputRef.current?.blur();
    } else if (isActive) {
      inputRef.current?.focus();
    }
  }, [isActive, isBlocked]);

  // Auto-scroll the container to keep the active character vertically centered
  useEffect(() => {
    if (isActive && activeCharRef.current && containerRef.current) {
      activeCharRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [typedText.length, isActive]);

  useEffect(() => {
    const handleModifierState = (event: KeyboardEvent) => {
      setIsCapsLockOn(event.getModifierState("CapsLock"));
    };

    window.addEventListener("keydown", handleModifierState);
    window.addEventListener("keyup", handleModifierState);

    return () => {
      window.removeEventListener("keydown", handleModifierState);
      window.removeEventListener("keyup", handleModifierState);
    };
  }, []);

  function getStoredCharacter(pressedChar: string, expectedChar: string) {
    const isLetter =
      /^[a-z]$/i.test(pressedChar) && /^[a-z]$/i.test(expectedChar);
    if (isLetter && pressedChar.toLowerCase() === expectedChar.toLowerCase()) {
      return expectedChar;
    }

    return pressedChar;
  }

  function getDisplayCharacter(char: string) {
    if (!isCapsLockOn || !/[a-z]/i.test(char)) {
      return char;
    }

    return char.toUpperCase();
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      resetSession();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      if (isActive) endSession();
      return;
    }
    if (isBlocked) return;
    if (!isActive) return;
    if (e.key === "Backspace") {
      deleteChar();
      return;
    }
    if (e.key.length === 1) {
      e.preventDefault();
      const expectedChar = targetText[typedText.length] ?? "";
      const storedChar = getStoredCharacter(e.key, expectedChar);
      const correct = storedChar === expectedChar;
      setIsCapsLockOn(e.getModifierState("CapsLock"));
      typeChar(storedChar);
      if (
        typeof window !== "undefined" &&
        (window as any).__swiftTypePlaySound
      ) {
        (window as any).__swiftTypePlaySound(correct ? "correct" : "error");
      }
    }
  };

  const chars = targetText.split("");

  return (
    <div
      ref={containerRef}
      className="typing-panel relative mb-2.5 w-full cursor-text overflow-y-auto px-6 py-4"
      style={{
        height: "160px",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,107,53,0.25) transparent",
      }}
      onClick={() => !isBlocked && inputRef.current?.focus()}
    >
      {/* Hidden input receiver */}
      <input
        ref={inputRef}
        type="text"
        className="absolute opacity-0 pointer-events-none w-0 h-0"
        onKeyDown={handleKeyDown}
        aria-label="Typing input"
        readOnly
        tabIndex={isBlocked ? -1 : 0}
        data-typing-input="true"
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
              expectedChar={char}
              displayChar={getDisplayCharacter(char)}
              typed={typed}
              isCaret={isCaret}
            />
          );
        })}

        {/* Caret at end */}
        {isActive && typedText.length === targetText.length && (
          <motion.span
            className="inline-block w-0.5 h-[1.1em] bg-brand-orange rounded-full ml-0.5 mt-[0.25em]"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 0.85 }}
          />
        )}
      </div>
    </div>
  );
}
