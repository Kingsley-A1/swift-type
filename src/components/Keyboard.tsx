"use client";

import { WINDOWS_LAYOUT, MAC_LAYOUT } from "@/data/keyboardLayouts";
import { useTypingStore } from "@/store/useTypingStore";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { LiveStats } from "./LiveStats";

// ─── FINGER COLORS (keybr.com palette — lighter pastels) ─────────────────────
const FINGER_COLOR: Record<string, { bg: string; shadow: string }> = {
  pinky: { bg: "#c8e6c9", shadow: "#9eca9f" }, // green
  ring: { bg: "#fff9c4", shadow: "#d4c97c" }, // yellow
  middle: { bg: "#ffe0b2", shadow: "#d4a265" }, // orange-peach
  index: { bg: "#ffcdd2", shadow: "#d49499" }, // red-pink
  thumb: { bg: "#f3e5f5", shadow: "#c8a7d0" }, // lavender
  action: { bg: "#e8e4de", shadow: "#b5b0a8" }, // warm grey
};

// Dark mode equivalents
const FINGER_COLOR_DARK: Record<string, { bg: string; shadow: string }> = {
  pinky: { bg: "#1e3a20", shadow: "#0d1f0f" },
  ring: { bg: "#2e2a00", shadow: "#1a1700" },
  middle: { bg: "#2e1a00", shadow: "#1a0f00" },
  index: { bg: "#2e1012", shadow: "#1a0608" },
  thumb: { bg: "#1e0f2a", shadow: "#0d060f" },
  action: { bg: "#2a2825", shadow: "#151412" },
};

