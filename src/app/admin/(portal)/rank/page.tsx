"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Trophy, ChevronDown, Award, Gift } from "lucide-react";
import { CURRENT_PERIOD, getTierInfo, SWIFT_RANK_TIERS, type LeaderboardEntry } from "@/lib/swiftRank";

function buildPeriods(count = 4) {
  const opts: { label: string; value: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    opts.push({
      value: `${y}-${m}`,
      label: d.toLocaleString("default", { month: "long", year: "numeric" }),
    });
  }
  return opts;
}

function TierPill({ tier }: { tier: string }) {
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

export default function AdminRankPage() {
  const periods = buildPeriods();
  const [period, setPeriod] = useState(CURRENT_PERIOD());
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isGranting, setIsGranting] = useState(false);
  const [grantMsg, setGrantMsg] = useState<string | null>(null);
  const PAGE = 50;

  const fetchPage = useCallback(async (o: number, reset: boolean) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/rank/leaderboard?period=${period}&limit=${PAGE}&offset=${o}`,
      );
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setEntries((prev) => (reset ? data.entries : [...prev, ...data.entries]));
      setTotal(data.total);
      setOffset(o + data.entries.length);
    } catch {
      // leave existing data
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    setOffset(0);
    setEntries([]);
    fetchPage(0, true);
  }, [fetchPage, period]);

  async function handleGrantRewards() {
    if (!confirm(`Grant monthly rewards for ${period}? This is idempotent — safe to re-run.`)) return;
    setIsGranting(true);
    setGrantMsg(null);
    try {
      const res = await fetch(`/api/admin/rank/grant-rewards?period=${period}`, { method: "POST" });
      const data = await res.json();
      setGrantMsg(
        data.ok
          ? `✅ Processed ${data.processed} users · ${data.rewarded} reward(s) granted for ${period}.`
          : `❌ Error: ${data.error}`,
      );
    } catch {
      setGrantMsg("❌ Network error — try again.");
    } finally {
      setIsGranting(false);
    }
  }

  const tierCounts = SWIFT_RANK_TIERS.map((t) => ({
    ...t,
    count: entries.filter((e) => e.tier === t.name).length,
  })).reverse();

  return (
    <main className="space-y-6 pb-8">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
            Leaderboard
          </p>
          <h1 className="mt-1 text-xl font-black tracking-tight text-gray-900 flex items-center gap-2">
            <Trophy size={20} className="text-[#fa4c0c]" />
            Swift Rank
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period picker */}
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 rounded-lg border border-gray-200 bg-white text-[12px] font-semibold text-gray-700 focus:ring-1 focus:ring-[#fa4c0c]/30 focus:outline-none cursor-pointer"
            >
              {periods.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>

          <button
            onClick={() => { setOffset(0); setEntries([]); fetchPage(0, true); }}
            disabled={isLoading}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-[12px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            onClick={handleGrantRewards}
            disabled={isGranting}
            className="h-9 px-4 rounded-lg bg-[#fa4c0c] text-[12px] font-bold text-white hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-60"
          >
            <Gift size={13} />
            {isGranting ? "Granting…" : "Grant Monthly Rewards"}
          </button>
        </div>
      </div>

      {/* Grant result message */}
      {grantMsg && (
        <div className={`rounded-xl px-4 py-3 text-[13px] font-medium border ${grantMsg.startsWith("✅") ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          {grantMsg}
        </div>
      )}

      {/* Tier distribution pills */}
      <section className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {tierCounts.map((t) => (
          <div
            key={t.name}
            className="rounded-xl border bg-white px-3 py-2.5 text-center"
            style={{ borderColor: `${t.color}30` }}
          >
            <p className="text-lg">{t.emoji}</p>
            <p className="text-[13px] font-black mt-0.5" style={{ color: t.color }}>{t.count}</p>
            <p className="text-[10px] text-gray-400 font-semibold">{t.name}</p>
          </div>
        ))}
      </section>

      {/* Table */}
      <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">
            {total} ranked typist{total !== 1 ? "s" : ""} · {period}
          </p>
          <p className="text-[11px] text-gray-400">Click a row to view full user profile</p>
        </div>

        {/* Table header */}
        <div className="hidden grid-cols-[2rem_2.5rem_1fr_5rem_5rem_5rem_5rem_5rem] gap-3 bg-gray-50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 sm:grid">
          <span>#</span>
          <span />
          <span>Typist</span>
          <span className="text-right">XP</span>
          <span className="text-right">WPM</span>
          <span className="text-right">Acc</span>
          <span className="text-right">Sessions</span>
          <span className="text-right">Streak</span>
        </div>

        <div className="divide-y divide-gray-50">
          {entries.length === 0 && !isLoading && (
            <div className="py-16 text-center">
              <Award size={32} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">No ranking data for this period.</p>
            </div>
          )}

          {entries.map((entry) => (
            <a
              key={entry.userId}
              href={`/admin/users/${entry.userId}`}
              className="flex sm:grid sm:grid-cols-[2rem_2.5rem_1fr_5rem_5rem_5rem_5rem_5rem] gap-3 px-4 py-3 items-center hover:bg-gray-50 transition-colors"
            >
              {/* Rank */}
              <div className="w-8 text-center flex-shrink-0">
                {entry.rank <= 3 ? (
                  <span className="text-base">{["🥇", "🥈", "🥉"][entry.rank - 1]}</span>
                ) : (
                  <span className="text-[12px] font-bold text-gray-400">#{entry.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <div className="w-9 h-9 flex-shrink-0">
                {entry.avatarUrl ? (
                  <img src={entry.avatarUrl} alt="" className="w-9 h-9 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-black"
                    style={{ background: `${getTierInfo(entry.tier).color}20`, color: getTierInfo(entry.tier).color }}
                  >
                    {entry.displayName[0]?.toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name + tier */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900 truncate">{entry.displayName}</p>
                <div className="mt-0.5">
                  <TierPill tier={entry.tier} />
                </div>
              </div>

              {/* Stats */}
              <p className="text-[13px] font-black text-[#fa4c0c] text-right">{entry.totalXp.toLocaleString()}</p>
              <p className="text-[12px] text-gray-600 text-right">{entry.avgWpm}</p>
              <p className="text-[12px] text-gray-600 text-right">{entry.avgAccuracy}%</p>
              <p className="text-[12px] text-gray-600 text-right">{entry.totalSessions}</p>
              <p className="text-[12px] text-gray-600 text-right">{entry.bestStreak}d</p>
            </a>
          ))}

          {isLoading && (
            <div className="flex justify-center py-8">
              <RefreshCw size={18} className="text-gray-300 animate-spin" />
            </div>
          )}

          {entries.length < total && !isLoading && (
            <button
              onClick={() => fetchPage(offset, false)}
              className="w-full py-3 text-[12px] font-semibold text-[#fa4c0c] hover:bg-gray-50 transition-colors"
            >
              Load more ({total - entries.length} remaining)
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
