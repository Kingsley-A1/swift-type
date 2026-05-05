import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLeaderboard, getUserSnapshot } from "@/lib/swiftRankService";
import { CURRENT_PERIOD } from "@/lib/swiftRank";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || CURRENT_PERIOD();
  const limit = Math.min(Number(searchParams.get("limit") || "50"), 100);
  const offset = Math.max(Number(searchParams.get("offset") || "0"), 0);

  const session = await auth();
  const userId = session?.user?.id ?? null;

  const [{ entries, total }, mySnapshot] = await Promise.all([
    getLeaderboard(period, limit, offset),
    userId ? getUserSnapshot(userId, period) : null,
  ]);

  return NextResponse.json({
    period,
    total,
    mySnapshot: mySnapshot
      ? {
          rank: mySnapshot.rank,
          tier: mySnapshot.tier,
          totalXp: mySnapshot.totalXp,
          avgWpm: Math.round(mySnapshot.avgWpm),
          avgAccuracy: Math.round(mySnapshot.avgAccuracy),
          totalSessions: mySnapshot.totalSessions,
          totalPracticeMinutes: Math.round(mySnapshot.totalPracticeMinutes),
          bestStreak: mySnapshot.bestStreak,
        }
      : null,
    entries,
  });
}
