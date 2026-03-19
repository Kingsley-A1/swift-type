"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

interface HintModalProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export function HintModal({ isOpen, onClose, anchorRef }: HintModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [isOpen, onClose, anchorRef]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.97 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute right-0 top-full mt-1.5 z-50 w-44 rounded-xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.97)",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          }}
        >
          <div className="px-3 pt-2.5 pb-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Keyboard Shortcuts
            </p>
          </div>
          <div className="pb-2 px-2 space-y-0.5">
            {[
              { key: "Tab", action: "restart" },
              { key: "Esc", action: "stop" },
              { key: "Enter", action: "start" },
            ].map(({ key, action }) => (
              <div
                key={key}
                className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <kbd className="text-[11px] font-mono font-semibold text-gray-700 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-md leading-none">
                  {key}
                </kbd>
                <span className="text-[11px] text-gray-500 font-medium">{action}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
