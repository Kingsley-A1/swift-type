import { useTypingStore } from "@/store/useTypingStore";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export function LiveStats() {
  const { isActive, isFinished, timeLeft, tick, keystrokes, mistakes, startTime, duration, mode, savedSessions } =
    useTypingStore();

  const prevSession = savedSessions[0];
  const prevAccuracy = prevSession?.accuracy || 0;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive) {
      timer = setInterval(tick, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, tick]);

  const timeElapsedMin = startTime ? (Date.now() - startTime) / 1000 / 60 : 0;
  const rawWPM = timeElapsedMin > 0 ? keystrokes / 5 / timeElapsedMin : 0;
  const netWPM = timeElapsedMin > 0 ? Math.max(0, Math.round(((keystrokes - mistakes) / 5) / timeElapsedMin)) : 0;
  const accuracy = keystrokes > 0 ? Math.round(((keystrokes - mistakes) / keystrokes) * 100) : 0;

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const progress = mode === "timed" ? ((duration - timeLeft) / duration) * 100 : 0;
  const isLastTen = mode === "timed" && timeLeft <= 10 && isActive;

  return (
    <div className="mb-2">
      {/* Timed progress bar */}
      {mode === "timed" && (
        <div className="w-full h-[2px] bg-gray-100 dark:bg-white/8 rounded-full overflow-hidden mb-2">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: isLastTen
                ? "linear-gradient(90deg, #ef4444, #ff6b35)"
                : "linear-gradient(90deg, #ff6b35, #ffa040)",
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "linear" }}
          />
        </div>
      )}

      {/* Stats */}
      <div className="flex justify-center gap-10 py-2 border-y border-gray-100 dark:border-white/6">
        {[
          {
            label: "TIMER",
            value: formatTime(timeLeft),
            highlight: isLastTen,
            mono: true,
            size: "text-xl",
          },
          {
            label: "WPM",
            value: (isActive || isFinished) ? String(netWPM) : "—",
            highlight: false,
            orange: true,
            mono: true,
            size: "text-xl",
          },
          {
            label: "ACCURACY",
            value: (
              <span className="flex items-center justify-center gap-1">
                {(isActive || isFinished) ? `${accuracy}%` : "—"}
                {(isActive || isFinished) && prevSession && (
                  <span className={accuracy >= prevAccuracy ? "text-green-500" : "text-red-500"} title={`Previous: ${prevAccuracy}%`}>
                    {accuracy >= prevAccuracy ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  </span>
                )}
              </span>
            ),
            highlight: accuracy < 80 && isActive,
            mono: true,
            size: "text-xl",
          },
          {
            label: "ERRORS",
            value: (isActive || isFinished) ? String(mistakes) : "—",
            highlight: false,
            red: true,
            mono: true,
            size: "text-xl",
          },
        ].map(({ label, value, highlight, orange, red, mono, size }) => (
          <div key={label} className="text-center">
            <span className="text-[9px] font-bold tracking-widest text-gray-400 block mb-0.5">
              {label}
            </span>
            <span
              className={[
                size,
                "font-bold block leading-none",
                mono ? "font-mono" : "",
                orange ? "text-brand-orange" : "",
                red ? "text-red-500" : "",
                highlight && !orange && !red ? "text-red-500" : "",
                !orange && !red && !highlight ? "text-gray-800 dark:text-gray-100" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
