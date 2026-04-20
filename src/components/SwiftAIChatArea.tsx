"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Square,
  RotateCcw,
  Sparkles,
  WifiOff,
  AlertCircle,
  Pencil,
  Copy,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import clsx from "clsx";
import { useNetworkStatus } from "@/lib/useNetworkStatus";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasAutoTitled = useRef(false);
  const [input, setInput] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [messageFeedback, setMessageFeedback] = useState<
    Record<string, "up" | "down" | null>
  >({});
  const isOnline = useNetworkStatus();

  const { messages, sendMessage, status, stop, setMessages } =
    useChat({
      transport: new DefaultChatTransport({
        api: "/api/chat",
        body: { chatSessionId: chatId },
      }),
      onFinish: ({ messages: allMsgs }) => {
        // Auto-title after the first exchange using the server-side title route.
        if (!hasAutoTitled.current && allMsgs.length <= 2) {
          const firstUserMsg = allMsgs.find(
            (m: UIMessage) => m.role === "user",
          );
          if (firstUserMsg) {
            hasAutoTitled.current = true;
            const textPart = firstUserMsg.parts.find((p) => p.type === "text");
            const text = textPart ? textPart.text : "";
            fetch(`/api/chat/sessions/${chatId}/title`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ firstMessage: text }),
            })
              .then((r) => {
                if (!r.ok) throw new Error("Failed to title chat");
                return r.json();
              })
              .then((data: { title?: string }) => {
                if (data.title) {
                  onTitleUpdate(data.title);
                  return;
                }

                const fallbackTitle =
                  text.slice(0, 40) + (text.length > 40 ? "\u2026" : "");
                onTitleUpdate(fallbackTitle);
              })
              .catch(() => {
                const fallbackTitle =
                  text.slice(0, 40) + (text.length > 40 ? "\u2026" : "");
                onTitleUpdate(fallbackTitle);
              });
          }
        }
      },
    });

  // Safe regenerate: trim the last assistant message and re-send the last user
  // message. The SDK's built-in regenerate() crashes when messages were
  // hydrated from R2 storage because it can't find them in its internal state.
  function handleRegenerate() {
    const trimmed = [...messages];
    // Remove the last assistant message if present
    if (trimmed.length > 0 && trimmed[trimmed.length - 1].role === "assistant") {
      trimmed.pop();
    }
    const lastUser = [...trimmed].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setMessages(trimmed);
    const textPart = lastUser.parts?.find((p: { type: string }) => p.type === "text") as
      | { type: "text"; text: string }
      | undefined;
    const text = textPart?.text ?? "";
    if (text) sendMessage({ text });
  }

  async function persistMessages(nextMessages: UIMessage[]) {
    await fetch(`/api/chat/sessions/${chatId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: nextMessages }),
    });
  }

  // Load history when chat changes
  useEffect(() => {
    hasAutoTitled.current = false;
    setSelectedMessageId(null);
    setCopiedMessageId(null);
    setMessageFeedback({});
    fetch(`/api/chat/sessions/${chatId}`)
      .then((r) => r.json())
      .then((data) => {
        // Handle both older array returns and newer object returns
        const msgs = Array.isArray(data) ? data : data.messages || [];
        const fb = !Array.isArray(data) && data.feedback ? data.feedback : {};

        setMessageFeedback(fb);
        if (msgs.length > 0) {
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

  useEffect(() => {
    if (!copiedMessageId) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopiedMessageId(null), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copiedMessageId]);

  const userName = session?.user?.name?.split(" ")[0] || "You";
  const isActive = status === "submitted" || status === "streaming";
  const lastUserMessageIndex = [...messages]
    .map((message, index) => ({ message, index }))
    .reverse()
    .find(({ message }) => message.role === "user")?.index;
  const lastAssistantMessageIndex = [...messages]
    .map((message, index) => ({ message, index }))
    .reverse()
    .find(({ message }) => message.role === "assistant")?.index;

  async function handleEditLastUserMessage(index: number) {
    const message = messages[index];
    const nextInput = getMessageText(message);
    const trimmedMessages = messages.slice(0, index);

    setMessages(trimmedMessages);
    setInput(nextInput);
    setSelectedMessageId(null);

    try {
      await persistMessages(trimmedMessages);
    } catch {
      setMessages(messages);
      return;
    }

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }

      textarea.focus();
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
      textarea.setSelectionRange(nextInput.length, nextInput.length);
    });
  }

  async function handleCopyMessage(message: UIMessage) {
    const text = getMessageText(message);
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(message.id);
    } catch {}
  }

  return (
    <div className="h-full flex flex-col">
      {/* Offline banner */}
      {!isOnline && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20">
          <WifiOff size={13} className="text-amber-500 shrink-0" />
          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
            You&apos;re offline — messages won&apos;t send until reconnected.
          </p>
        </div>
      )}

      {/* Error banner */}
      {status === "error" && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 border-b border-red-200 dark:border-red-500/20">
          <AlertCircle size={13} className="text-red-500 shrink-0" />
          <p className="text-[11px] text-red-700 dark:text-red-400 font-medium flex-1">
            Something went wrong. The response couldn&apos;t be generated.
          </p>
          <button
            onClick={() => handleRegenerate()}
            className="text-[11px] font-semibold text-red-600 dark:text-red-400 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar">
        {messages.length === 0 ? (
          <WelcomeMessage
            name={userName}
            onSend={(text) => {
              if (isOnline) {
                sendMessage({ text });
              }
            }}
          />
        ) : (
          <div className="max-w-2xl mx-auto px-5 py-4 space-y-5">
            {messages.map((m: UIMessage, idx) => (
              <MessageBubble
                key={m.id}
                message={m}
                userName={userName}
                isLastUserMessage={idx === lastUserMessageIndex}
                isLastAssistantMessage={idx === lastAssistantMessageIndex}
                isSelected={selectedMessageId === m.id}
                isCopied={copiedMessageId === m.id}
                onSelect={() => {
                  if (idx === lastUserMessageIndex && m.role === "user") {
                    setSelectedMessageId((current) =>
                      current === m.id ? null : m.id,
                    );
                  }
                }}
                onEdit={
                  idx === lastUserMessageIndex
                    ? () => handleEditLastUserMessage(idx)
                    : undefined
                }
                onCopy={
                  idx === lastUserMessageIndex
                    ? () => handleCopyMessage(m)
                    : undefined
                }
                onRegenerate={
                  idx === lastAssistantMessageIndex && !isActive
                    ? () => handleRegenerate()
                    : undefined
                }
                feedback={messageFeedback[m.id] ?? null}
                onFeedbackChange={
                  m.role === "assistant"
                    ? (value) => {
                        setMessageFeedback((current) => {
                          const next = {
                            ...current,
                            [m.id]: current[m.id] === value ? null : value,
                          };

                          // Persist feedback seamlessly
                          fetch(`/api/chat/sessions/${chatId}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ feedback: next }),
                          }).catch(console.error);

                          return next;
                        });
                      }
                    : undefined
                }
                isStreaming={
                  isActive &&
                  idx === messages.length - 1 &&
                  m.role === "assistant"
                }
              />
            ))}
            {isActive &&
              messages[messages.length - 1]?.role !== "assistant" && (
                <TypingIndicator />
              )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-gray-100 dark:border-white/6 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() && status === "ready" && isOnline) {
                    sendMessage({ text: input });
                    setInput("");
                  }
                }
              }}
              placeholder="Ask Swift anything about typing..."
              rows={1}
              disabled={status !== "ready" || !isOnline}
              className="w-full resize-none rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/3 pl-4 pr-22 py-3 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-brand-orange/40 dark:focus:border-brand-orange/30 focus:ring-2 focus:ring-brand-orange/10 transition-all"
              style={{ maxHeight: "160px", overflowY: "hidden" }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                const capped = Math.min(t.scrollHeight, 160);
                t.style.height = capped + "px";
                t.style.overflowY = t.scrollHeight > 160 ? "auto" : "hidden";
              }}
            />

            <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
              {isActive ? (
                <button
                  type="button"
                  onClick={stop}
                  className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                  title="Stop generating"
                >
                  <Square size={15} />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (input.trim() && isOnline) {
                        sendMessage({ text: input });
                        setInput("");
                      }
                    }}
                    disabled={!input.trim() || !isOnline}
                    className={clsx(
                      "p-1.5 rounded-lg transition-all",
                      input.trim() && isOnline
                        ? "text-white hover:opacity-90"
                        : "bg-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed",
                    )}
                    style={
                      input.trim() && isOnline
                        ? {
                            background:
                              "linear-gradient(135deg, #ff6b35, #ff8c5a)",
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

function getMessageText(message: UIMessage) {
  return message.parts
    .filter(
      (part): part is Extract<typeof part, { type: "text" }> =>
        part.type === "text",
    )
    .map((part) => part.text)
    .join("");
}

// ─── MESSAGE BUBBLE ──────────────────────────────────────────────────────────

function MessageBubble({
  message,
  userName,
  isStreaming,
  isLastUserMessage,
  isLastAssistantMessage,
  isSelected,
  isCopied,
  onSelect,
  onEdit,
  onCopy,
  onRegenerate,
  feedback,
  onFeedbackChange,
}: {
  message: UIMessage;
  userName: string;
  isStreaming?: boolean;
  isLastUserMessage?: boolean;
  isLastAssistantMessage?: boolean;
  isSelected?: boolean;
  isCopied?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onCopy?: () => void;
  onRegenerate?: () => void;
  feedback?: "up" | "down" | null;
  onFeedbackChange?: (value: "up" | "down") => void;
}) {
  const isUser = message.role === "user";
  const textContent = getMessageText(message);

  return (
    <div className={clsx("flex gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={clsx(
          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold relative",
          isUser
            ? "bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400"
            : "text-white",
        )}
        style={
          !isUser
            ? { background: "linear-gradient(135deg, #ff6b35, #ff8c5a)" }
            : undefined
        }
      >
        {isUser ? userName[0].toUpperCase() : <Sparkles size={12} />}
        {isStreaming && !isUser && (
          <span
            className="absolute inset-0 rounded-lg animate-ping"
            style={{
              background: "linear-gradient(135deg, #ff6b35, #ff8c5a)",
              opacity: 0.35,
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className={clsx("flex-1 min-w-0", isUser && "text-right")}>
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mb-1">
          {isUser ? userName : "Swift AI"}
        </p>
        <div
          className={clsx(
            "inline-flex max-w-[85%] flex-col",
            isUser && "items-end",
          )}
        >
          <button
            type="button"
            onClick={isLastUserMessage ? onSelect : undefined}
            className={clsx(
              "text-left text-sm leading-relaxed rounded-2xl px-4 py-2.5 transition-all",
              isUser
                ? "bg-orange-50 dark:bg-orange-500/10 text-gray-800 dark:text-gray-200 rounded-tr-md"
                : clsx(
                    "bg-gray-50 dark:bg-white/4 text-gray-700 dark:text-gray-300 rounded-tl-md border",
                    isStreaming
                      ? "border-brand-orange/25 dark:border-brand-orange/20"
                      : "border-gray-100 dark:border-white/6",
                  ),
              isLastUserMessage &&
                "cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-500/16",
              isSelected &&
                "ring-2 ring-brand-orange/20 dark:ring-brand-orange/25",
            )}
          >
            <MessageContent
              content={textContent}
              isStreaming={isStreaming && !isUser}
            />
          </button>

          {isLastUserMessage && isSelected && (onEdit || onCopy) && (
            <div className="mt-2 flex items-center gap-2 text-[11px]">
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 font-semibold text-gray-600 transition-colors hover:border-brand-orange/30 hover:text-brand-orange dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-brand-orange/20 dark:hover:text-brand-orange"
                >
                  <Pencil size={12} />
                  Edit
                </button>
              )}
              {onCopy && (
                <button
                  type="button"
                  onClick={onCopy}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 font-semibold text-gray-600 transition-colors hover:border-brand-orange/30 hover:text-brand-orange dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-brand-orange/20 dark:hover:text-brand-orange"
                >
                  <Copy size={12} />
                  {isCopied ? "Copied" : "Copy"}
                </button>
              )}
            </div>
          )}

          {isLastAssistantMessage && onRegenerate && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {onFeedbackChange && (
                <>
                  <button
                    type="button"
                    onClick={() => onFeedbackChange("up")}
                    aria-label="Thumbs up this response"
                    title="Helpful response"
                    className={clsx(
                      "inline-flex h-8 w-8 items-center justify-center rounded-full border bg-white text-gray-500 transition-colors dark:bg-white/5 dark:text-gray-300",
                      feedback === "up"
                        ? "border-emerald-300 text-emerald-600 dark:border-emerald-400/30 dark:text-emerald-300"
                        : "border-gray-200 hover:border-emerald-300 hover:text-emerald-600 dark:border-white/10 dark:hover:border-emerald-400/30 dark:hover:text-emerald-300",
                    )}
                  >
                    <ThumbsUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onFeedbackChange("down")}
                    aria-label="Thumbs down this response"
                    title="Unhelpful response"
                    className={clsx(
                      "inline-flex h-8 w-8 items-center justify-center rounded-full border bg-white text-gray-500 transition-colors dark:bg-white/5 dark:text-gray-300",
                      feedback === "down"
                        ? "border-rose-300 text-rose-600 dark:border-rose-400/30 dark:text-rose-300"
                        : "border-gray-200 hover:border-rose-300 hover:text-rose-600 dark:border-white/10 dark:hover:border-rose-400/30 dark:hover:text-rose-300",
                    )}
                  >
                    <ThumbsDown size={13} />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={onRegenerate}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-500 transition-colors hover:border-brand-orange/30 hover:text-brand-orange dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-brand-orange/20 dark:hover:text-brand-orange"
              >
                <RotateCcw size={12} />
                Regenerate response
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MESSAGE CONTENT (react-markdown with GFM) ───────────────────────────────

function MessageContent({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Paragraphs
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 text-[13.5px] leading-relaxed">{children}</p>
          ),
          // Headings
          h1: ({ children }) => (
            <h1 className="text-[15px] font-bold mt-3 mb-1.5 text-gray-900 dark:text-white">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[14px] font-bold mt-3 mb-1 text-gray-800 dark:text-gray-100">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[13px] font-semibold mt-2 mb-1 text-gray-700 dark:text-gray-200">{children}</h3>
          ),
          // Inline code
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <pre className="mt-2 mb-2 rounded-xl bg-gray-900 dark:bg-black/40 px-4 py-3 overflow-x-auto">
                  <code className="text-[12px] font-mono text-gray-100">{children}</code>
                </pre>
              );
            }
            return (
              <code className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-[12px] font-mono text-brand-orange">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          // Lists
          ul: ({ children }) => (
            <ul className="my-1.5 space-y-0.5 pl-4 list-disc marker:text-brand-orange">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-1.5 space-y-0.5 pl-4 list-decimal marker:text-brand-orange">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-[13.5px] leading-relaxed">{children}</li>
          ),
          // Bold / Italic
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-700 dark:text-gray-300">{children}</em>
          ),
          // Tables (GFM)
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
              <table className="w-full text-[12px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50 dark:bg-white/5">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-t border-gray-100 dark:border-white/8 text-gray-600 dark:text-gray-300">{children}</td>
          ),
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-brand-orange/50 pl-3 my-2 text-gray-500 dark:text-gray-400 italic">
              {children}
            </blockquote>
          ),
          // Horizontal rule
          hr: () => <hr className="my-3 border-gray-200 dark:border-white/10" />,
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span
          className="inline-block w-0.5 h-[0.85em] bg-brand-orange align-middle ml-0.5"
          style={{ animation: "textBlink 0.9s step-end infinite" }}
        />
      )}
    </div>
  );
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
        style={{ background: "linear-gradient(135deg, #ff6b35, #ff8c5a)" }}
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
      className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/8 text-[12px] text-gray-500 dark:text-gray-400 text-left cursor-pointer hover:border-brand-orange/30 dark:hover:border-brand-orange/30 hover:text-brand-orange transition-colors"
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
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white"
        style={{ background: "linear-gradient(135deg, #ff6b35, #ff8c5a)" }}
      >
        <Sparkles size={12} />
      </div>
      <div className="bg-gray-50 dark:bg-white/4 border border-brand-orange/20 dark:border-brand-orange/15 rounded-2xl rounded-tl-md px-4 py-3">
        <div className="flex items-center gap-1">
          <span
            className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
