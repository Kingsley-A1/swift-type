import { Moon, Sun, Sparkles, Flame } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { AuthModal } from "./AuthModal";
import { useState, useEffect } from "react";
import { useTypingStore } from "@/store/useTypingStore";

interface HeaderProps {
  onHistoryOpen: () => void;
  onSwiftAIOpen?: () => void;
}

export function Header({ onHistoryOpen, onSwiftAIOpen }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();
  const { goalStreak } = useTypingStore();
  const [mounted, setMounted] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = theme === "dark";
  const isAuthed = status === "authenticated";
  const streak = goalStreak.currentStreak;

  return (
    <>
      <header className="w-full flex items-center justify-between mb-3 pb-3 border-b border-gray-100 dark:border-white/6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
          >
            <Image src="/logo-192.png" alt="SwiftType" width={28} height={28} />
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
            <Sparkles size={13} />
            Ask Swift
          </button>

          {/* Theme */}
          {mounted && (
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/8 text-[12px] font-semibold text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/15 hover:text-gray-800 dark:hover:text-white transition-all"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={13} /> : <Moon size={13} />}
              {isDark ? "Light" : "Dark"}
            </button>
          )}

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
