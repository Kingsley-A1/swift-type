import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userGoals } from "@/db/schema";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { getActiveGoals } from "@/lib/goalService";
import { getRecentRewards } from "@/lib/rewardService";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const [goalSnapshot, rewards, completions] = await Promise.all([
    getActiveGoals(userId),
    getRecentRewards(userId, 30),
    db
      .select({
        id: userGoals.id,
        title: userGoals.title,
        periodType: userGoals.periodType,
        completedAt: userGoals.completedAt,
      })
      .from(userGoals)
      .where(
        and(
          eq(userGoals.userId, userId),
          eq(userGoals.status, "completed"),
          isNotNull(userGoals.completedAt),
        ),
      )
      .orderBy(desc(userGoals.completedAt))
      .limit(8),
  ]);

  return NextResponse.json({
    rewards,
    recentGoalCompletions: completions.map((item) => ({
      id: item.id,
      title: item.title,
      periodType: item.periodType,
      completedAt: item.completedAt ? item.completedAt.getTime() : null,
    })),
    streakSummary: goalSnapshot.streak,
  });
}
