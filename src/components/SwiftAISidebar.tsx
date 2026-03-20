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
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onPin: (id: string, isPinned: boolean) => void;
}

export function SwiftAISidebar({
  sessions,
  activeChatId,
  isLoading,
  onSelect,
  onNewChat,
  onDelete,
  onRename,
  onPin,
}: SwiftAISidebarProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

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

  return (
    <div className="w-56 flex-shrink-0 border-r border-gray-100 dark:border-white/6 flex flex-col bg-gray-50/50 dark:bg-white/[0.02]">
      {/* New chat button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/8 hover:border-purple-400/40 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
        >
          <Plus size={14} />
          New chat
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-3">
        {isLoading ? (
          <div className="space-y-2 px-1 pt-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 rounded-lg bg-gray-100 dark:bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-12 text-center px-4">
            <MessageSquare
              size={20}
              className="text-gray-300 dark:text-gray-600 mb-2"
            />
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              No conversations yet
            </p>
          </div>
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
            ? "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold"
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
              className="flex-1 min-w-0 bg-white dark:bg-white/10 border border-purple-300 dark:border-purple-500/30 rounded px-1.5 py-0.5 text-[12px] outline-none focus:ring-1 focus:ring-purple-400"
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
