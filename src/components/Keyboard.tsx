"use client";

import { WINDOWS_LAYOUT, MAC_LAYOUT } from "@/data/keyboardLayouts";
import { useTypingStore } from "@/store/useTypingStore";
import { useEffect, useState } from "react";
import { type FingerMapping } from "@/data/keyboardLayouts";
import clsx from "clsx";

// ─── FINGER COLORS (keybr.com palette — lighter pastels) ─────────────────────
const FINGER_COLOR: Record<string, { bg: string; shadow: string }> = {
  pinky:  { bg: "#c8e6c9", shadow: "#9eca9f" },  // green
  ring:   { bg: "#fff9c4", shadow: "#d4c97c" },  // yellow
  middle: { bg: "#ffe0b2", shadow: "#d4a265" },  // orange-peach
  index:  { bg: "#ffcdd2", shadow: "#d49499" },  // red-pink
  thumb:  { bg: "#f3e5f5", shadow: "#c8a7d0" },  // lavender
  action: { bg: "#e8e4de", shadow: "#b5b0a8" },  // warm grey
};

// Dark mode equivalents
const FINGER_COLOR_DARK: Record<string, { bg: string; shadow: string }> = {
  pinky:  { bg: "#1e3a20", shadow: "#0d1f0f" },
  ring:   { bg: "#2e2a00", shadow: "#1a1700" },
  middle: { bg: "#2e1a00", shadow: "#1a0f00" },
  index:  { bg: "#2e1012", shadow: "#1a0608" },
  thumb:  { bg: "#1e0f2a", shadow: "#0d060f" },
  action: { bg: "#2a2825", shadow: "#151412" },
};

export function Keyboard() {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [capsLock, setCapsLock] = useState(false);
  const [kbMode, setKbMode] = useState<"windows" | "mac">("windows");
  const [isDark, setIsDark] = useState(false);

  const { targetText, typedText, isActive } = useTypingStore();

  const nextChar =
    isActive && typedText.length < targetText.length
      ? targetText[typedText.length]
      : null;

  const layout = kbMode === "mac" ? MAC_LAYOUT : WINDOWS_LAYOUT;

  // Find which finger the next key requires
  const nextFinger: FingerMapping | null = (() => {
    if (!nextChar) return null;
    for (const row of layout) {
      for (const key of row) {
        if (
          key.mainChar === nextChar ||
          key.mainChar === nextChar.toLowerCase() ||
          key.shiftChar === nextChar
        ) {
          return key.finger;
        }
      }
    }
    return null;
  })();

  // Detect dark mode
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      setActiveKeys((p) => new Set(p).add(e.code));
      if (e.code === "CapsLock") setCapsLock(e.getModifierState("CapsLock"));
    };
    const up = (e: KeyboardEvent) => {
      setActiveKeys((p) => { const n = new Set(p); n.delete(e.code); return n; });
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  const colors = isDark ? FINGER_COLOR_DARK : FINGER_COLOR;

  return (
    <div className="w-full">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between mb-2 px-0.5">
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Keyboard Layout</span>
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-white/8 bg-gray-100 dark:bg-white/5">
          {(["windows", "mac"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setKbMode(m)}
              className={clsx(
                "px-3 py-1 text-[10px] font-semibold transition-colors duration-100",
                kbMode === m
                  ? "bg-brand-orange text-white"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
              )}
            >
              {m === "windows" ? "Windows" : "MacBook"}
            </button>
          ))}
        </div>
      </div>

      {/* Finger position guide removed for now per user request */}

      {/* Keyboard body */}
      <div
        className="w-full rounded-xl p-3"
        style={{
          background: isDark ? "rgba(30,32,38,0.95)" : "rgba(245,245,240,0.95)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        }}
      >
        <div className="flex flex-col gap-[5px] w-full">
          {layout.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-[5px] w-full">
              {row.map((key) => {
                const isPressed = activeKeys.has(key.id);
                const isNextKey =
                  nextChar !== null &&
                  (key.mainChar === nextChar ||
                    key.mainChar === nextChar.toLowerCase() ||
                    key.shiftChar === nextChar);

                const { bg, shadow } = colors[key.finger];
                const flexGrow = key.widthFlex ?? 1;

                // Determine label
                const mainLabel =
                  capsLock && key.mainChar.length === 1
                    ? key.mainChar.toUpperCase()
                    : key.display || key.mainChar;

                return (
                  <div
                    key={key.id}
                    style={{
                      flexGrow: flexGrow,
                      flexBasis: 0,
                      // Key color
                      backgroundColor: isPressed
                        ? "#ff6b35"
                        : isNextKey
                          ? isDark ? "rgba(255,107,53,0.25)" : "rgba(255,107,53,0.15)"
                          : bg,
                      // 3D shadow — bottom edge only, like physical keycap
                      boxShadow: isPressed
                        ? "none"
                        : isNextKey
                          ? `0 2px 0 rgba(255,107,53,0.5), 0 0 0 1.5px rgba(255,107,53,0.6)`
                          : `0 2px 0 ${shadow}`,
                      // Pressed = translate down
                      transform: isPressed ? "translateY(2px)" : "translateY(0)",
                      // Color on pressed / next
                      color: isPressed ? "#fff" : isNextKey ? "#ff6b35" : isDark ? "#d1d5db" : "#374151",
                    }}
                    className="flex flex-col items-center justify-center min-h-[46px] rounded-[7px] text-[11px] font-semibold transition-all duration-[60ms] select-none cursor-default overflow-hidden"
                  >
                    {/* Shift char top-left */}
                    {key.shiftChar && key.finger !== "action" ? (
                      <div className="flex flex-col items-center w-full px-1">
                        <span
                          className="self-start text-[8px] leading-none opacity-50 font-medium"
                          style={{ color: isNextKey && key.shiftChar === nextChar ? "#ff6b35" : undefined }}
                        >
                          {key.shiftChar}
                        </span>
                        <span className="text-[12px] font-bold leading-none mt-[1px]">
                          {capsLock ? key.mainChar.toUpperCase() : key.mainChar}
                        </span>
                      </div>
                    ) : (
                      <span className={clsx("leading-none", key.finger === "action" ? "text-[10px]" : "text-[12px] font-bold")}>
                        {mainLabel === " " ? "" : mainLabel}
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
