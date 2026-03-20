import { Moon, Sun, History, BookOpen, Sparkles, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";
import { HistoryPanel } from "./HistoryPanel";
import { AuthModal } from "./AuthModal";
import { useState, useEffect } from "react";

interface HeaderProps {
  onGuideOpen: () => void;
  onSwiftAIOpen?: () => void;
}

export function Header({ onGuideOpen, onSwiftAIOpen }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = theme === "dark";
  const isAuthed = status === "authenticated";

  return (
    <>
      <header className="w-full flex items-center justify-between mb-3 pb-3 border-b border-gray-100 dark:border-white/6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #ff6b35, #ff8c5a)",
              boxShadow: "0 1px 6px rgba(255,107,53,0.3)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"
                fill="white"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-[17px] font-black text-gray-900 dark:text-white tracking-tight">
            Swift<span className="text-brand-orange">Type</span>
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Ask Swift — AI Chat */}
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
                ? { background: "linear-gradient(135deg, #7c3aed, #6366f1)" }
                : undefined
            }
            title={isAuthed ? "Chat with Swift AI" : "Sign in to use Swift AI"}
          >
            <Sparkles size={13} />
            Ask Swift
          </button>

          {/* Getting Started */}
          <button
            onClick={onGuideOpen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #ff6b35, #ff8c5a)" }}
          >
            <BookOpen size={13} />
            Getting Started
          </button>

          {/* Stats */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/8 text-[12px] font-semibold text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/15 hover:text-gray-800 dark:hover:text-white transition-all"
          >
            <History size={13} />
            Stats
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

          {/* Auth: Sign In or User Avatar */}
          {mounted &&
            (isAuthed ? (
              <div className="flex items-center gap-1.5">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-7 h-7 rounded-full border border-gray-200 dark:border-white/10"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-brand-orange/20 flex items-center justify-center text-[11px] font-bold text-brand-orange">
                    {(session?.user?.name || "U")[0].toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-white/8 text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:text-red-500 hover:border-red-500/30 transition-all"
                  title="Sign out"
                >
                  <LogOut size={11} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-orange/30 text-[12px] font-semibold text-brand-orange hover:bg-brand-orange/10 transition-all"
              >
                Sign In
              </button>
            ))}
        </div>
      </header>

      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
