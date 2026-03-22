"use client";

import { useMemo, useRef, useState } from "react";
import { Flame, Download, Share2, Copy, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import type { RewardRecord } from "@/lib/rewards";

interface RewardCardProps {
  reward: RewardRecord;
  streakCount: number;
  userName?: string | null;
  completedGoalTitle?: string;
}

function toFileName(reward: RewardRecord) {
  const normalized = reward.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `swift-type-${normalized || "reward"}.png`;
}

export function RewardCard({
  reward,
  streakCount,
  userName,
  completedGoalTitle,
}: RewardCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const displayName = useMemo(() => {
    if (userName && userName.trim().length > 0) {
      return userName;
    }

    return "Swift Type User";
  }, [userName]);

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const generateBlob = async () => {
    if (!cardRef.current) {
      return null;
    }

    const { toBlob } = await import("html-to-image");
    return toBlob(cardRef.current, {
      cacheBust: true,
      pixelRatio: 2,
    });
  };

  const handleDownload = async () => {
    if (!cardRef.current) {
      return;
    }

    setIsProcessing(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = toFileName(reward);
      link.click();
      setStatusMessage("Card downloaded.");
    } catch {
      setStatusMessage("Unable to export card right now.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.clipboard ||
      !window.ClipboardItem
    ) {
      setStatusMessage("Copy image is not supported in this browser.");
      return;
    }

    setIsProcessing(true);
    try {
      const blob = await generateBlob();
      if (!blob) {
        setStatusMessage("Unable to copy card right now.");
        return;
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);

      setStatusMessage("Card copied to clipboard.");
    } catch {
      setStatusMessage("Unable to copy card right now.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    if (!canNativeShare) {
      setStatusMessage("Native share is not supported in this browser.");
      return;
    }

    setIsProcessing(true);
    try {
      const blob = await generateBlob();
      if (!blob) {
        setStatusMessage("Unable to share card right now.");
        return;
      }

      const file = new File([blob], toFileName(reward), { type: "image/png" });
      await navigator.share({
        title: "Swift Type Progress",
        text: `${reward.title} · ${reward.description}`,
        files: [file],
      });
      setStatusMessage("Shared successfully.");
    } catch {
      setStatusMessage("Share cancelled or not available.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        className="w-full relative overflow-hidden rounded-[24px] border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 dark:backdrop-blur-xl shadow-sm flex flex-col p-6 font-sans aspect-[12/7]"
      >
        {/* Soft atmospheric glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/5 rounded-full blur-[64px] -mr-20 -mt-20 pointer-events-none" />

        <div className="flex-1 flex flex-col justify-between relative z-10 w-full">
          {/* Header row with Logo */}
          <div className="flex justify-between items-start w-full">
            <div className="flex items-center gap-2">
              {/* Logo icon */}
              <Image src="/logo-192.png" alt="SwiftType" width={24} height={24} className="rounded" />
              <span className="font-bold text-gray-900 dark:text-white tracking-tight flex gap-1 items-baseline text-lg">
                Swift
                <span className="text-brand-orange">Type</span>
              </span>
            </div>

            {/* Tiny badge */}
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-orange bg-brand-orange/10 rounded-full">
              Achievement
            </div>
          </div>

          {/* Central message */}
          <div className="my-6">
            <h3 className="text-gray-900 dark:text-white text-3xl font-black tracking-tight mb-2">
              {reward.title}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed max-w-[85%]">
              {reward.description}
            </p>
            {completedGoalTitle && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-3 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="opacity-80" />
                Goal completed: {completedGoalTitle}
              </p>
            )}
          </div>

          {/* Footer stats row */}
          <div className="flex items-end justify-between w-full pt-4 border-t border-gray-100 dark:border-white/5">
            <div className="flex gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold mb-1">
                  Streak
                </p>
                <div className="flex items-center gap-1.5">
                  <Flame size={16} className="text-brand-orange" />
                  <span className="text-gray-900 dark:text-white font-black text-xl leading-none">
                    {streakCount}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold mb-1">
                  Date
                </p>
                <p className="text-gray-900 dark:text-white font-bold text-sm">
                  {new Date(reward.earnedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold mb-1">
                Typist
              </p>
              <p className="text-gray-900 dark:text-white font-bold text-sm">
                {displayName}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          onClick={handleDownload}
          disabled={isProcessing}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-brand-orange/30 hover:text-brand-orange transition-colors disabled:opacity-60"
        >
          <Download size={14} />
          Download PNG
        </button>

        <button
          onClick={handleCopy}
          disabled={isProcessing}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-brand-orange/30 hover:text-brand-orange transition-colors disabled:opacity-60"
        >
          <Copy size={14} />
          Copy
        </button>

        <button
          onClick={handleShare}
          disabled={isProcessing || !canNativeShare}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-brand-orange/30 hover:text-brand-orange transition-colors disabled:opacity-50"
        >
          <Share2 size={14} />
          Share
        </button>
      </div>

      {statusMessage && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1.5">
          <CheckCircle2 size={13} />
          {statusMessage}
        </p>
      )}
    </div>
  );
}
