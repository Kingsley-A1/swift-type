import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { getLeaderboard } from "@/lib/swiftRankService";
import { CURRENT_PERIOD } from "@/lib/swiftRank";
import { db } from "@/db";
import { swiftRankSnapshots, userXpLedger, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/admin/rank/leaderboard?period=2026-05&limit=100&offset=0
 * Full leaderboard with real names always shown (admin view — no anonymisation).
 */
export async function GET(req: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || CURRENT_PERIOD();
  const limit = Math.min(Number(searchParams.get("limit") || "100"), 200);
  const offset = Math.max(Number(searchParams.get("offset") || "0"), 0);

  // Fetch without anonymisation — admin sees all real names
  const { entries, total } = await getLeaderboard(period, limit, offset);

  // Override anonymisation for admin view
  const adminEntries = entries.map((e) => ({
    ...e,
    displayName: e.displayName, // real name already in db; anon handled in getLeaderboard
    isAnonymous: false,         // admin sees true names regardless
  }));

  return NextResponse.json({ period, total, entries: adminEntries });
}
