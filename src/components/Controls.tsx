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
import { useState, useRef } from "react";
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
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
        {label}
      </span>
      <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-white/8 bg-gray-100 dark:bg-white/5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => !disabled && onChange(opt.value)}
            disabled={disabled}
            className={clsx(
              "px-2.5 py-1 text-[11px] font-semibold transition-all duration-100 select-none whitespace-nowrap",
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
        "flex items-center justify-center w-7 h-7 rounded-lg border text-[11px] font-semibold transition-all duration-100",
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

  const playSound = (type: "correct" | "error") => {
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
  };

  if (typeof window !== "undefined") {
    (window as any).__swiftTypePlaySound = playSound;
  }

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
    <div className="control-card flex items-stretch mb-3 divide-x divide-gray-200 dark:divide-white/8">
      {/* ── Card 1 (2): Action Buttons ─────────────────────────────────── */}
      <div className="flex items-center gap-1.5 px-3 py-2 shrink-0">
        <button
          onClick={handleStart}
          disabled={isActive}
          title="Start (Enter)"
          className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-orange text-white disabled:opacity-40 transition-all hover:bg-orange-500 active:scale-95"
        >
          <Play size={12} fill="currentColor" />
        </button>
        <button
          onClick={endSession}
          disabled={!isActive}
          title="Stop (Esc)"
          className="flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 dark:border-white/8 text-gray-500 dark:text-gray-400 disabled:opacity-40 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200 transition-all active:scale-95"
        >
          <Square size={11} fill="currentColor" />
        </button>
        <button
          onClick={resetSession}
          title="Restart (Tab)"
          className="flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 dark:border-white/8 text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200 transition-all active:scale-95"
        >
          <RotateCcw size={11} />
        </button>
      </div>

      {/* ── Card 2 (6): Pill Selectors ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2 flex-1 min-w-0">
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
      <div className="flex items-center gap-1.5 px-3 py-2 shrink-0 relative">
        <IconBtn
          active={useAdaptive}
          disabled={isActive || mode === "curriculum"}
          onClick={() => setUseAdaptive(!useAdaptive)}
          title="Adaptive AI — drills your weak keys"
          activeClass="bg-brand-orange/10 text-brand-orange border-brand-orange/25"
        >
          <Image src="/swift-ai-icon.png" alt="Swift AI" width={13} height={13} className="rounded-sm" />
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
