"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, ArrowRight, Sparkles } from "lucide-react";
import { useTypingStore } from "@/store/useTypingStore";
import { useEffect, useState } from "react";

interface DocReferralModalProps {
  onOpenDocs: () => void;
}

export function DocReferralModal({ onOpenDocs }: DocReferralModalProps) {
  const { hasSeenDocModal, setHasSeenDocModal } = useTypingStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Small delay to make it feel less abrupt
    if (!hasSeenDocModal) {
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [hasSeenDocModal]);

  const handleClose = () => {
    setIsOpen(false);
    setHasSeenDocModal(true);
  };

  const handleOpenDocs = () => {
    setIsOpen(false);
    setHasSeenDocModal(true);
    onOpenDocs();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="doc-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              key="doc-modal"
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#14161c] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative"
              style={{
                border: "1px solid var(--container-border, rgba(0,0,0,0.08))",
              }}
            >
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors z-10"
              >
                <X size={16} />
              </button>

              <div className="px-6 pt-8 pb-6 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg relative"
                  style={{
                    background: "linear-gradient(135deg, #fa4c0c, #ff8c5a)",
                  }}
                >
                  <BookOpen size={28} className="text-white" />
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full p-1 shadow-sm">
                    <Sparkles size={12} />
                  </div>
                </div>

                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                  Welcome to Swift Type!
                </h2>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 px-2">
                  We are thrilled to have you. Before you start crushing those keystrokes, take a quick look at our 
                  <span className="font-bold text-gray-700 dark:text-gray-200"> User Guide</span>. It contains everything you need to master the keyboard and dominate the Swift Rank leaderboard.
                </p>

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={handleOpenDocs}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg, #fa4c0c, #ff8c5a)",
                    }}
                  >
                    Read the User Guide <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-full py-3 rounded-xl font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                  >
                    Maybe later, let me type
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
