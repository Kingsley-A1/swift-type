import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userStats } from "@/db/schema";

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { perKeyStats, nGramStats } = await req.json();

  await db
    .insert(userStats)
    .values({
      userId: session.user.id,
      perKeyStats,
      nGramStats,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userStats.userId,
      set: { perKeyStats, nGramStats, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}
