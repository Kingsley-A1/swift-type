import { useTypingStore } from "@/store/useTypingStore";
import {
  Play,
  Square,
  RotateCcw,
  Volume2,
  VolumeX,
  HelpCircle,
} from "lucide-react";
import Image from "next/image";
import { getRandomWords } from "@/data/dictionary";
import {
  generateAdaptiveText,
  generateCurriculumText,
  CURRICULUM_STAGES,
} from "@/lib/adaptiveEngine";
import { useState, useRef, useEffect, useCallback } from "react";
import { HintModal } from "./HintModal";
import clsx from "clsx";

// ─── PILL GROUP ───────────────────────────────────────────────────────────────
function PillGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
        {label}
      </span>
      <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-white/8 bg-gray-100 dark:bg-white/5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => !disabled && onChange(opt.value)}
            disabled={disabled}
            className={clsx(
              "px-3 py-1.5 text-[12px] font-semibold transition-all duration-100 select-none whitespace-nowrap",
              value === opt.value
                ? "bg-brand-orange text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
              disabled && "opacity-40 cursor-not-allowed",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── ICON BUTTON ─────────────────────────────────────────────────────────────
function IconBtn({
  active,
  onClick,
  disabled,
  title,
  children,
  activeClass = "bg-brand-orange/10 text-brand-orange border-brand-orange/25",
}: {
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx(
        "flex items-center justify-center h-8 w-8 rounded-xl border text-[11px] font-semibold transition-all duration-100",
        active
          ? activeClass
          : "border-gray-200 dark:border-white/8 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/15 hover:text-gray-700 dark:hover:text-gray-200",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      {children}
    </button>
  );
}

// ─── CONTROLS ─────────────────────────────────────────────────────────────────
export function Controls() {
  const {
    isActive,
    startSession,
    resetSession,
    endSession,
    mode,
    setConfig,
    duration,
    level,
    wordCount,
    curriculumStage,
    perKeyStats,
    nGramStats,
  } = useTypingStore();

  const [useAdaptive, setUseAdaptive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const hintBtnRef = useRef<HTMLButtonElement>(null);
  const audioCtx = useRef<AudioContext | null>(null);

  const playSound = useCallback((type: "correct" | "error") => {
    if (!soundEnabled) return;
    if (!audioCtx.current) audioCtx.current = new AudioContext();
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = type === "correct" ? 880 : 220;
    osc.type = type === "correct" ? "sine" : "square";
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }, [soundEnabled]);

  // Register sound handler on window — properly cleaned up on unmount
  useEffect(() => {
    (window as any).__swiftTypePlaySound = playSound;
    return () => { (window as any).__swiftTypePlaySound = undefined; };
  }, [playSound]);

  // Regenerate preview text when config changes (and no session is running)
  useEffect(() => {
    const state = useTypingStore.getState();
    // Don't touch text during an active session or if the intro hasn't been played yet
    if (state.isActive || state.isFinished || !state.hasPlayedIntro) return;

    let count = 30;
    if (mode === "timed") {
      const baseWpm =
        level === "advanced" ? 100 : level === "intermediate" ? 60 : 20;
      count = Math.ceil((baseWpm * duration) / 60);
    } else {
      count = wordCount;
    }

    const text =
      mode === "curriculum"
        ? generateCurriculumText(curriculumStage, count)
        : getRandomWords(level as any, count);

    useTypingStore.setState({ targetText: text, typedText: "", mistakes: 0, keystrokes: 0 });
  }, [mode, level, duration, wordCount, curriculumStage]);

  const handleStart = () => {
    const state = useTypingStore.getState();
    if (
      !state.hasPlayedIntro &&
      !state.isActive &&
      !state.isFinished &&
      state.targetText ===
        "swift type teaches you touch typing happy learning click enter to start"
    ) {
      state.setConfig({ mode: "timed", duration: 60, hasPlayedIntro: true });
      startSession(state.targetText);
      return;
    }

    let count = 30;
    if (mode === "timed") {
      const baseWpm =
        level === "advanced" ? 100 : level === "intermediate" ? 60 : 20;
      count = Math.ceil((baseWpm * duration) / 60);
    } else {
      count = wordCount;
    }

    const text =
      mode === "curriculum"
        ? generateCurriculumText(curriculumStage, count)
        : useAdaptive
          ? generateAdaptiveText(perKeyStats, nGramStats, level as any, count)
          : getRandomWords(level as any, count);
    startSession(text);
  };

  const modeOptions = [
    { value: "timed" as const, label: "Timed" },
    { value: "words" as const, label: "Words" },
    { value: "curriculum" as const, label: "Curriculum" },
  ];
  const levelOptions = [
    { value: "beginner" as const, label: "Beginner" },
    { value: "intermediate" as const, label: "Inter." },
    { value: "advanced" as const, label: "Advanced" },
  ];
  const durationOptions = [
    { value: "15", label: "15s" },
    { value: "30", label: "30s" },
    { value: "60", label: "60s" },
    { value: "120", label: "120s" },
  ];

  return (
    <div className="control-card mb-3.5 flex items-stretch divide-x divide-gray-200 dark:divide-white/8">
      {/* ── Card 1 (2): Action Buttons ─────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-2 px-4 py-2.5">
        {/* Start / Restart — primary action */}
        <button
          onClick={handleStart}
          disabled={isActive}
          title="Start (Enter)"
          className={clsx(
            "flex h-9 items-center gap-1.5 rounded-xl px-4 text-[12px] font-bold transition-all duration-100 active:scale-95",
            isActive
              ? "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-white/8 dark:text-gray-500"
              : "bg-brand-orange text-white hover:bg-orange-500",
          )}
        >
          <Play size={12} fill="currentColor" />
          Start
        </button>
        {/* Stop */}
        <button
          onClick={endSession}
          disabled={!isActive}
          title="Stop (Esc)"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition-all duration-100 hover:border-red-300 hover:bg-red-50 hover:text-red-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/8 dark:text-gray-500 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-400"
        >
          <Square size={12} fill="currentColor" />
        </button>
        {/* Restart / Retry */}
        <button
          onClick={resetSession}
          title="Restart (Tab)"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition-all duration-100 hover:border-brand-orange/40 hover:bg-brand-orange/5 hover:text-brand-orange active:scale-95 dark:border-white/8 dark:text-gray-500 dark:hover:border-brand-orange/30 dark:hover:text-brand-orange"
        >
          <RotateCcw size={12} />
        </button>
      </div>

      {/* ── Card 2 (6): Pill Selectors ─────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5">
        <PillGroup
          label="Mode"
          options={modeOptions}
          value={mode}
          onChange={(v) => setConfig({ mode: v })}
          disabled={isActive}
        />
        {mode === "curriculum" ? (
          <PillGroup
            label="Stage"
            options={[
              { value: "1", label: "Home Row" },
              { value: "2", label: "Top Row" },
              { value: "3", label: "Bottom Row" },
            ]}
            value={String(curriculumStage)}
            onChange={(v) => setConfig({ curriculumStage: parseInt(v) })}
            disabled={isActive}
          />
        ) : (
          <PillGroup
            label="Level"
            options={levelOptions}
            value={level as any}
            onChange={(v) => setConfig({ level: v })}
            disabled={isActive}
          />
        )}

        {mode === "timed" && (
          <PillGroup
            label="Duration"
            options={durationOptions}
            value={String(duration)}
            onChange={(v) => setConfig({ duration: parseInt(v) })}
            disabled={isActive}
          />
        )}
        {(mode === "words" || mode === "curriculum") && (
          <PillGroup
            label="Words"
            options={[
              { value: "10", label: "10" },
              { value: "25", label: "25" },
              { value: "50", label: "50" },
              { value: "100", label: "100" },
            ]}
            value={String(wordCount)}
            onChange={(v) => setConfig({ wordCount: parseInt(v) })}
            disabled={isActive}
          />
        )}
      </div>

      {/* ── Card 3 (2): Toggles ─────────────────────────────────────────── */}
      <div className="relative flex shrink-0 items-center gap-2 px-3.5 py-2.5">
        <IconBtn
          active={useAdaptive}
          disabled={isActive || mode === "curriculum"}
          onClick={() => setUseAdaptive(!useAdaptive)}
          title="Adaptive AI — drills your weak keys"
          activeClass="bg-brand-orange/10 text-brand-orange border-brand-orange/25"
        >
          <Image src="/swift-ai-icon.png" alt="Swift AI" width={14} height={14} className="rounded-sm" />
        </IconBtn>

        <IconBtn
          active={soundEnabled}
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? "Mute sounds" : "Enable sounds"}
          activeClass="bg-blue-500/10 text-blue-500 border-blue-400/25"
        >
          {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
        </IconBtn>

        <IconBtn
          active={hintOpen}
          onClick={() => setHintOpen((v) => !v)}
          title="Keyboard shortcuts"
          activeClass="bg-gray-100 dark:bg-white/8 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-white/15"
        >
          <HelpCircle size={13} />
        </IconBtn>

        <HintModal
          isOpen={hintOpen}
          onClose={() => setHintOpen(false)}
          anchorRef={hintBtnRef}
        />
      </div>
    </div>
  );
}
