"use client";

import { useTypingStore } from "@/store/useTypingStore";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, LineChart, Keyboard, User } from "lucide-react";

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAskGenius: () => void;
  onViewStats: () => void;
  onPractice: () => void;
}

export function ProfilePanel({
  isOpen,
  onClose,
  onAskGenius,
  onViewStats,
  onPractice,
}: ProfilePanelProps) {
  const { data: session } = useSession();
  const { savedSessions } = useTypingStore();

  const bestWpm =
    savedSessions.length > 0 ? Math.max(...savedSessions.map((s) => s.wpm)) : 0;
  const avgWpm =
    savedSessions.length > 0
      ? Math.round(
          savedSessions.reduce((acc, s) => acc + s.wpm, 0) /
            savedSessions.length,
        )
      : 0;
  const avgAcc =
    savedSessions.length > 0
      ? Math.round(
          savedSessions.reduce((acc, s) => acc + s.accuracy, 0) /
            savedSessions.length,
        )
      : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity"
          />
          <motion.div
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.5 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col bg-white dark:bg-brand-dark sm:max-w-sm shadow-2xl border-l border-gray-200 dark:border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-black/20">
              <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
                <User className="text-brand-orange w-5 h-5" />
                My Profile
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 focus:outline-none transition-colors"
                aria-label="Close panel"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
              <div className="p-6 space-y-6">
                {/* Avatar + Identity */}
                <div className="flex flex-col items-center text-center pt-2">
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="w-20 h-20 rounded-full border-2 border-brand-orange/30 shadow-lg mb-4"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-white mb-4"
                      style={{
                        background: "linear-gradient(135deg, #ff6b35, #ff8c5a)",
                        boxShadow: "0 4px 20px rgba(255,107,53,0.3)",
                      }}
                    >
                      {(session?.user?.name || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                    {session?.user?.name || "Swift Typist"}
                  </h2>
                  {session?.user?.email && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      {session.user.email}
                    </p>
                  )}
                  <span className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                    Swift Member
                  </span>
                </div>

                {/* Stats Grid */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                    Performance
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center p-3 rounded-xl bg-linear-to-br from-brand-orange/10 to-brand-orange/5 border border-brand-orange/20">
                      <span className="text-2xl font-extrabold text-brand-orange leading-none">
                        {bestWpm}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mt-1">
                        Best WPM
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-xl bg-linear-to-br from-brand-orange/8 to-brand-orange/3 border border-brand-orange/15">
                      <span className="text-2xl font-extrabold text-gray-700 dark:text-gray-200 leading-none">
                        {avgWpm}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mt-1">
                        Avg WPM
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-xl bg-linear-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
                      <span className="text-2xl font-extrabold text-emerald-500 leading-none">
                        {avgAcc}%
                      </span>
                      <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mt-1">
                        Accuracy
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-center text-gray-400 dark:text-gray-500 mt-2">
                    {savedSessions.length} session
                    {savedSessions.length !== 1 ? "s" : ""} completed
                  </p>
                </div>

                {/* CTAs */}
                <div className="space-y-2.5">
                  <button
                    onClick={onAskGenius}
                    className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg, #ff6b35, #ff8c5a)",
                      boxShadow: "0 4px 16px rgba(255,107,53,0.25)",
                    }}
                  >
                    <Sparkles size={15} />
                    Ask Genius
                  </button>
                  <button
                    onClick={onViewStats}
                    className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-bold border border-gray-200 dark:border-white/10 bg-white dark:bg-white/3 text-gray-700 dark:text-gray-200 hover:border-brand-orange/40 hover:text-brand-orange dark:hover:text-brand-orange transition-all"
                  >
                    <LineChart size={15} />
                    View Stats
                  </button>
                  <button
                    onClick={onPractice}
                    className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-bold border border-gray-200 dark:border-white/10 bg-white dark:bg-white/3 text-gray-700 dark:text-gray-200 hover:border-brand-orange/40 hover:text-brand-orange dark:hover:text-brand-orange transition-all"
                  >
                    <Keyboard size={15} />
                    Practice
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
