import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getActiveGoals,
  updateGoalProgressFromSession,
} from "@/lib/goalService";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();

  // Check if session already exists (dedup by id)
  const existing = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(eq(sessions.id, data.id))
    .limit(1);
  if (existing.length > 0) {
    const goalSnapshot = await getActiveGoals(session.user.id);
    return NextResponse.json({
      ok: true,
      skipped: true,
      goalSnapshot,
      rewardEvents: [],
    });
  }

  await db.insert(sessions).values({
    id: data.id,
    userId: session.user.id,
    date: new Date(data.date),
    wpm: data.wpm,
    accuracy: data.accuracy,
    mode: data.mode,
    duration: data.duration,
    keystrokes: data.keystrokes,
    historyData: data.historyData,
  });

  const result = await updateGoalProgressFromSession(session.user.id, {
    date: Number(new Date(data.date).getTime()),
    wpm: Number(data.wpm),
    accuracy: Number(data.accuracy),
    duration: Number(data.duration),
  });

  return NextResponse.json({
    ok: true,
    goalSnapshot: result.snapshot,
    rewardEvents: result.rewardEvents,
  });
}
