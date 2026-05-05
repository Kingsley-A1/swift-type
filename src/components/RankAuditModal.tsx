"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCw } from "lucide-react";
import { getTierInfo, SWIFT_RANK_TIERS, type XpLedgerEntry } from "@/lib/swiftRank";

interface SnapshotDetail {
  userId: string;
  rank: number | null;
  tier: string;
  tierEmoji: string;
  tierColor: string;
  tierMinXp: number;
  totalXp: number;
  avgWpm: number;
  avgAccuracy: number;
  totalSessions: number;
  totalPracticeMinutes: number;
  bestStreak: number;
  wpmContribution?: number;
  accuracyContribution?: number;
  durationContribution?: number;
  streakContribution?: number;
}

interface RankAuditModalProps {
  userId: string | null;
  period: string;
  onClose: () => void;
}

function XpBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">{label}</span>
        <span className="text-[11px] font-bold" style={{ color }}>{value.toLocaleString()} XP <span className="text-gray-400 font-normal">({pct}%)</span></span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-white/8 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function nextTierProgress(totalXp: number) {
  const current = getTierInfo(
    SWIFT_RANK_TIERS.slice().reverse().find((t) => totalXp >= t.minXp)?.name ?? "Rookie"
  );
  const nextIdx = SWIFT_RANK_TIERS.findIndex((t) => t.name === current.name) + 1;
  const next = SWIFT_RANK_TIERS[nextIdx] ?? null;
  if (!next) return null;
  const range = next.minXp - current.minXp;
  const progress = totalXp - current.minXp;
  return { next, pct: Math.min(100, Math.round((progress / range) * 100)), xpNeeded: next.minXp - totalXp };
}

