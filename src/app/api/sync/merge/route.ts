import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { sessions, userStats } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getActiveGoals,
  updateGoalProgressFromSession,
} from "@/lib/goalService";
import type { RewardRecord } from "@/lib/rewards";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { savedSessions, perKeyStats, nGramStats } = await req.json();

  type SyncSessionInput = {
    id: string;
    date: number;
    wpm: number;
    accuracy: number;
    mode: string;
    duration: number;
    keystrokes: number;
    historyData?: Array<{ second: number; wpm: number; raw: number }>;
  };

  // Get existing session IDs to avoid duplicates
  const existingRows = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(eq(sessions.userId, userId));
  const existingIds = new Set(existingRows.map((r) => r.id));

  // Insert only new sessions
  const newSessions = ((savedSessions ?? []) as SyncSessionInput[]).filter(
    (s) => !existingIds.has(s.id),
  );

  const sortedSessions = [...newSessions].sort(
    (left, right) => left.date - right.date,
  );

  if (sortedSessions.length > 0) {
    await db.insert(sessions).values(
      sortedSessions.map((s) => ({
        id: s.id,
        userId,
        date: new Date(s.date),
        wpm: s.wpm,
        accuracy: s.accuracy,
        mode: s.mode,
        duration: s.duration,
        keystrokes: s.keystrokes,
        historyData: s.historyData,
      })),
    );
  }

  // Upsert stats
  if (perKeyStats || nGramStats) {
    await db
      .insert(userStats)
      .values({
        userId,
        perKeyStats: perKeyStats ?? {},
        nGramStats: nGramStats ?? {},
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userStats.userId,
        set: {
          perKeyStats: perKeyStats ?? {},
          nGramStats: nGramStats ?? {},
          updatedAt: new Date(),
        },
      });
  }

  let goalSnapshot = await getActiveGoals(userId);
  const rewardEvents: RewardRecord[] = [];
  for (const sessionRow of sortedSessions) {
    const result = await updateGoalProgressFromSession(userId, {
      date: Number(sessionRow.date),
      wpm: Number(sessionRow.wpm),
      accuracy: Number(sessionRow.accuracy),
      duration: Number(sessionRow.duration),
    });

    goalSnapshot = result.snapshot;
    if (result.rewardEvents.length > 0) {
      rewardEvents.push(...result.rewardEvents);
    }
  }

  return NextResponse.json({
    ok: true,
    merged: sortedSessions.length,
    goalSnapshot,
    rewardEvents,
  });
}
