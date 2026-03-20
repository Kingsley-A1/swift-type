import type { SessionHistory } from "@/store/useTypingStore";
import { useTypingStore } from "@/store/useTypingStore";

export async function syncSessionToServer(session: SessionHistory) {
  try {
    await fetch("/api/sync/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    });
  } catch {
    // Silently fail — localStorage is the source of truth
  }
}

export async function syncStatsToServer() {
  const { perKeyStats, nGramStats } = useTypingStore.getState();
  try {
    await fetch("/api/sync/stats", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ perKeyStats, nGramStats }),
    });
  } catch {
    // Silently fail
  }
}

export async function mergeLocalDataToServer() {
  const { savedSessions, perKeyStats, nGramStats } = useTypingStore.getState();
  if (savedSessions.length === 0 && Object.keys(perKeyStats).length === 0)
    return;

  try {
    await fetch("/api/sync/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savedSessions, perKeyStats, nGramStats }),
    });
  } catch {
    // Silently fail
  }
}
