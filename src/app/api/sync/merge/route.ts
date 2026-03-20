import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { sessions, userStats } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { savedSessions, perKeyStats, nGramStats } = await req.json();

  // Get existing session IDs to avoid duplicates
  const existingRows = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(eq(sessions.userId, userId));
  const existingIds = new Set(existingRows.map((r) => r.id));

  // Insert only new sessions
  const newSessions = (savedSessions ?? []).filter(
    (s: { id: string }) => !existingIds.has(s.id),
  );

  if (newSessions.length > 0) {
    await db.insert(sessions).values(
      newSessions.map(
        (s: {
          id: string;
          date: number;
          wpm: number;
          accuracy: number;
          mode: string;
          duration: number;
          keystrokes: number;
          historyData: unknown;
        }) => ({
          id: s.id,
          userId,
          date: new Date(s.date),
          wpm: s.wpm,
          accuracy: s.accuracy,
          mode: s.mode,
          duration: s.duration,
          keystrokes: s.keystrokes,
          historyData: s.historyData,
        }),
      ),
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

  return NextResponse.json({ ok: true, merged: newSessions.length });
}
