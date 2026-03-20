import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";

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
    return NextResponse.json({ ok: true, skipped: true });
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

  return NextResponse.json({ ok: true });
}
