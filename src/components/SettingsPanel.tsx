"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, Ghost, User, Bell } from "lucide-react";
import { useTypingStore } from "@/store/useTypingStore";
import { useSession } from "next-auth/react";
import { useState, useCallback } from "react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { isAnonymous, setAnonymous } = useTypingStore();
  const { data: session } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleAnonymous = useCallback(async () => {
    const newValue = !isAnonymous;
    setAnonymous(newValue);

    if (session?.user?.id) {
      setIsUpdating(true);
      try {
        await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isAnonymous: newValue }),
        });
      } catch (e) {
        console.error("Failed to sync settings", e);
      } finally {
        setIsUpdating(false);
      }
    }
  }, [isAnonymous, setAnonymous, session?.user?.id]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] dark:bg-black/40"
          />

          {/* Panel */}
          <motion.div
            key="settings-panel"
            initial={{ x: "100%", opacity: 0.7 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.7 }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl dark:bg-[#14161c]"
            style={{
              borderLeft: "1px solid var(--container-border, rgba(0,0,0,0.08))",
            }}
          >
            {/* ── Header ── */}
            <div className="flex-shrink-0 px-6 pt-6 pb-5 border-b border-gray-100 dark:border-white/8">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
                    style={{
                      background: "linear-gradient(135deg, #fa4c0c, #ff8c5a)",
                    }}
                  >
                    <Settings size={16} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-black text-gray-900 dark:text-white leading-none">
                      Settings
                    </h2>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Customize your experience
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
                  aria-label="Close settings panel"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              
              {/* Privacy Section */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-0.5">
                  Privacy
                </p>

                <div className="p-4 rounded-xl border border-gray-100 dark:border-white/6 bg-gray-50 dark:bg-white/3 flex items-start gap-4 transition-all">
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-gray-200 dark:bg-white/10 flex items-center justify-center shrink-0">
                    {isAnonymous ? <Ghost size={14} className="text-gray-600 dark:text-gray-300" /> : <User size={14} className="text-brand-orange" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-bold text-gray-900 dark:text-white">
                        Anonymous Mode
                      </p>
                      <button
                        onClick={toggleAnonymous}
                        disabled={isUpdating}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50 ${
                          isAnonymous ? "bg-brand-orange" : "bg-gray-300 dark:bg-white/20"
                        } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
                        role="switch"
                        aria-checked={isAnonymous}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                            isAnonymous ? "translate-x-4.5" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                      Hide your profile picture and name on the global Swift Rank leaderboard. Your identity will be kept private.
                    </p>
                  </div>
                </div>
              </div>

              {/* Preferences Section (Placeholders for "other settings") */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-0.5">
                  Preferences
                </p>

                <div className="p-4 rounded-xl border border-gray-100 dark:border-white/6 bg-gray-50 dark:bg-white/3 flex items-start gap-4 opacity-60">
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-gray-200 dark:bg-white/10 flex items-center justify-center shrink-0">
                    <Bell size={14} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-bold text-gray-900 dark:text-white">
                        Daily Reminders
                      </p>
                      <button
                        disabled
                        className="relative inline-flex h-5 w-9 shrink-0 cursor-not-allowed items-center rounded-full transition-colors duration-200 ease-in-out bg-brand-orange"
                      >
                        <span className="pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out translate-x-4.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                      Receive notifications to hit your daily typing goals. (Coming soon)
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