export function Keyboard({ isBlocked = false }: { isBlocked?: boolean }) {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [capsLock, setCapsLock] = useState(false);
  const [kbMode, setKbMode] = useState<"windows" | "mac">("windows");
  const [isDark, setIsDark] = useState(false);

  const { targetText, typedText, isActive, typeChar, deleteChar } = useTypingStore();

  // Clear highlighted keys immediately when session stops
  useEffect(() => {
    if (!isActive) setActiveKeys(new Set());
  }, [isActive]);

  const nextChar =
    isActive && typedText.length < targetText.length
      ? targetText[typedText.length]
      : null;

  const layout = kbMode === "mac" ? MAC_LAYOUT : WINDOWS_LAYOUT;

  // Detect dark mode
  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (typeof e.getModifierState === "function") {
        setCapsLock(e.getModifierState("CapsLock"));
      }
      if (!isActive) return; // only highlight during an active session
      setActiveKeys((p) => new Set(p).add(e.code));
    };
    const up = (e: KeyboardEvent) => {
      if (typeof e.getModifierState === "function") {
        setCapsLock(e.getModifierState("CapsLock"));
      }
      setActiveKeys((p) => {
        const n = new Set(p);
        n.delete(e.code);
        return n;
      });
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [isActive]);

  const colors = isDark ? FINGER_COLOR_DARK : FINGER_COLOR;

  return (
    <div className="w-full">
      {/* Mode Switcher & Live Stats */}
      <div className="mb-2.5 flex items-center justify-between px-0.5">
        <div className="flex-1 flex items-center justify-start min-w-0">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
            Keyboard Layout
          </span>
        </div>
        
        <div className="flex-shrink-0 flex justify-center px-4">
          <LiveStats />
        </div>

        <div className="flex-1 flex items-center justify-end min-w-0">
          <div className="flex rounded-lg overflow-hidden border border-[#fa4c0c]/20 dark:border-[#fa4c0c]/25 bg-white dark:bg-[#181a20]">
          {(["windows", "mac"] as const).map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => setKbMode(m)}
              className={clsx(
                "px-3 py-1 text-[10px] font-semibold transition-colors duration-100",
                kbMode === m
                  ? "bg-brand-orange text-white"
                  : "text-gray-500 dark:text-gray-300 hover:bg-[#fff4ef] hover:text-[#fa4c0c] dark:hover:bg-[#fa4c0c]/12 dark:hover:text-[#fa4c0c]",
              )}
            >
              {m === "windows" ? "Windows" : "MacBook"}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Keyboard body */}
      <div
        className="w-full rounded-xl p-3 relative transition-opacity duration-200"
        style={{
          background: isDark ? "rgba(30,32,38,0.95)" : "rgba(245,245,240,0.95)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
          opacity: isBlocked ? 0.35 : 1,
          pointerEvents: isBlocked ? "none" : "auto",
        }}
      >
        <div className="flex flex-col gap-1.25 w-full">
          {layout.map((row) => (
            <div
              key={row.map((key) => key.id).join("|")}
              className="flex gap-1.25 w-full"
            >
              {row.map((key) => {
                const isPressed = activeKeys.has(key.id);
                const isNextKey =
                  nextChar !== null &&
                  (key.mainChar === nextChar ||
                    key.mainChar === nextChar.toLowerCase() ||
                    key.shiftChar === nextChar);

                const { bg, shadow } = colors[key.finger];
                const flexGrow = key.widthFlex ?? 1;

                // Determine if it's a letter (has uppercase and lowercase)
                const isLetter =
                  key.mainChar.length === 1 &&
                  key.mainChar.toLowerCase() !== key.mainChar.toUpperCase();

                // Determine label
                const mainLabel =
                  capsLock && key.mainChar.length === 1
                    ? key.mainChar.toUpperCase()
                    : key.display || key.mainChar;

                return (
                  <div
                    key={key.id}
                    onPointerDown={(e) => {
                      e.preventDefault(); // Keep focus on the hidden input
                      setActiveKeys((p) => new Set(p).add(key.id));
                      
                      if (!isActive) return;
                      
                      if (key.id === "Backspace") {
                        deleteChar();
                        return;
                      }
                      
                      if (key.id === "Tab" || key.id === "CapsLock" || key.id.startsWith("Shift") || key.id.startsWith("Control") || key.id.startsWith("Alt") || key.id.startsWith("Meta") || key.id === "Enter" || key.id.startsWith("Arrow") || key.id === "fn") {
                        if (key.id === "CapsLock") {
                          setCapsLock(!capsLock);
                        }
                        return;
                      }

                      let charToType = key.mainChar;
                      if (key.id === "Space") charToType = " ";
                      else if (capsLock && charToType.length === 1) {
                        charToType = charToType.toUpperCase();
                      }

                      const expectedChar = targetText[typedText.length] ?? "";
                      
                      const isLetter = /^[a-z]$/i.test(charToType) && /^[a-z]$/i.test(expectedChar);
                      let storedChar = charToType;
                      if (isLetter && charToType.toLowerCase() === expectedChar.toLowerCase()) {
                        storedChar = expectedChar;
                      }

                      const correct = storedChar === expectedChar;
                      typeChar(storedChar);
                      
                      const typedWindow = window as any;
                      if (typedWindow.__swiftTypePlaySound) {
                        typedWindow.__swiftTypePlaySound(correct ? "correct" : "error");
                      }
                    }}
                    onPointerUp={() => setActiveKeys((p) => { const n = new Set(p); n.delete(key.id); return n; })}
                    onPointerLeave={() => setActiveKeys((p) => { const n = new Set(p); n.delete(key.id); return n; })}
                    style={{
                      flexGrow: flexGrow,
                      flexBasis: 0,
                      // Key color
                      backgroundColor: isPressed
                        ? "#fa4c0c"
                        : isNextKey
                          ? isDark
                            ? "rgba(250,76,12,0.25)"
                            : "rgba(250,76,12,0.15)"
                          : bg,
                      // 3D shadow — bottom edge only, like physical keycap
                      boxShadow: isPressed
                        ? "none"
                        : isNextKey
                          ? `0 2px 0 rgba(250,76,12,0.5), 0 0 0 1.5px rgba(250,76,12,0.6)`
                          : `0 2px 0 ${shadow}`,
                      // Pressed = translate down
                      transform: isPressed
                        ? "translateY(2px)"
                        : "translateY(0)",
                      // Color on pressed / next
                      color: isPressed
                        ? "#fff"
                        : isNextKey
                          ? "#fa4c0c"
                          : isDark
                            ? "#d1d5db"
                            : "#374151",
                    }}
                    className="flex flex-col items-center justify-center min-h-11.5 rounded-[7px] text-[11px] font-semibold transition-all duration-60 select-none cursor-pointer overflow-hidden"
                  >
                    {/* Shift char top-left */}
                    {key.shiftChar && key.finger !== "action" && !isLetter ? (
                      <div className="flex flex-col items-center w-full px-1">
                        <span
                          className="self-start text-[8px] leading-none opacity-50 font-medium"
                          style={{
                            color:
                              isNextKey && key.shiftChar === nextChar
                                ? "#fa4c0c"
                                : undefined,
                          }}
                        >
                          {key.shiftChar}
                        </span>
                        <span className="text-[12px] font-bold leading-none mt-px">
                          {capsLock ? key.mainChar.toUpperCase() : key.mainChar}
                        </span>
                      </div>
                    ) : (
                      <span
                        className={clsx(
                          "leading-none flex items-center justify-center",
                          key.finger === "action"
                            ? "text-[10px]"
                            : "text-[12px] font-bold",
                        )}
                      >
                        {mainLabel === "Win" ? (
                          <svg viewBox="0 0 88 88" width="14" height="14" fill="currentColor">
                            <path d="M0 12.402l35.687-4.86.016 34.423-35.67.203zm35.67 33.53l-.015 33.91-35.64-4.882.02-31.57zm4.326-39.04L87.314 0v41.527l-47.318.376zm47.329 39.35L87.314 88l-47.315-6.61-.012-35.32z"/>
                          </svg>
                        ) : mainLabel === " " ? "" : mainLabel}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