export function RankAuditModal({ userId, period, onClose }: RankAuditModalProps) {
  const [snapshot, setSnapshot] = useState<SnapshotDetail | null>(null);
  const [ledger, setLedger] = useState<XpLedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!userId) { setSnapshot(null); setLedger([]); return; }
    setIsLoading(true);
    setError(false);
    fetch(`/api/rank/user/${userId}?period=${period}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setSnapshot(data.snapshot);
        setLedger(data.ledger ?? []);
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [userId, period]);

  const isOpen = !!userId;
  const tierInfo = snapshot ? getTierInfo(snapshot.tier) : null;
  const nextTier = snapshot ? nextTierProgress(snapshot.totalXp) : null;

  // XP breakdown from ledger aggregation
  const wpmTotal = ledger.reduce((s, e) => s + e.wpmContribution, 0);
  const accTotal = ledger.reduce((s, e) => s + e.accuracyContribution, 0);
  const durTotal = ledger.reduce((s, e) => s + e.durationContribution, 0);
  const strTotal = ledger.reduce((s, e) => s + e.streakContribution, 0);
  const totalXp = snapshot?.totalXp ?? 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="audit-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-60 bg-black/30 backdrop-blur-sm dark:bg-black/50"
          />

          <motion.div
            key="audit-modal"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed inset-x-4 top-[10vh] z-70 mx-auto max-w-lg flex flex-col max-h-[80vh] rounded-2xl bg-white dark:bg-[#14161c] shadow-2xl overflow-hidden"
            style={{ border: "1px solid var(--container-border, rgba(0,0,0,0.08))" }}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/8">
              <div className="flex items-center gap-3">
                {tierInfo && (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
                    style={{ background: `${tierInfo.color}18`, border: `1px solid ${tierInfo.color}30` }}
                  >
                    {tierInfo.emoji}
                  </div>
                )}
                <div>
                  <h2 className="text-[15px] font-black text-gray-900 dark:text-white leading-none">
                    Rank Audit
                  </h2>
                  <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{period}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {isLoading && (
                <div className="flex justify-center py-12">
                  <RefreshCw size={22} className="text-gray-300 animate-spin" />
                </div>
              )}

              {error && (
                <div className="text-center py-10">
                  <p className="text-sm text-gray-400">Could not load rank data.</p>
                </div>
              )}

              {snapshot && !isLoading && (
                <>
                  {/* Top stats grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Global Rank", value: snapshot.rank ? `#${snapshot.rank}` : "—", highlight: true },
                      { label: "Total XP", value: totalXp.toLocaleString(), highlight: true },
                      { label: "Avg WPM", value: `${Math.round(snapshot.avgWpm)}` },
                      { label: "Avg Accuracy", value: `${Math.round(snapshot.avgAccuracy)}%` },
                      { label: "Sessions", value: `${snapshot.totalSessions}` },
                      { label: "Practice Time", value: `${Math.round(snapshot.totalPracticeMinutes)}m` },
                      { label: "Best Streak", value: `${snapshot.bestStreak} days` },
                      { label: "Tier", value: `${tierInfo?.emoji} ${snapshot.tier}` },
                    ].map(({ label, value, highlight }) => (
                      <div key={label} className="p-3 rounded-xl bg-gray-50 dark:bg-white/4">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
                        <p className={`text-[15px] font-black mt-0.5 ${highlight ? "text-brand-orange" : "text-gray-900 dark:text-white"}`}>
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Next tier progress */}
                  {nextTier && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                        Progress to {nextTier.next.emoji} {nextTier.next.name}
                      </p>
                      <div className="h-2.5 rounded-full bg-gray-100 dark:bg-white/8 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, #fa4c0c, #ff8c5a)` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${nextTier.pct}%` }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        {nextTier.xpNeeded.toLocaleString()} XP needed · {nextTier.pct}% there
                      </p>
                    </div>
                  )}

                  {/* XP breakdown */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                      XP Breakdown
                    </p>
                    <div className="space-y-3">
                      <XpBar label="⚡ Speed (WPM)" value={wpmTotal} total={totalXp} color="#fa4c0c" />
                      <XpBar label="🎯 Accuracy" value={accTotal} total={totalXp} color="#10b981" />
                      <XpBar label="⏱ Practice Time" value={durTotal} total={totalXp} color="#60a5fa" />
                      <XpBar label="🔥 Streak Bonus" value={strTotal} total={totalXp} color="#f59e0b" />
                    </div>
                  </div>

                  {/* Formula explainer */}
                  <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/4 border border-gray-100 dark:border-white/6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                      How Swift XP is calculated
                    </p>
                    <p className="text-[11px] font-mono text-gray-700 dark:text-gray-300 leading-relaxed">
                      XP = (WPM × 1.0) + (Accuracy × 0.8)<br />
                      &nbsp;&nbsp;&nbsp;&nbsp; + (Minutes × 2.0) + (Streak × 0.5, max 30)
                    </p>
                    <p className="text-[10px] text-gray-400 mt-2">
                      Each completed session contributes XP. Monthly totals determine your global rank.
                    </p>
                  </div>

                  {/* Session ledger */}
                  {ledger.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                        Recent Session Contributions
                      </p>
                      <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-white/6">
                        {ledger.map((entry, i) => (
                          <div
                            key={entry.id}
                            className={`flex items-center justify-between px-4 py-2.5 text-[11px] ${
                              i < ledger.length - 1 ? "border-b border-gray-100 dark:border-white/6" : ""
                            }`}
                          >
                            <span className="text-gray-500 dark:text-gray-400 font-mono">
                              {entry.createdAt
                                ? new Date(entry.createdAt).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                  })
                                : "—"}
                            </span>
                            <div className="flex gap-3 text-gray-400">
                              <span title="WPM XP">⚡{entry.wpmContribution}</span>
                              <span title="Accuracy XP">🎯{entry.accuracyContribution}</span>
                              <span title="Duration XP">⏱{entry.durationContribution}</span>
                              <span title="Streak XP">🔥{entry.streakContribution}</span>
                            </div>
                            <span className="font-black text-brand-orange">+{entry.xpAwarded} XP</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
