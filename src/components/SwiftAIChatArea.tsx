"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import Image from "next/image";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Square,
  RotateCcw,
  WifiOff,
  AlertCircle,
  Pencil,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Target,
  ExternalLink,
  Play,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";
import { useNetworkStatus } from "@/lib/useNetworkStatus";
import { applyGoalMutationResult } from "@/lib/syncService";
import {
  resolveSwiftAIToolParts,
  type SwiftAISessionConfig,
  type SwiftAIToolTarget,
} from "@/lib/swift-ai-tool-parts";

interface SwiftAIChatAreaProps {
  chatId: string;
  onTitleUpdate: (title: string) => void;
  onNavigate?: (target: SwiftAIToolTarget) => void;
  onStartSession?: (config: SwiftAISessionConfig) => void;
}

export function SwiftAIChatArea({
  chatId,
  onTitleUpdate,
  onNavigate,
  onStartSession,
}: SwiftAIChatAreaProps) {
  const { data: session } = useSession();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasAutoTitled = useRef(false);
  const appliedToolResultIdsRef = useRef<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const [historyStatus, setHistoryStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [messageFeedback, setMessageFeedback] = useState<
    Record<string, "up" | "down" | null>
  >({});
  const isOnline = useNetworkStatus();

  const { messages, sendMessage, addToolOutput, status, stop, setMessages } =
    useChat({
      transport: new DefaultChatTransport({
        api: "/api/chat",
        body: { chatSessionId: chatId },
      }),

      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,

      async onToolCall({ toolCall }) {
        if (toolCall.dynamic) return;

        // navigateTo and startSession are client-side tools (no execute on server)
        if (toolCall.toolName === "navigateTo") {
          const input = toolCall.input as { target: string; label: string };
          addToolOutput({
            tool: "navigateTo",
            toolCallId: toolCall.toolCallId,
            output: JSON.stringify({ opened: input.target }),
          });
        }

        if (toolCall.toolName === "startSession") {
          const input = toolCall.input as {
            mode: string;
            level: string;
            duration?: number;
            wordCount?: number;
          };
          addToolOutput({
            tool: "startSession",
            toolCallId: toolCall.toolCallId,
            output: JSON.stringify({ started: true, ...input }),
          });
        }
      },

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

  // Safe regenerate: remove last assistant message and re-send last user msg.
  // Guarded to prevent duplicate sends on rapid clicks.
  const regeneratingRef = useRef(false);
  function handleRegenerate() {
    if (regeneratingRef.current || isActive) return;
    regeneratingRef.current = true;

    const trimmed = [...messages];
    // Remove the last completed exchange before re-sending the prompt.
    if (
      trimmed.length > 0 &&
      trimmed[trimmed.length - 1].role === "assistant"
    ) {
      trimmed.pop();
    }
    const lastUser =
      trimmed.length > 0 && trimmed[trimmed.length - 1].role === "user"
        ? trimmed.pop()
        : [...trimmed].reverse().find((m) => m.role === "user");
    if (!lastUser) {
      regeneratingRef.current = false;
      return;
    }

    setMessages(trimmed);
    const textPart = lastUser.parts?.find(
      (p: { type: string }) => p.type === "text",
    ) as { type: "text"; text: string } | undefined;
    const text = textPart?.text ?? "";
    if (text) {
      sendMessage({ text });
    }

    // Reset the guard once streaming starts (small delay)
    setTimeout(() => {
      regeneratingRef.current = false;
    }, 1000);
  }

  async function persistMessages(nextMessages: UIMessage[]) {
    await fetch(`/api/chat/sessions/${chatId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: nextMessages }),
    });
  }

  const loadChatHistory = useCallback(
    async (signal?: AbortSignal) => {
      hasAutoTitled.current = false;
      setSelectedMessageId(null);
      setCopiedMessageId(null);
      setMessageFeedback({});
      appliedToolResultIdsRef.current = new Set();
      setHistoryStatus("loading");
      setHistoryError(null);
      setMessages([]);

      try {
        const response = await fetch(`/api/chat/sessions/${chatId}`, {
          signal,
        });
        if (!response.ok) {
          throw new Error("Failed to load conversation");
        }

        const data = await response.json();
        const nextMessages = Array.isArray(data) ? data : data.messages || [];
        const nextFeedback =
          !Array.isArray(data) && data.feedback ? data.feedback : {};

        setMessageFeedback(nextFeedback);
        setMessages(nextMessages);
        appliedToolResultIdsRef.current = collectResolvedToolIds(nextMessages);
        if (nextMessages.length > 0) {
          hasAutoTitled.current = true;
        }
        setHistoryStatus("ready");
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setMessages([]);
        setMessageFeedback({});
        appliedToolResultIdsRef.current = new Set();
        setHistoryStatus("error");
        setHistoryError("Couldn\'t load this conversation. Try again.");
      }
    },
    [chatId, setMessages],
  );

  // Load history when chat changes
  useEffect(() => {
    const controller = new AbortController();
    void loadChatHistory(controller.signal);
    return () => controller.abort();
  }, [chatId, loadChatHistory]);

  // Scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (historyStatus !== "ready") {
      return;
    }

    for (const message of messages) {
      const toolParts = resolveSwiftAIToolParts(message.parts);
      for (const part of toolParts) {
        if (part.kind !== "create-goal") {
          continue;
        }

        if (appliedToolResultIdsRef.current.has(part.id)) {
          continue;
        }

        appliedToolResultIdsRef.current.add(part.id);
        applyGoalMutationResult(part.goalSnapshot, part.rewardEvents);
      }
    }
  }, [historyStatus, messages]);

  useEffect(() => {
    if (!copiedMessageId) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopiedMessageId(null), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copiedMessageId]);

  const userName = session?.user?.name?.split(" ")[0] || "You";
  const isActive = status === "submitted" || status === "streaming";

  const resizeComposer = useCallback(() => {
    const element = inputRef.current;
    if (!element) {
      return;
    }

    element.style.height = "0px";
    const nextHeight = Math.min(Math.max(element.scrollHeight, 80), 200);
    element.style.height = `${nextHeight}px`;
  }, []);

  useEffect(() => {
    resizeComposer();
  }, [input, resizeComposer]);

  function submitMessage() {
    const trimmed = input.trim();
    if (!trimmed || status !== "ready" || !isOnline) {
      return;
    }

    sendMessage({ text: trimmed });
    setInput("");
  }

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
      const inputElement = inputRef.current;
      if (!inputElement) {
        return;
      }

      inputElement.focus();
      inputElement.setSelectionRange(nextInput.length, nextInput.length);
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
        {historyStatus === "loading" ? (
          <MessagePaneSkeleton />
        ) : historyStatus === "error" ? (
          <MessagePaneError
            message={historyError || "Couldn\'t load this conversation."}
            onRetry={() => void loadChatHistory()}
          />
        ) : messages.length === 0 ? (
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
                  idx === lastUserMessageIndex ||
                  idx === lastAssistantMessageIndex
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
                onNavigate={onNavigate}
                onStartSession={onStartSession}
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
      <div className="shrink-0 border-t border-gray-100 dark:border-white/6 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end gap-2.5">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onInput={resizeComposer}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitMessage();
                }
              }}
              rows={3}
              placeholder="Ask Swift anything..."
              disabled={status !== "ready" || !isOnline}
              aria-label="Message Swift AI"
              className="flex-1 min-h-20 max-h-50 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/3 px-4 py-2.5 text-sm leading-relaxed text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-brand-orange/40 dark:focus:border-brand-orange/30 focus:ring-2 focus:ring-brand-orange/10 transition-all disabled:opacity-50 resize-none overflow-y-auto"
            />

            {isActive ? (
              <button
                type="button"
                onClick={stop}
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                title="Stop generating"
                aria-label="Stop generating"
              >
                <Square size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={submitMessage}
                disabled={!input.trim() || !isOnline}
                title="Send message"
                aria-label="Send message"
                className={clsx(
                  "shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  input.trim() && isOnline
                    ? "text-white hover:opacity-90 active:scale-95"
                    : "bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-gray-600 cursor-not-allowed",
                )}
                style={
                  input.trim() && isOnline
                    ? {
                        background: "linear-gradient(135deg, #ff6b35, #ff8c5a)",
                      }
                    : undefined
                }
              >
                <Send size={14} />
              </button>
            )}
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

function collectResolvedToolIds(messages: UIMessage[]) {
  const ids = new Set<string>();

  for (const message of messages) {
    const toolParts = resolveSwiftAIToolParts(message.parts);
    for (const part of toolParts) {
      ids.add(part.id);
    }
  }

  return ids;
}

function normalizeMarkdownHref(href?: string) {
  const trimmed = href?.trim();

  if (!trimmed) {
    return null;
  }

  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function getExternalHostnameLabel(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./i, "");
  } catch {
    return null;
  }
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
  onNavigate,
  onStartSession,
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
  onNavigate?: (target: SwiftAIToolTarget) => void;
  onStartSession?: (config: SwiftAISessionConfig) => void;
}) {
  const isUser = message.role === "user";
  const textContent = getMessageText(message);
  const toolParts = resolveSwiftAIToolParts(message.parts);

  return (
    <div className={clsx("flex gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={clsx(
          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold relative overflow-hidden",
          isUser
            ? "bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400"
            : "",
        )}
        style={
          !isUser
            ? { background: "linear-gradient(135deg, #ff6b35, #ff8c5a)" }
            : undefined
        }
      >
        {isUser ? userName[0].toUpperCase() : (
          <Image src="/swift-ai-icon.png" alt="Swift AI" width={28} height={28} className="rounded-lg" />
        )}
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
          {isUser ? (
            <button
              type="button"
              onClick={isLastUserMessage ? onSelect : undefined}
              className={clsx(
                "text-left text-sm leading-relaxed rounded-2xl px-4 py-2.5 transition-all",
                "bg-orange-50 dark:bg-orange-500/10 text-gray-800 dark:text-gray-200 rounded-tr-md",
                isLastUserMessage &&
                  "cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-500/16",
                isSelected &&
                  "ring-2 ring-brand-orange/20 dark:ring-brand-orange/25",
              )}
            >
              <MessageContent content={textContent} />
            </button>
          ) : (
            <div
              className={clsx(
                "text-left text-sm leading-relaxed rounded-2xl px-4 py-2.5 select-text",
                "bg-gray-50 dark:bg-white/4 text-gray-700 dark:text-gray-300 rounded-tl-md border",
                isStreaming
                  ? "border-brand-orange/25 dark:border-brand-orange/20"
                  : "border-gray-100 dark:border-white/6",
              )}
            >
              <MessageContent content={textContent} isStreaming={isStreaming} />
            </div>
          )}

          {/* Tool results rendered inline below the text bubble */}
          {!isUser && toolParts.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {toolParts.map((part) => {
                if (part.kind === "create-goal") {
                  return (
                    <button
                      key={part.id}
                      onClick={() => onNavigate?.(part.target)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 dark:border-emerald-400/20 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                    >
                      <Target size={12} />
                      {part.label}
                    </button>
                  );
                }

                if (part.kind === "navigate") {
                  return (
                    <button
                      key={part.id}
                      onClick={() => onNavigate?.(part.target)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-orange/20 bg-orange-50 dark:bg-orange-500/10 px-3 py-1.5 text-[11px] font-semibold text-brand-orange hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"
                    >
                      <ExternalLink size={12} />
                      {part.label}
                    </button>
                  );
                }

                if (part.kind === "start-session") {
                  return (
                    <button
                      key={part.id}
                      onClick={() => onStartSession?.(part.config)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-orange/20 bg-orange-50 dark:bg-orange-500/10 px-3 py-1.5 text-[11px] font-semibold text-brand-orange hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"
                    >
                      <Play size={12} fill="currentColor" />
                      {part.label}
                    </button>
                  );
                }

                if (part.kind === "pending") {
                  return (
                    <span
                      key={part.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/4 px-3 py-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-500"
                    >
                      <Sparkles size={11} className="animate-spin" />
                      {part.label}
                    </span>
                  );
                }

                return (
                  <span
                    key={part.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-400/20 bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 text-[11px] font-medium text-rose-600 dark:text-rose-300"
                  >
                    <AlertCircle size={11} />
                    {part.label}
                  </span>
                );
              })}
            </div>
          )}

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
              {onCopy && (
                <button
                  type="button"
                  onClick={onCopy}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-500 transition-colors hover:border-brand-orange/30 hover:text-brand-orange dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-brand-orange/20 dark:hover:text-brand-orange"
                >
                  <Copy size={12} />
                  {isCopied ? "Copied" : "Copy"}
                </button>
              )}
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
    <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed select-text">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Paragraphs
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 text-[13.5px] leading-relaxed">
              {children}
            </p>
          ),
          // Headings
          h1: ({ children }) => (
            <h1 className="text-[15px] font-bold mt-3 mb-1.5 text-gray-900 dark:text-white">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[14px] font-bold mt-3 mb-1 text-gray-800 dark:text-gray-100">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[13px] font-semibold mt-2 mb-1 text-gray-700 dark:text-gray-200">
              {children}
            </h3>
          ),
          // Inline code
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <pre className="mt-2 mb-2 rounded-xl bg-gray-900 dark:bg-black/40 px-4 py-3 overflow-x-auto">
                  <code className="text-[12px] font-mono text-gray-100">
                    {children}
                  </code>
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
            <ul className="my-1.5 space-y-0.5 pl-4 list-disc marker:text-brand-orange">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-1.5 space-y-0.5 pl-4 list-decimal marker:text-brand-orange">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-[13.5px] leading-relaxed">{children}</li>
          ),
          // Bold / Italic
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900 dark:text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-700 dark:text-gray-300">
              {children}
            </em>
          ),
          a: ({ children, href }) => {
            const safeHref = normalizeMarkdownHref(href);

            if (!safeHref) {
              return (
                <span className="text-gray-500 dark:text-gray-400">
                  {children}
                </span>
              );
            }

            const isExternal = /^https?:\/\//i.test(safeHref);
            const hostnameLabel = isExternal
              ? getExternalHostnameLabel(safeHref)
              : null;

            return (
              <a
                href={safeHref}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className={clsx(
                  "transition-colors",
                  isExternal
                    ? "my-0.5 inline-flex max-w-full items-center gap-1.5 rounded-full border border-brand-orange/20 bg-brand-orange/[0.08] px-2.5 py-1 text-[12px] font-medium text-brand-orange no-underline hover:border-brand-orange/35 hover:bg-brand-orange/[0.12]"
                    : "inline-flex items-center gap-1 text-brand-orange underline decoration-brand-orange/40 underline-offset-3 hover:decoration-brand-orange",
                )}
                title={isExternal ? "Opens in a new tab" : undefined}
              >
                <span className={clsx(isExternal && "truncate")}>
                  {children}
                </span>
                {hostnameLabel ? (
                  <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500 dark:bg-black/20 dark:text-gray-300">
                    {hostnameLabel}
                  </span>
                ) : null}
                {isExternal && <ExternalLink size={12} aria-hidden="true" />}
              </a>
            );
          },
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
            <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-t border-gray-100 dark:border-white/8 text-gray-600 dark:text-gray-300">
              {children}
            </td>
          ),
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-brand-orange/50 pl-3 my-2 text-gray-500 dark:text-gray-400 italic">
              {children}
            </blockquote>
          ),
          // Horizontal rule
          hr: () => (
            <hr className="my-3 border-gray-200 dark:border-white/10" />
          ),
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
      <Image
        src="/swift-ai-icon.png"
        alt="Swift AI"
        width={40}
        height={40}
        className="rounded-2xl mb-3"
      />
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
  const loadingPhrases = [
    "Thinking through your stats...",
    "Reviewing your weak spots...",
    "Lining up the next best drill...",
    "Writing a sharper answer...",
  ];
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setPhraseIndex((current) => (current + 1) % loadingPhrases.length);
    }, 1500);

    return () => window.clearInterval(intervalId);
  }, [loadingPhrases.length]);

  return (
    <div className="flex gap-3">
      <Image
        src="/swift-ai-icon.png"
        alt="Swift AI"
        width={28}
        height={28}
        className="rounded-lg shrink-0"
      />
      <div className="bg-gray-50 dark:bg-white/4 border border-brand-orange/20 dark:border-brand-orange/15 rounded-2xl rounded-tl-md px-4 py-3">
        <div className="flex items-center gap-2 text-[12px] font-medium text-gray-500 dark:text-gray-400">
          <span className="inline-block h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
          <span>{loadingPhrases[phraseIndex]}</span>
        </div>
      </div>
    </div>
  );
}

function MessagePaneSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-4 space-y-5">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex gap-3">
          <div className="h-7 w-7 shrink-0 rounded-lg bg-gray-200 dark:bg-white/8 animate-pulse" />
          <div className="min-w-0 flex-1 space-y-2 pt-0.5">
            <div className="h-2.5 w-16 rounded bg-gray-200 dark:bg-white/8 animate-pulse" />
            <div className="rounded-2xl rounded-tl-md border border-gray-100 dark:border-white/6 bg-gray-50 dark:bg-white/4 p-4">
              <div className="h-3 w-4/5 rounded bg-gray-200 dark:bg-white/8 animate-pulse" />
              <div className="mt-2 h-3 w-3/5 rounded bg-gray-200 dark:bg-white/8 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MessagePaneError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 text-center">
      <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-3">
        <AlertCircle size={18} className="text-rose-500" />
      </div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
        Conversation unavailable
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-xs">
        {message}
      </p>
      <button
        onClick={onRetry}
        className="mt-4 rounded-lg border border-gray-200 dark:border-white/8 px-3 py-1.5 text-[11px] font-semibold text-gray-600 dark:text-gray-300 hover:border-brand-orange/30 hover:text-brand-orange transition-colors"
      >
        Retry loading chat
      </button>
    </div>
  );
}
