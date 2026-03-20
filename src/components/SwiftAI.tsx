"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { SwiftAISidebar } from "./SwiftAISidebar";
import { SwiftAIChatArea } from "./SwiftAIChatArea";

interface ChatSession {
  id: string;
  title: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SwiftAIProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SwiftAI({ isOpen, onClose }: SwiftAIProps) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch sessions on open
  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    fetch("/api/chat/sessions")
      .then((r) => r.json())
      .then((data) => setChatSessions(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setActiveChatId(null);
    }
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleNewChat = useCallback(async () => {
    const res = await fetch("/api/chat/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Chat" }),
    });
    const chat = await res.json();
    setChatSessions((prev) => [
      {
        ...chat,
        isPinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setActiveChatId(chat.id);
  }, []);

  const handleDeleteChat = useCallback(
    async (id: string) => {
      await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
      setChatSessions((prev) => prev.filter((c) => c.id !== id));
      if (activeChatId === id) setActiveChatId(null);
    },
    [activeChatId],
  );

  const handleRenameChat = useCallback(async (id: string, title: string) => {
    await fetch(`/api/chat/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setChatSessions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c)),
    );
  }, []);

  const handlePinChat = useCallback(async (id: string, isPinned: boolean) => {
    await fetch(`/api/chat/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned }),
    });
    setChatSessions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned } : c)),
    );
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="swift-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-[2px]"
          />

          {/* Panel */}
          <motion.div
            key="swift-panel"
            initial={{ x: "100%", opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.6 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed inset-y-0 right-0 z-50 w-[75%] max-w-4xl flex flex-col bg-white dark:bg-[#14161c]"
            style={{
              borderLeft: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "-20px 0 60px rgba(0,0,0,0.12)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-white/6">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #6366f1)",
                  }}
                >
                  <Sparkles size={13} className="text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-none">
                    Swift <span className="text-purple-500">AI</span>
                  </h1>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    Your typing coach
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <X size={15} className="text-gray-400" />
              </button>
            </div>

            {/* Body: sidebar + chat */}
            <div className="flex-1 flex min-h-0">
              <SwiftAISidebar
                sessions={chatSessions}
                activeChatId={activeChatId}
                isLoading={isLoading}
                onSelect={setActiveChatId}
                onNewChat={handleNewChat}
                onDelete={handleDeleteChat}
                onRename={handleRenameChat}
                onPin={handlePinChat}
              />

              <div className="flex-1 min-w-0">
                {activeChatId ? (
                  <SwiftAIChatArea
                    chatId={activeChatId}
                    onTitleUpdate={(title) =>
                      handleRenameChat(activeChatId, title)
                    }
                  />
                ) : (
                  <EmptyState onNewChat={handleNewChat} />
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────

function EmptyState({ onNewChat }: { onNewChat: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
      >
        <Sparkles size={20} className="text-white" />
      </div>
      <h2 className="text-base font-bold text-gray-900 dark:text-white">
        Ask Swift anything
      </h2>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1.5 max-w-xs">
        Get personalized coaching, analyze your typing patterns, or ask for
        practice tips.
      </p>
      <button
        onClick={onNewChat}
        className="mt-5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
        style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
      >
        Start a conversation
      </button>
    </div>
  );
}
