import type { ReactNode } from "react";
import { useTypingStore, SessionHistory } from "@/store/useTypingStore";
import { X, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function formatSessionTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export function PostSessionStats({
  historicalSession,
  onClose,
}: {
  historicalSession?: SessionHistory;
  onClose?: () => void;
} = {}) {
  const { isFinished, savedSessions, resetSession, keystrokes } =
    useTypingStore();

  const targetSession = historicalSession || savedSessions[0];

  if ((!historicalSession && !isFinished) || !targetSession) return null;

  const netWPM = targetSession.wpm;
  const accuracy = targetSession.accuracy;
  const wpmHistory = targetSession.historyData;
  const displayKeystrokes = historicalSession
    ? targetSession.keystrokes || 0
    : keystrokes;
  const displayDuration = targetSession.duration || 0;
  const displayErrors = Math.max(
    0,
    Math.round(displayKeystrokes - (accuracy * displayKeystrokes) / 100),
  );

  // Retrieve the session that occurred before this one for delta comparison
  const sessionIndex = savedSessions.findIndex(
    (s) => s.id === targetSession.id,
  );
  const priorSession =
    sessionIndex !== -1 && sessionIndex + 1 < savedSessions.length
      ? savedSessions[sessionIndex + 1]
      : null;
  const prevAccuracy = priorSession?.accuracy || 0;

  const handleClose = () => {
    if (onClose) onClose();
    else resetSession();
  };

  return (
    <div className="relative mb-4 w-full overflow-hidden rounded-[28px] border border-gray-200/70 bg-white/88 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500 dark:border-white/10 dark:bg-white/4 dark:shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,107,53,0.12),transparent_72%)]" />
      <button
        onClick={handleClose}
        className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white/80 text-gray-400 transition-colors hover:text-brand-orange hover:bg-white dark:border-white/10 dark:bg-white/5"
        title="Close Stats"
      >
        <X size={20} />
      </button>
      <div className="mb-6 pr-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">
          Session Summary
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Net Speed"
            value={`${netWPM} WPM`}
            accent="text-brand-orange"
          />
          <StatCard
            label="Accuracy"
            value={`${accuracy}%`}
            accent="text-gray-950 dark:text-white"
            indicator={
              priorSession ? (
                <span
                  className={
                    accuracy >= prevAccuracy ? "text-green-500" : "text-red-500"
                  }
                  title={`Previous: ${prevAccuracy}%`}
                >
                  {accuracy >= prevAccuracy ? (
                    <ArrowUpRight size={18} />
                  ) : (
                    <ArrowDownRight size={18} />
                  )}
                </span>
              ) : undefined
            }
          />
          <StatCard
            label="Keystrokes"
            value={String(displayKeystrokes)}
            accent="text-gray-950 dark:text-white"
          />
          <StatCard
            label="Time"
            value={formatSessionTime(displayDuration)}
            accent="text-gray-950 dark:text-white"
          />
          <StatCard
            label="Errors"
            value={String(displayErrors)}
            accent="text-red-500"
          />
        </div>
      </div>

      <div className="h-64 w-full rounded-3xl border border-gray-200/70 bg-white/60 p-3 dark:border-white/8 dark:bg-black/10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={wpmHistory}
            margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
              vertical={false}
            />
            <XAxis
              dataKey="second"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
              }}
              itemStyle={{ color: "#ff6b35" }}
            />
            <Line
              type="monotone"
              dataKey="wpm"
              stroke="#ff6b35"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: "#ff6b35" }}
            />
            <Line
              type="monotone"
              dataKey="raw"
              stroke="#64748b"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-brand-orange"></div> Net WPM
        </span>
        <span className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-text-muted border border-dashed border-gray-400"></div>{" "}
          Raw WPM
        </span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  indicator,
}: {
  label: string;
  value: string;
  accent?: string;
  indicator?: ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-gray-200/70 bg-white/72 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:border-white/8 dark:bg-white/3 dark:shadow-none">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
          {label}
        </p>
        {indicator}
      </div>
      <p
        className={`mt-3 text-3xl font-extrabold ${accent ?? "text-gray-950 dark:text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}
