"use client";

import { useEffect, useMemo, useState } from "react";

type DeviceGuidanceKind = "phone" | "tablet";

function detectGuidanceKind(): DeviceGuidanceKind | null {
  if (typeof navigator === "undefined") return null;

  const ua = navigator.userAgent;
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const isIpad = /\biPad\b/i.test(ua) ||
    (navigator.platform === "MacIntel" && maxTouchPoints > 1);
  const isAndroid = /\bAndroid\b/i.test(ua);
  const isAndroidMobile = /Android.*Mobile/i.test(ua);
  const isPhone = /iPhone|iPod|Windows Phone|Mobile/i.test(ua) || isAndroidMobile;
  const isAndroidTablet = isAndroid && !isAndroidMobile;

  if (isIpad || isAndroidTablet) {
    return "tablet";
  }

  if (isPhone) {
    return "phone";
  }

  return null;
}

export function DeviceGuidanceModal() {
  const [kind, setKind] = useState<DeviceGuidanceKind | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const storageKey = "swift-type-device-guidance-v1";
    const alreadySeen = window.sessionStorage.getItem(storageKey);
    if (alreadySeen === "1") {
      return;
    }

    const detectedKind = detectGuidanceKind();
    if (!detectedKind) {
      return;
    }

    setKind(detectedKind);
    setOpen(true);
  }, []);

  const content = useMemo(() => {
    if (kind === "tablet") {
      return {
        title: "Best Experience With a Keyboard",
        body: "Swift Type works on tablets, but your best progress comes when a physical keyboard is connected. For iPad and Android tablets, pair a wired or wireless keyboard for accurate speed and precision training.",
      };
    }

    return {
      title: "Desktop Experience Recommended",
      body: "Swift Type is built primarily for desktop and laptop typing practice. You can explore on mobile, but full training quality, speed tracking, and consistency are best achieved on a desktop setup.",
    };
  }, [kind]);

  if (!open || !kind) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#14161c]">
        <h2 className="text-base font-black text-gray-900 dark:text-white">
          {content.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {content.body}
        </p>

        <button
          type="button"
          onClick={() => {
            window.sessionStorage.setItem("swift-type-device-guidance-v1", "1");
            setOpen(false);
          }}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-brand-orange px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Continue to Swift Type
        </button>
      </div>
    </div>
  );
}
