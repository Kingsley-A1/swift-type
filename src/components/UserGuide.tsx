"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  BookOpen,
  ChevronRight,
  Zap,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import {
  GUIDE_SECTIONS,
  SEARCH_INDEX,
  GuideSection,
  GuideBlock,
} from "@/data/userGuide";
import clsx from "clsx";

// ─── LEVEL BADGE ─────────────────────────────────────────────────────────────
const LEVEL_STYLES = {
  beginner:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  intermediate:
    "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  advanced: "bg-purple-500/15 text-purple-500 border-purple-500/20",
  all: "bg-brand-orange/10 text-brand-orange border-brand-orange/20",
};
const LEVEL_LABELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  all: "All Levels",
};

function LevelBadge({ level }: { level: GuideSection["level"] }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
        LEVEL_STYLES[level],
      )}
    >
      {LEVEL_LABELS[level]}
    </span>
  );
}

// ─── CONTENT BLOCK RENDERER ──────────────────────────────────────────────────
function BlockRenderer({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {block.text}
        </p>
      );
    case "heading":
      return (
        <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-4 mb-1 flex items-center gap-1.5">
          <span className="w-1 h-4 rounded-full bg-brand-orange inline-block" />
          {block.text}
        </h4>
      );
    case "tip":
      return (
        <div className="flex gap-3 p-3 rounded-xl bg-brand-orange/8 border border-brand-orange/20">
          <span className="text-brand-orange flex-shrink-0 mt-0.5">💡</span>
          <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">
            {block.text}
          </p>
        </div>
      );
    case "warning":
      return (
        <div className="flex gap-3 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
          <span className="flex-shrink-0 mt-0.5">⚠️</span>
          <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">
            {block.text}
          </p>
        </div>
      );
    case "steps":
      return (
        <ol className="space-y-2 mt-1">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="flex gap-3 text-sm text-gray-600 dark:text-gray-300"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-orange text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ol>
      );
    case "keys":
      return (
        <div className="space-y-2 mt-1">
          {block.items.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5"
            >
              <kbd className="flex-shrink-0 px-2.5 py-1 rounded-md bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-xs font-mono font-bold text-gray-800 dark:text-gray-100 shadow-sm">
                {item.key}
              </kbd>
              <span className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed pt-0.5">
                {item.desc}
              </span>
            </div>
          ))}
        </div>
      );
    case "stats":
      return (
        <div className="grid grid-cols-2 gap-2 mt-1">
          {block.items.map((item, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm"
            >
              <div className="text-lg font-extrabold text-brand-orange leading-none">
                {item.value}
              </div>
              <div className="text-[11px] font-semibold text-gray-800 dark:text-gray-100 mt-1">
                {item.label}
              </div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

// ─── SECTION DETAIL VIEW ─────────────────────────────────────────────────────
function SectionDetail({
  section,
  onBack,
}: {
  section: GuideSection;
  onBack: () => void;
}) {
  return (
    <motion.div
      key="detail"
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 260 }}
      className="flex flex-col h-full"
    >
      {/* Sticky header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-white/8">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={16} className="text-gray-500 dark:text-gray-400" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{section.emoji}</span>
            <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
              {section.title}
            </h2>
          </div>
        </div>
        <LevelBadge level={section.level} />
      </div>

      {/* Content scroll */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar">
        {section.content.map((block, i) => (
          <BlockRenderer key={i} block={block} />
        ))}

        {/* Footer */}
        <div className="pt-6 pb-2 border-t border-gray-100 dark:border-white/8 mt-6">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
            Swift Type — Train your fingers. Master your keyboard.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── SECTION CARD ────────────────────────────────────────────────────────────
function SectionCard({
  section,
  onClick,
  highlight,
}: {
  section: GuideSection;
  onClick: () => void;
  highlight?: string;
}) {
  const getExcerpt = () => {
    if (!highlight) return null;
    const idx = SEARCH_INDEX.find((s) => s.sectionId === section.id);
    if (!idx) return null;
    const pos = idx.body.toLowerCase().indexOf(highlight.toLowerCase());
    if (pos === -1) return null;
    const start = Math.max(0, pos - 30);
    const end = Math.min(idx.body.length, pos + highlight.length + 60);
    return idx.body.slice(start, end).trim();
  };

  const excerpt = getExcerpt();

  return (
    <motion.button
      layout
      onClick={onClick}
      whileHover={{ x: 4 }}
      className="w-full text-left py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent transition-all group flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-4">
        <div className="text-2xl group-hover:scale-110 transition-transform">
          {section.emoji}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-brand-orange transition-colors">
              {section.title}
            </h3>
            <LevelBadge level={section.level} />
          </div>
          {excerpt && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 line-clamp-1">
              …{excerpt}…
            </p>
          )}
        </div>
      </div>
      <ChevronRight
        size={16}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-brand-orange"
      />
    </motion.button>
  );
}

// ─── SEARCH RESULTS ──────────────────────────────────────────────────────────
function SearchResults({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (id: string) => void;
}) {
  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return SEARCH_INDEX.filter((s) => s.searchText.includes(q))
      .slice(0, 6)
      .map((s) => GUIDE_SECTIONS.find((g) => g.id === s.sectionId)!);
  }, [query]);

  if (!query || query.length < 2) return null;

  return (
    <div className="space-y-2">
      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <span className="text-3xl mb-2">🔍</span>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            No results for "{query}"
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Try "WPM", "shortcuts", "finger", "adaptive"
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 pb-1">
            {results.length} result{results.length !== 1 ? "s" : ""} for "
            {query}"
          </p>
          {results.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              onClick={() => onSelect(section.id)}
              highlight={query}
            />
          ))}
        </>
      )}
    </div>
  );
}

