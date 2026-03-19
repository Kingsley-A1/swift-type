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

export function PostSessionStats({
  historicalSession,
  onClose
}: {
  historicalSession?: SessionHistory;
  onClose?: () => void;
} = {}) {
  const { isFinished, savedSessions, resetSession, keystrokes } = useTypingStore();

  const targetSession = historicalSession || savedSessions[0];

  if ((!historicalSession && !isFinished) || !targetSession) return null;

  const netWPM = targetSession.wpm;
  const accuracy = targetSession.accuracy;
  const wpmHistory = targetSession.historyData;
  const displayKeystrokes = historicalSession ? (targetSession.keystrokes || 0) : keystrokes;

  // Retrieve the session that occurred before this one for delta comparison
  const sessionIndex = savedSessions.findIndex(s => s.id === targetSession.id);
  const priorSession = sessionIndex !== -1 && sessionIndex + 1 < savedSessions.length 
      ? savedSessions[sessionIndex + 1] 
      : null;
  const prevAccuracy = priorSession?.accuracy || 0;

  const handleClose = () => {
    if (onClose) onClose();
    else resetSession();
  };

  return (
    <div className="w-full bg-white/5 p-6 rounded-2xl mb-4 border border-white/10 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <button 
        onClick={handleClose} 
        className="absolute top-4 right-4 p-1.5 text-text-muted hover:text-brand-orange hover:bg-white/10 rounded-full transition-colors z-10" 
        title="Close Stats"
      >
        <X size={20} />
      </button>
      <div className="flex justify-between items-center mb-6 pr-8">
        <div>
          <h2 className="text-3xl font-extrabold text-brand-orange">
            {netWPM}{" "}
            <span className="text-lg text-text-muted font-normal">WPM</span>
          </h2>
          <p className="text-sm text-text-muted">Net Speed</p>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-extrabold text-key-text flex items-center justify-end gap-1">
            {accuracy}%
            {priorSession && (
               <span className={accuracy >= prevAccuracy ? "text-green-500" : "text-red-500"} title={`Previous: ${prevAccuracy}%`}>
                  {accuracy >= prevAccuracy ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
               </span>
            )}
          </h2>
          <p className="text-sm text-text-muted">Accuracy</p>
        </div>
        <div className="text-right hidden sm:block">
          <h2 className="text-3xl font-extrabold text-key-text">
            {displayKeystrokes}
          </h2>
          <p className="text-sm text-text-muted">Keystrokes</p>
        </div>
      </div>

      <div className="h-64 w-full">
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
              domain={['auto', 'auto']}
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
      <div className="flex justify-center gap-4 mt-4 text-xs text-text-muted">
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
