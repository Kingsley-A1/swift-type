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

function readMetadataNumber(
  metadata: RewardRecord["metadata"],
  key: string,
): number | null {
  const value = metadata?.[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
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
  const displayStreakCount = useMemo(() => {
    return (
      readMetadataNumber(reward.metadata, "currentStreak") ??
      readMetadataNumber(reward.metadata, "threshold") ??
      streakCount
    );
  }, [reward.metadata, streakCount]);

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
        className="relative flex w-full flex-col overflow-hidden rounded-[28px] border border-gray-200 bg-white p-6 font-sans shadow-sm dark:border-white/10 dark:bg-black/35 dark:backdrop-blur-xl"
        style={{ minHeight: "280px" }}
      >
        {/* Soft atmospheric glow */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-brand-orange/10 blur-3xl" />

        <div className="relative z-10 flex h-full flex-1 flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo-192.png"
                alt="SwiftType"
                width={24}
                height={24}
                className="rounded"
              />
              <span className="flex items-baseline gap-1 text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                Swift
                <span className="text-brand-orange">Type</span>
              </span>
            </div>

            <div className="rounded-full border border-brand-orange/20 bg-brand-orange/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
              Reward Card
            </div>
          </div>

          <div className="my-5">
            <h3 className="mb-2 text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              {reward.title}
            </h3>
            <p className="max-w-[92%] text-sm font-medium leading-relaxed text-gray-500 dark:text-gray-400">
              {reward.description}
            </p>
            {completedGoalTitle && (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={14} className="opacity-80" />
                Goal completed: {completedGoalTitle}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-4 dark:border-white/8">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
                Streak
              </p>
              <div className="flex items-center gap-1.5">
                <Flame size={16} className="text-brand-orange" />
                <span className="text-xl font-black leading-none text-gray-900 dark:text-white">
                  {displayStreakCount}
                </span>
              </div>
            </div>

            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
                Date
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {new Date(reward.earnedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="text-right">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
                Typist
              </p>
              <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                {displayName}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <button
          onClick={handleDownload}
          disabled={isProcessing}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-orange px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-500 disabled:opacity-60"
        >
          <Download size={14} />
          Download PNG
        </button>

        <button
          onClick={handleCopy}
          disabled={isProcessing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-brand-orange/30 hover:text-brand-orange disabled:opacity-60 dark:border-white/10 dark:text-gray-200"
        >
          <Copy size={14} />
          Copy
        </button>

        <button
          onClick={handleShare}
          disabled={isProcessing || !canNativeShare}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-brand-orange/30 hover:text-brand-orange disabled:opacity-50 dark:border-white/10 dark:text-gray-200"
          title="Share"
          aria-label="Share"
        >
          <Share2 size={14} />
          <span className="sm:hidden">Share</span>
        </button>
      </div>

      {statusMessage && (
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={13} />
          {statusMessage}
        </p>
      )}
    </div>
  );
}
