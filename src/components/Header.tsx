import { Flame, Eye } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { AuthModal } from "./AuthModal";
import { useState, useEffect } from "react";
import { useTypingStore } from "@/store/useTypingStore";
import { AnimatePresence, motion } from "framer-motion";

interface HeaderProps {
  onHistoryOpen: () => void;
  onSwiftAIOpen?: () => void;
}

export function Header({ onHistoryOpen, onSwiftAIOpen }: HeaderProps) {
  const { data: session, status } = useSession();
  const { goalStreak } = useTypingStore();
  const isAuthed = status === "authenticated";
  const streak = goalStreak.currentStreak;
  const [mounted, setMounted] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showMonitoringEye, setShowMonitoringEye] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isAuthed) {
      setShowMonitoringEye(false);
      return;
    }

    const intervalId = window.setInterval(() => {
      setShowMonitoringEye(true);
      window.setTimeout(() => setShowMonitoringEye(false), 1400);
    }, 5200);

    return () => window.clearInterval(intervalId);
  }, [isAuthed]);

  return (
    <>
      <header className="w-full flex items-center justify-between mb-3 pb-3 border-b border-gray-100 dark:border-white/6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
            <Image src="/logo-192.jpg" alt="SwiftType" width={28} height={28} />
          </div>
          <span className="text-[17px] font-black text-gray-900 dark:text-white tracking-tight">
            Swift<span className="text-brand-orange">Type</span>
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Ask Swift — orange when authed */}
          <button
            onClick={() => {
              if (isAuthed && onSwiftAIOpen) {
                onSwiftAIOpen();
              } else if (!isAuthed) {
                setIsAuthOpen(true);
              }
            }}
            className={
              isAuthed
                ? "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
                : "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold border border-gray-200 dark:border-white/8 text-gray-400 dark:text-gray-500 transition-all hover:border-gray-300 dark:hover:border-white/15"
            }
            style={
              isAuthed
                ? { background: "linear-gradient(135deg, #ff6b35, #ff8c5a)" }
                : undefined
            }
            title={isAuthed ? "Chat with Swift AI" : "Sign in to use Swift AI"}
          >
            <AnimatePresence mode="wait" initial={false}>
              {showMonitoringEye ? (
                <motion.span
                  key="monitor-eye"
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-1.5"
                >
                  <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/55 bg-white/12">
                    <Eye size={11} className="text-white" />
                    <motion.span
                      className="absolute h-1.5 w-1.5 rounded-full bg-white"
                      animate={{
                        x: [-1.2, 1.2, 0],
                        y: [0, 0, 1.2],
                      }}
                      transition={{
                        duration: 1.1,
                        ease: "easeInOut",
                        repeat: Infinity,
                      }}
                    />
                  </span>
                  <span className="text-[11px] font-semibold">Monitoring</span>
                </motion.span>
              ) : (
                <motion.span
                  key="ask-swift"
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-1.5"
                >
                  <Image
                    src="/swift-ai-icon.png"
                    alt=""
                    width={13}
                    height={13}
                    className="rounded-sm"
                  />
                  Ask Swift
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Auth */}
          {mounted &&
            (isAuthed ? (
              <div className="flex items-center gap-1.5">
                {/* Streak pill */}
                <div
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-brand-orange/20 bg-brand-orange/8 text-[12px] font-bold text-brand-orange"
                  title="Your Current Streak"
                >
                  <Flame
                    size={13}
                    className={
                      streak > 0
                        ? "fill-brand-orange text-brand-orange"
                        : "text-brand-orange/40"
                    }
                  />
                  {streak}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #ff6b35, #ff8c5a)",
                }}
              >
                Sign In
              </button>
            ))}
        </div>
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
