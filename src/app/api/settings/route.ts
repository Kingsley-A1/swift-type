import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { swiftRankSnapshots } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { isAnonymous } = body;

    if (typeof isAnonymous === "boolean") {
      await db
        .update(swiftRankSnapshots)
        .set({ isAnonymous })
        .where(eq(swiftRankSnapshots.userId, session.user.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