// ─── MAIN GUIDE PANEL ────────────────────────────────────────────────────────
interface UserGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onAskSwift?: () => void;
  isSwiftAIOpen?: boolean;
}

const LEVEL_FILTERS = [
  { value: "all", label: "All" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

export function UserGuide({
  isOpen,
  onClose,
  onAskSwift,
  isSwiftAIOpen,
}: UserGuideProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus search when opened
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => searchRef.current?.focus(), 300);
      return () => clearTimeout(t);
    } else {
      setSearchQuery("");
      setActiveSection(null);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setActiveSection(null);
    setSearchQuery("");
    onClose();
  }, [onClose]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, handleClose]);

  const filteredSections = useMemo(() => {
    return GUIDE_SECTIONS.filter(
      (s) =>
        levelFilter === "all" || s.level === levelFilter || s.level === "all",
    );
  }, [levelFilter]);

  const selectedSection = activeSection
    ? GUIDE_SECTIONS.find((s) => s.id === activeSection)
    : null;

  const isSearching = searchQuery.length >= 2;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — only when Swift AI is NOT also open */}
          {!isSwiftAIOpen && (
            <motion.div
              key="guide-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={handleClose}
              className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-[2px]"
            />
          )}

          {/* Panel — sits beside SwiftAI when it's open, otherwise at right-0 */}
          <motion.div
            key="guide-panel"
            initial={{ x: "100%", opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.6 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed inset-y-0 right-0 z-50 flex flex-col shadow-2xl border-l border-gray-200 dark:border-white/10"
            style={{
              right: isSwiftAIOpen ? "clamp(300px, 30vw, 500px)" : "0",
              width: "100%",
              maxWidth: "420px",
              transition:
                "right 0.3s cubic-bezier(0.4,0,0.2,1)",
              background: "var(--container-bg)",
              backdropFilter: "blur(24px) saturate(180%)",
            }}
          >
            {/* ── Header ── */}
            <div
              className="flex-shrink-0 dark:bg-transparent"
              style={{
                background: "var(--container-bg)",
                borderBottom: "1px solid var(--container-border)",
              }}
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #fa4c0c, #ff8c5a)",
                    }}
                  >
                    <BookOpen size={14} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-[15px] font-black text-gray-900 dark:text-white leading-none">
                      Swift<span style={{ color: "#fa4c0c" }}>Type</span>{" "}
                      <span className="text-gray-500 dark:text-gray-400 font-semibold">Docs</span>
                    </h1>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      swifttype.com.ng
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {/* Ask Swift button */}
                  {onAskSwift && (
                    <button
                      onClick={onAskSwift}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
                      style={{
                        background: "linear-gradient(135deg, #fa4c0c, #ff8c5a)",
                      }}
                      title="Ask Swift AI"
                    >
                      <Sparkles size={11} />
                      Ask Swift
                    </button>
                  )}
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Close docs"
                  >
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Apple-style Search Bar */}
              {!activeSection && (
                <div className="px-6 pb-4">
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      ref={searchRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search the guide…"
                      className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl bg-gray-100 border-transparent focus:bg-white focus:border-brand-orange/40 border focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all text-gray-800 placeholder:text-gray-400"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-400 hover:bg-gray-500 flex items-center justify-center transition-colors"
                      >
                        <X size={9} className="text-white" />
                      </button>
                    )}
                  </div>

                  {/* Level filter pills — hide during search */}
                  {!isSearching && (
                    <div className="flex gap-1.5 mt-3">
                      {LEVEL_FILTERS.map((f) => (
                        <button
                          key={f.value}
                          onClick={() => setLevelFilter(f.value)}
                          className={clsx(
                            "px-3 py-1 rounded-full text-[11px] font-semibold transition-all",
                            levelFilter === f.value
                              ? "bg-brand-orange text-white shadow-sm"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                          )}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Scrollable Body ── */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {selectedSection ? (
                  /* Detail View */
                  <div
                    className="h-full overflow-y-auto custom-scrollbar"
                    style={{ background: "transparent" }}
                  >
                    <SectionDetail
                      section={selectedSection}
                      onBack={() => setActiveSection(null)}
                    />
                  </div>
                ) : (
                  /* Browse / Search View */
                  <motion.div
                    key="browse"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-full overflow-y-auto custom-scrollbar px-6 py-4"
                  >
                    {isSearching ? (
                      <SearchResults
                        query={searchQuery}
                        onSelect={(id) => {
                          setActiveSection(id);
                          setSearchQuery("");
                        }}
                      />
                    ) : (
                      <>
                        {/* Slim Get Started row */}
                        {levelFilter === "all" && (
                          <button
                            onClick={() => setActiveSection("first-session")}
                            className="group w-full flex items-center gap-3 p-3.5 rounded-xl mb-4 text-left border transition-all hover:shadow-sm"
                            style={{
                              background: "linear-gradient(135deg, rgba(250,76,12,0.07), rgba(255,140,90,0.04))",
                              borderColor: "rgba(250,76,12,0.15)",
                            }}
                          >
                            <span className="text-xl flex-shrink-0">⚡</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-bold text-gray-900 dark:text-white">
                                New here? Start in 2 minutes
                              </p>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                Read &ldquo;Your First Typing Session&rdquo;
                              </p>
                            </div>
                            <Zap size={14} className="flex-shrink-0 text-brand-orange group-hover:scale-110 transition-transform" />
                          </button>
                        )}

                        {/* Section list */}
                        <div className="divide-y divide-gray-100 dark:divide-white/6">
                          {filteredSections.map((section) => (
                            <SectionCard
                              key={section.id}
                              section={section}
                              onClick={() => setActiveSection(section.id)}
                            />
                          ))}
                        </div>

                        {/* Footer */}
                        <p className="text-center text-[10px] text-gray-300 dark:text-gray-600 mt-6 mb-2">
                          {GUIDE_SECTIONS.length} articles &middot; swifttype.com.ng
                        </p>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
