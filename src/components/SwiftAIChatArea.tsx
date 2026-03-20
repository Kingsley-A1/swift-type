"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useSession } from "next-auth/react";
import { Send, Square, RotateCcw, Sparkles } from "lucide-react";
import clsx from "clsx";

interface SwiftAIChatAreaProps {
  chatId: string;
  onTitleUpdate: (title: string) => void;
}

export function SwiftAIChatArea({
  chatId,
  onTitleUpdate,
}: SwiftAIChatAreaProps) {
  const { data: session } = useSession();
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasAutoTitled = useRef(false);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, stop, regenerate, setMessages } =
    useChat({
      transport: new DefaultChatTransport({
        api: "/api/chat",
        body: { chatSessionId: chatId },
      }),
      onFinish: ({ messages: allMsgs }) => {
        // Auto-title from first user message
        if (!hasAutoTitled.current && allMsgs.length <= 2) {
          const firstUserMsg = allMsgs.find(
            (m: UIMessage) => m.role === "user",
          );
          if (firstUserMsg) {
            hasAutoTitled.current = true;
            const textPart = firstUserMsg.parts.find((p) => p.type === "text");
            const text = textPart ? textPart.text : "";
            const title = text.slice(0, 40) + (text.length > 40 ? "…" : "");
            onTitleUpdate(title);
          }
        }
      },
    });

  // Load history when chat changes
  useEffect(() => {
    hasAutoTitled.current = false;
    fetch(`/api/chat/sessions/${chatId}`)
      .then((r) => r.json())
      .then((msgs) => {
        if (Array.isArray(msgs) && msgs.length > 0) {
          setMessages(msgs);
          hasAutoTitled.current = true;
        } else {
          setMessages([]);
        }
      })
      .catch(() => setMessages([]));
  }, [chatId, setMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const userName = session?.user?.name?.split(" ")[0] || "You";
  const isActive = status === "submitted" || status === "streaming";

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar">
        {messages.length === 0 ? (
          <WelcomeMessage
            name={userName}
            onSend={(text) => {
              sendMessage({ text });
            }}
          />
        ) : (
          <div className="max-w-2xl mx-auto px-5 py-4 space-y-5">
            {messages.map((m: UIMessage) => (
              <MessageBubble key={m.id} message={m} userName={userName} />
            ))}
            {isActive &&
              messages[messages.length - 1]?.role !== "assistant" && (
                <TypingIndicator />
              )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-100 dark:border-white/6 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && status === "ready") {
                      sendMessage({ text: input });
                      setInput("");
                    }
                  }
                }}
                placeholder="Ask Swift anything about typing..."
                rows={1}
                disabled={status !== "ready"}
                className="w-full resize-none rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-purple-400 dark:focus:border-purple-500/40 focus:ring-2 focus:ring-purple-400/20 transition-all"
                style={{ maxHeight: "120px" }}
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 120) + "px";
                }}
              />
            </div>

            <div className="flex items-center gap-1.5">
              {isActive ? (
                <button
                  type="button"
                  onClick={stop}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                  title="Stop generating"
                >
                  <Square size={15} />
                </button>
              ) : (
                <>
                  {messages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => regenerate()}
                      className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                      title="Regenerate"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (input.trim()) {
                        sendMessage({ text: input });
                        setInput("");
                      }
                    }}
                    disabled={!input.trim()}
                    className={clsx(
                      "p-2 rounded-lg transition-all",
                      input.trim()
                        ? "text-white hover:opacity-90"
                        : "bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-gray-600 cursor-not-allowed",
                    )}
                    style={
                      input.trim()
                        ? {
                            background:
                              "linear-gradient(135deg, #7c3aed, #6366f1)",
                          }
                        : undefined
                    }
                  >
                    <Send size={15} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MESSAGE BUBBLE ──────────────────────────────────────────────────────────

function MessageBubble({
  message,
  userName,
}: {
  message: UIMessage;
  userName: string;
}) {
  const isUser = message.role === "user";
  const textContent = message.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");

  return (
    <div className={clsx("flex gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={clsx(
          "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-bold",
          isUser
            ? "bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400"
            : "text-white",
        )}
        style={
          !isUser
            ? { background: "linear-gradient(135deg, #7c3aed, #6366f1)" }
            : undefined
        }
      >
        {isUser ? userName[0].toUpperCase() : <Sparkles size={12} />}
      </div>

      {/* Content */}
      <div className={clsx("flex-1 min-w-0", isUser && "text-right")}>
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mb-1">
          {isUser ? userName : "Swift AI"}
        </p>
        <div
          className={clsx(
            "inline-block text-sm leading-relaxed rounded-2xl px-4 py-2.5 max-w-[85%]",
            isUser
              ? "bg-purple-50 dark:bg-purple-500/10 text-gray-800 dark:text-gray-200 rounded-tr-md"
              : "bg-gray-50 dark:bg-white/[0.04] text-gray-700 dark:text-gray-300 rounded-tl-md border border-gray-100 dark:border-white/6",
          )}
        >
          <MessageContent content={textContent} />
        </div>
      </div>
    </div>
  );
}

// ─── MESSAGE CONTENT (simple markdown-like rendering) ────────────────────────

function MessageContent({ content }: { content: string }) {
  // Split on double newlines for paragraphs, render bold/code inline
  const paragraphs = content.split(/\n\n+/);

  return (
    <div className="space-y-2">
      {paragraphs.map((p, i) => {
        const lines = p.split("\n");
        return (
          <div key={i}>
            {lines.map((line, j) => (
              <p key={j} className={j > 0 ? "mt-1" : ""}>
                {renderInline(line)}
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function renderInline(text: string) {
  // Bold: **text**, Code: `text`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-[12px] font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// ─── WELCOME ─────────────────────────────────────────────────────────────────

function WelcomeMessage({
  name,
  onSend,
}: {
  name: string;
  onSend: (text: string) => void;
}) {
  const suggestions = [
    "Why am I stuck at my current WPM?",
    "Which keys should I practice more?",
    "How do I improve my accuracy?",
    "What's the best way to build speed?",
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
        style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
      >
        <Sparkles size={18} className="text-white" />
      </div>
      <h3 className="text-base font-bold text-gray-900 dark:text-white">
        Hey {name}!
      </h3>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-sm">
        I'm Swift AI, your personal typing coach. I can see your practice data
        and give you tailored advice.
      </p>

      <div className="grid grid-cols-2 gap-2 mt-6 w-full max-w-md">
        {suggestions.map((s) => (
          <SuggestionChip key={s} text={s} onSend={onSend} />
        ))}
      </div>
    </div>
  );
}

function SuggestionChip({
  text,
  onSend,
}: {
  text: string;
  onSend: (text: string) => void;
}) {
  return (
    <button
      onClick={() => onSend(text)}
      className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/8 text-[12px] text-gray-500 dark:text-gray-400 text-left cursor-pointer hover:border-purple-300 dark:hover:border-purple-500/30 transition-colors"
    >
      {text}
    </button>
  );
}

// ─── TYPING INDICATOR ────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
        style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
      >
        <Sparkles size={12} />
      </div>
      <div className="bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/6 rounded-2xl rounded-tl-md px-4 py-3">
        <div className="flex items-center gap-1">
          <span
            className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
