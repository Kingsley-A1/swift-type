"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trophy,
  RefreshCw,
  ChevronDown,
  Medal,
} from "lucide-react";
import { CURRENT_PERIOD, getTierInfo, SWIFT_RANK_TIERS, type LeaderboardEntry } from "@/lib/swiftRank";
import { RankAuditModal } from "./RankAuditModal";
import { useSession } from "next-auth/react";

interface MySnapshot {
  rank: number | null;
  tier: string;
  totalXp: number;
  avgWpm: number;
  avgAccuracy: number;
  totalSessions: number;
  totalPracticeMinutes: number;
  bestStreak: number;
}

interface SwiftRankPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PERIODS_TO_SHOW = 3;

function buildPeriodOptions() {
  const options: { label: string; value: string }[] = [];
  const now = new Date();
  for (let i = 0; i < PERIODS_TO_SHOW; i++) {
    const d = new Date(now.getUTCFullYear(), now.getUTCMonth() - i, 1);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const value = `${y}-${m}`;
    const label = d.toLocaleString("default", { month: "long", year: "numeric" });
    options.push({ label, value });
  }
  return options;
}

function TierBadge({ tier }: { tier: string }) {
  const info = getTierInfo(tier);
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
      style={{ color: info.color, borderColor: `${info.color}40`, background: `${info.color}14` }}
    >
      {info.emoji} {tier}
    </span>
  );
}

