"use client";

import { useState } from "react";
import {
  Plus,
  Pin,
  Trash2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import clsx from "clsx";

interface ChatSession {
  id: string;
  title: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SwiftAISidebarProps {
  sessions: ChatSession[];
  activeChatId: string | null;
  isLoading: boolean;
  loadError: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onPin: (id: string, isPinned: boolean) => void;
  onRetry: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (v: boolean) => void;
}

export function SwiftAISidebar({
  sessions,
  activeChatId,
  isLoading,
  loadError,
  onSelect,
  onNewChat,
  onDelete,
  onRename,
  onPin,
  onRetry,
  collapsed: collapsedProp,
  onCollapsedChange,
}: SwiftAISidebarProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [collapsedInternal, setCollapsedInternal] = useState(false);

  const collapsed = collapsedProp !== undefined ? collapsedProp : collapsedInternal;
  const setCollapsed = (v: boolean) => {
    setCollapsedInternal(v);
    onCollapsedChange?.(v);
  };

  const pinned = sessions.filter((s) => s.isPinned);
  const recent = sessions.filter((s) => !s.isPinned);

  const startRename = (s: ChatSession) => {
    setRenamingId(s.id);
    setRenameValue(s.title);
    setMenuOpenId(null);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  // ─── Collapsed rail (mobile-friendly narrow strip) ───────────────────────
  if (collapsed) {
    return (
      <div className="shrink-0 w-10 border-r border-gray-100 dark:border-white/6 flex flex-col items-center py-3 gap-3 bg-gray-50/50 dark:bg-white/2">
        <button
          onClick={() => setCollapsed(false)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight size={14} />
        </button>
        <button
          onClick={onNewChat}
          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-orange hover:bg-brand-orange/8 dark:hover:bg-brand-orange/10 transition-colors"
          title="New chat"
        >
          <Plus size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-56 shrink-0 border-r border-gray-100 dark:border-white/6 flex flex-col bg-gray-50/50 dark:bg-white/2">
      {/* Header row: New chat + Collapse toggle */}
      <div className="p-3 flex items-center gap-2">
        <button
          onClick={onNewChat}
          className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/8 hover:border-brand-orange/40 hover:text-brand-orange dark:hover:text-brand-orange transition-all"
        >
          <Plus size={14} />
          New chat
        </button>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors shrink-0"
          title="Collapse sidebar"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-3">
        {isLoading ? (
          <SidebarSkeleton />
        ) : loadError ? (
          <SidebarError message={loadError} onRetry={onRetry} />
        ) : sessions.length === 0 ? (
          <SidebarEmpty onNewChat={onNewChat} />
        ) : (
          <>
            {pinned.length > 0 && (
              <SectionLabel icon={<Pin size={10} />} label="Pinned" />
            )}
            {pinned.map((s) => (
              <ChatItem
                key={s.id}
                session={s}
                isActive={s.id === activeChatId}
                isRenaming={s.id === renamingId}
                renameValue={renameValue}
                menuOpen={s.id === menuOpenId}
                onSelect={() => onSelect(s.id)}
                onMenuToggle={() =>
                  setMenuOpenId(menuOpenId === s.id ? null : s.id)
                }
                onMenuClose={() => setMenuOpenId(null)}
                onRenameStart={() => startRename(s)}
                onRenameChange={setRenameValue}
                onRenameCommit={commitRename}
                onRenameCancel={() => setRenamingId(null)}
                onPin={() => onPin(s.id, !s.isPinned)}
                onDelete={() => {
                  onDelete(s.id);
                  setMenuOpenId(null);
                }}
              />
            ))}

            {recent.length > 0 && (
              <SectionLabel icon={<MessageSquare size={10} />} label="Recent" />
            )}
            {recent.map((s) => (
              <ChatItem
                key={s.id}
                session={s}
                isActive={s.id === activeChatId}
                isRenaming={s.id === renamingId}
                renameValue={renameValue}
                menuOpen={s.id === menuOpenId}
                onSelect={() => onSelect(s.id)}
                onMenuToggle={() =>
                  setMenuOpenId(menuOpenId === s.id ? null : s.id)
                }
                onMenuClose={() => setMenuOpenId(null)}
                onRenameStart={() => startRename(s)}
                onRenameChange={setRenameValue}
                onRenameCommit={commitRename}
                onRenameCancel={() => setRenamingId(null)}
                onPin={() => onPin(s.id, !s.isPinned)}
                onDelete={() => {
                  onDelete(s.id);
                  setMenuOpenId(null);
                }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── SIDEBAR SKELETON ────────────────────────────────────────────────────────

function SidebarSkeleton() {
  return (
    <div className="space-y-1.5 px-1 pt-1">
      {[80, 64, 72, 56, 68].map((w, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5">
          <div
            className="h-3 rounded bg-gray-200 dark:bg-white/8 animate-pulse"
            style={{ width: `${w}%` }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── SIDEBAR EMPTY ───────────────────────────────────────────────────────────

function SidebarEmpty({ onNewChat }: { onNewChat: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center pt-10 pb-4 text-center px-4">
      <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
        <MessageSquare size={16} className="text-gray-300 dark:text-gray-600" />
      </div>
      <p className="text-[12px] font-semibold text-gray-500 dark:text-gray-400">
        No conversations yet
      </p>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
        Ask Swift anything about your typing
      </p>
      <button
        onClick={onNewChat}
        className="mt-3 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-brand-orange border border-brand-orange/20 dark:border-brand-orange/20 hover:bg-brand-orange/5 dark:hover:bg-brand-orange/10 transition-colors"
      >
        Start a conversation
      </button>
    </div>
  );
}

// ─── SIDEBAR ERROR ───────────────────────────────────────────────────────────

function SidebarError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center pt-10 pb-4 text-center px-4">
      <AlertCircle size={18} className="text-red-400 dark:text-red-500 mb-2" />
      <p className="text-[11px] text-gray-500 dark:text-gray-400">{message}</p>
      <button
        onClick={onRetry}
        className="mt-2 px-3 py-1 rounded-lg text-[11px] font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/8 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

// ─── SECTION LABEL ───────────────────────────────────────────────────────────

function SectionLabel({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 px-2 pt-3 pb-1">
      <span className="text-gray-400 dark:text-gray-500">{icon}</span>
      <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

// ─── CHAT ITEM ───────────────────────────────────────────────────────────────

function ChatItem({
  session,
  isActive,
  isRenaming,
  renameValue,
  menuOpen,
  onSelect,
  onMenuToggle,
  onMenuClose,
  onRenameStart,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
  onPin,
  onDelete,
}: {
  session: ChatSession;
  isActive: boolean;
  isRenaming: boolean;
  renameValue: string;
  menuOpen: boolean;
  onSelect: () => void;
  onMenuToggle: () => void;
  onMenuClose: () => void;
  onRenameStart: () => void;
  onRenameChange: (v: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
  onPin: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative group">
      <button
        onClick={onSelect}
        className={clsx(
          "w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] transition-all",
          isActive
            ? "bg-orange-50 dark:bg-brand-orange/10 text-brand-orange font-semibold"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5",
        )}
      >
        {isRenaming ? (
          <div
            className="flex items-center gap-1 flex-1 min-w-0"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onRenameCommit();
                if (e.key === "Escape") onRenameCancel();
              }}
              className="flex-1 min-w-0 bg-white dark:bg-white/10 border border-brand-orange/30 dark:border-brand-orange/20 rounded px-1.5 py-0.5 text-[12px] outline-none focus:ring-1 focus:ring-brand-orange/50"
            />
            <button
              onClick={onRenameCommit}
              className="p-0.5 text-green-500 hover:text-green-600"
            >
              <Check size={12} />
            </button>
            <button
              onClick={onRenameCancel}
              className="p-0.5 text-gray-400 hover:text-gray-500"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <span className="truncate flex-1 min-w-0">{session.title}</span>
        )}
      </button>

      {/* Context menu trigger */}
      {!isRenaming && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMenuToggle();
          }}
          className={clsx(
            "absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded transition-all",
            menuOpen
              ? "opacity-100 bg-gray-100 dark:bg-white/10"
              : "opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-white/10",
          )}
        >
          <MoreHorizontal size={12} className="text-gray-400" />
        </button>
      )}

      {/* Dropdown */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onMenuClose} />
          <div className="absolute right-0 top-full mt-1 z-20 w-36 py-1 rounded-lg bg-white dark:bg-[#1e2028] border border-gray-200 dark:border-white/10 shadow-lg">
            <DropdownItem
              icon={<Pencil size={12} />}
              label="Rename"
              onClick={onRenameStart}
            />
            <DropdownItem
              icon={<Pin size={12} />}
              label={session.isPinned ? "Unpin" : "Pin"}
              onClick={() => {
                onPin();
                onMenuClose();
              }}
            />
            <DropdownItem
              icon={<Trash2 size={12} />}
              label="Delete"
              onClick={onDelete}
              danger
            />
          </div>
        </>
      )}
    </div>
  );
}

// ─── DROPDOWN ITEM ───────────────────────────────────────────────────────────

function DropdownItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full flex items-center gap-2 px-3 py-1.5 text-[12px] transition-colors",
        danger
          ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