function RankRow({
  entry,
  isMe,
  onClick,
}: {
  entry: LeaderboardEntry;
  isMe: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      className={`w-full px-4 py-3 text-left transition-all border-b last:border-b-0 ${
        isMe
          ? "bg-brand-orange/6 border-brand-orange/15 dark:bg-brand-orange/10"
          : "hover:bg-gray-50 dark:hover:bg-white/4 border-gray-100 dark:border-white/6"
      }`}
    >
      {/* Mobile Layout */}
      <div className="flex md:hidden items-center gap-3">
        {/* Rank number */}
        <div className="w-8 shrink-0 text-center">
          {entry.rank <= 3 ? (
            <span className="text-base">{["🥇", "🥈", "🥉"][entry.rank - 1]}</span>
          ) : (
            <span className={`text-[13px] font-bold ${isMe ? "text-brand-orange" : "text-gray-400"}`}>
              #{entry.rank}
            </span>
          )}
        </div>

        {/* Avatar */}
        <div className="shrink-0 w-8 h-8 flex items-center justify-center">
          {entry.avatarUrl && !entry.isAnonymous ? (
            <img
              src={entry.avatarUrl}
              alt={entry.displayName}
              className="w-7 h-7 rounded-full border border-gray-200 dark:border-white/10"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black"
              style={{ background: `${getTierInfo(entry.tier).color}25`, color: getTierInfo(entry.tier).color }}
            >
              {entry.isAnonymous ? "?" : entry.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        {/* Name + tier */}
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] font-semibold truncate ${isMe ? "text-brand-orange" : "text-gray-900 dark:text-white"}`}>
            {entry.displayName} {isMe && <span className="text-[10px] font-bold opacity-70">(You)</span>}
          </p>
          <div className="mt-0.5">
            <TierBadge tier={entry.tier} />
          </div>
        </div>

        {/* XP + WPM */}
        <div className="text-right shrink-0">
          <p className="text-[13px] font-black text-brand-orange">{entry.totalXp.toLocaleString()} XP</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{entry.avgWpm} WPM · {entry.avgAccuracy}%</p>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid grid-cols-[1.5rem_2rem_minmax(100px,1.5fr)_3.5rem_3.5rem_3.5rem_4rem_3.5rem_4.5rem] items-center gap-2">
        <div className="text-center">
          {entry.rank <= 3 ? (
            <span className="text-base">{["🥇", "🥈", "🥉"][entry.rank - 1]}</span>
          ) : (
            <span className={`text-[12px] font-bold ${isMe ? "text-brand-orange" : "text-gray-400"}`}>
              #{entry.rank}
            </span>
          )}
        </div>

        <div className="w-8 h-8 flex items-center justify-center shrink-0">
          {entry.avatarUrl && !entry.isAnonymous ? (
            <img
              src={entry.avatarUrl}
              alt={entry.displayName}
              className="w-7 h-7 rounded-full border border-gray-200 dark:border-white/10"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black"
              style={{ background: `${getTierInfo(entry.tier).color}25`, color: getTierInfo(entry.tier).color }}
            >
              {entry.isAnonymous ? "?" : entry.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 pr-1">
          <p className={`text-[13px] font-semibold truncate ${isMe ? "text-brand-orange" : "text-gray-900 dark:text-white"}`}>
            {entry.displayName} {isMe && <span className="text-[10px] font-bold opacity-70 ml-1">(You)</span>}
          </p>
          <div className="mt-0.5 flex">
            <TierBadge tier={entry.tier} />
          </div>
        </div>

        <div className="text-right">
          <span className="text-[12px] font-semibold text-gray-600 dark:text-gray-300">{entry.avgAccuracy}%</span>
        </div>

        <div className="text-right">
          <span className="text-[12px] font-semibold text-gray-600 dark:text-gray-300">{entry.avgWpm}</span>
        </div>

        <div className="text-right">
          <span className="text-[12px] font-semibold text-gray-600 dark:text-gray-300">{entry.bestStreak}d</span>
        </div>

        <div className="text-right">
          <span className="text-[12px] font-semibold text-gray-600 dark:text-gray-300">{entry.totalPracticeMinutes}m</span>
        </div>

        <div className="text-right">
          <span className="text-[12px] font-semibold text-gray-600 dark:text-gray-300">{entry.totalSessions}</span>
        </div>

        <div className="text-right">
          <p className="text-[12px] font-black text-brand-orange">{entry.totalXp.toLocaleString()}</p>
        </div>
      </div>
    </motion.button>
  );
}

export function SwiftRankPanel({ isOpen, onClose }: SwiftRankPanelProps) {
  const { data: session } = useSession();
  const myUserId = session?.user?.id ?? null;

  const periodOptions = buildPeriodOptions();
  const [period, setPeriod] = useState(CURRENT_PERIOD());
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [mySnapshot, setMySnapshot] = useState<MySnapshot | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [auditUserId, setAuditUserId] = useState<string | null>(null);
  const PAGE = 30;

  const fetchPage = useCallback(
    async (o: number, reset: boolean) => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/rank/leaderboard?period=${period}&limit=${PAGE}&offset=${o}`,
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        setEntries((prev) => (reset ? data.entries : [...prev, ...data.entries]));
        setTotal(data.total);
        setMySnapshot(data.mySnapshot);
        setOffset(o + data.entries.length);
      } catch {
        // leave existing data
      } finally {
        setIsLoading(false);
      }
    },
    [period],
  );

  useEffect(() => {
    if (!isOpen) return;
    setOffset(0);
    setEntries([]);
    fetchPage(0, true);
  }, [isOpen, period, fetchPage]);

  const hasMore = entries.length < total;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="rank-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] dark:bg-black/40"
            />

            <motion.div
              key="rank-panel"
              initial={{ x: "100%", opacity: 0.7 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.7 }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="fixed inset-y-0 right-0 z-50 flex flex-col w-full lg:w-1/2 md:max-w-[900px] bg-white dark:bg-[#14161c] shadow-2xl"
              style={{ borderLeft: "1px solid var(--container-border, rgba(0,0,0,0.08))" }}
            >
              {/* ── Header ── */}
              <div className="flex-shrink-0 px-5 py-4 border-b border-gray-100 dark:border-white/8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
                      style={{ background: "linear-gradient(135deg, #fa4c0c, #ff8c5a)" }}
                    >
                      <Trophy size={16} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-[15px] font-black text-gray-900 dark:text-white leading-none">
                        Swift <span style={{ color: "#fa4c0c" }}>Rank</span>
                      </h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">Global Leaderboard</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Period picker */}
                    <div className="relative">
                      <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="appearance-none text-[11px] font-semibold pr-5 pl-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-white/8 text-gray-700 dark:text-gray-200 border-none focus:ring-1 focus:ring-brand-orange/30 cursor-pointer"
                      >
                        {periodOptions.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                    </div>

                    <button
                      onClick={() => { setOffset(0); setEntries([]); fetchPage(0, true); }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw size={13} className={`text-gray-400 ${isLoading ? "animate-spin" : ""}`} />
                    </button>

                    <button
                      onClick={onClose}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
                    >
                      <X size={15} className="text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Tier legend */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {SWIFT_RANK_TIERS.map((t) => (
                    <span key={t.name} className="text-[10px] font-semibold flex items-center gap-1" style={{ color: t.color }}>
                      {t.emoji} {t.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* ── My Rank Pill (pinned) ── */}
              {mySnapshot && (
                <button
                  onClick={() => myUserId && setAuditUserId(myUserId)}
                  className="flex-shrink-0 mx-4 my-3 p-3.5 rounded-xl border text-left hover:shadow-sm transition-all"
                  style={{
                    background: "linear-gradient(135deg, rgba(250,76,12,0.07), rgba(255,140,90,0.04))",
                    borderColor: "rgba(250,76,12,0.2)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Your Rank</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-black text-brand-orange">
                          {mySnapshot.rank ? `#${mySnapshot.rank}` : "—"}
                        </span>
                        <TierBadge tier={mySnapshot.tier} />
                      </div>
                    </div>
                    {/* Desktop detailed view for me */}
                    <div className="hidden md:flex gap-6 items-center pr-4">
                      <div className="text-right">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Acc</p>
                        <p className="text-[15px] font-black text-gray-700 dark:text-gray-200">{mySnapshot.avgAccuracy}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Speed</p>
                        <p className="text-[15px] font-black text-gray-700 dark:text-gray-200">{mySnapshot.avgWpm} WPM</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Total XP</p>
                        <p className="text-[16px] font-black text-brand-orange">{mySnapshot.totalXp.toLocaleString()}</p>
                      </div>
                    </div>
                    {/* Mobile simplified view for me */}
                    <div className="text-right md:hidden">
                      <p className="text-[15px] font-black text-brand-orange">{mySnapshot.totalXp.toLocaleString()} XP</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {mySnapshot.avgWpm} WPM · {mySnapshot.avgAccuracy}% acc
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* ── Table Header ── */}
              {/* Mobile Header */}
              <div className="flex md:hidden flex-shrink-0 items-center gap-3 px-4 py-2 border-b border-gray-100 dark:border-white/6 bg-gray-50 dark:bg-white/3">
                <div className="w-8 text-center text-[9px] font-bold tracking-widest text-gray-400 uppercase">#</div>
                <div className="w-7" />
                <div className="flex-1 text-[9px] font-bold tracking-widest text-gray-400 uppercase">Typist</div>
                <div className="shrink-0 text-right text-[9px] font-bold tracking-widest text-gray-400 uppercase">XP / WPM</div>
              </div>

              {/* Desktop Header */}
              <div className="hidden md:grid flex-shrink-0 grid-cols-[1.5rem_2rem_minmax(100px,1.5fr)_3.5rem_3.5rem_3.5rem_4rem_3.5rem_4.5rem] items-center gap-2 px-4 py-2 border-b border-gray-100 dark:border-white/6 bg-gray-50 dark:bg-white/3">
                <div className="text-center text-[9px] font-bold tracking-widest text-gray-400 uppercase">#</div>
                <div />
                <div className="text-[9px] font-bold tracking-widest text-gray-400 uppercase pl-1">Typist</div>
                <div className="text-right text-[9px] font-bold tracking-widest text-gray-400 uppercase" title="Accuracy">Acc</div>
                <div className="text-right text-[9px] font-bold tracking-widest text-gray-400 uppercase" title="Speed (Words Per Minute)">WPM</div>
                <div className="text-right text-[9px] font-bold tracking-widest text-gray-400 uppercase" title="Streak">Strk</div>
                <div className="text-right text-[9px] font-bold tracking-widest text-gray-400 uppercase" title="Practice Time">Time</div>
                <div className="text-right text-[9px] font-bold tracking-widest text-gray-400 uppercase" title="Sessions">Sess</div>
                <div className="text-right text-[9px] font-bold tracking-widest text-brand-orange uppercase">XP</div>
              </div>

              {/* ── Rows ── */}
              <div className="flex-1 overflow-y-auto">
                {entries.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12">
                    <Medal size={36} className="text-gray-200 dark:text-white/10 mb-3" />
                    <p className="text-sm font-semibold text-gray-400">No rankings yet for this period</p>
                    <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-1">Complete a session to appear on the board</p>
                  </div>
                )}

                {entries.map((entry) => (
                  <RankRow
                    key={entry.userId}
                    entry={entry}
                    isMe={entry.userId === myUserId}
                    onClick={() => setAuditUserId(entry.userId)}
                  />
                ))}

                {/* Load more */}
                {hasMore && (
                  <div className="border-t border-gray-100 dark:border-white/6">
                    <button
                      onClick={() => fetchPage(offset, false)}
                      disabled={isLoading}
                      className="w-full py-3.5 text-[12px] font-semibold text-brand-orange hover:bg-brand-orange/5 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? "Loading…" : `Show ${Math.min(30, total - entries.length)} more of ${(total - entries.length).toLocaleString()} remaining`}
                    </button>
                  </div>
                )}

                {isLoading && entries.length === 0 && (
                  <div className="flex items-center justify-center py-16">
                    <RefreshCw size={20} className="text-gray-300 animate-spin" />
                  </div>
                )}
              </div>

              {/* ── Footer ── */}
              <div className="flex-shrink-0 px-5 py-3 border-t border-gray-100 dark:border-white/6">
                <p className="text-[10px] text-gray-400 text-center">
                  {total} typists ranked · Resets monthly · Click any row for full audit
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Rank Audit Modal */}
      <RankAuditModal
        userId={auditUserId}
        period={period}
        onClose={() => setAuditUserId(null)}
      />
    </>
  );
}
