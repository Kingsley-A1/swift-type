import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createGoal, getActiveGoals } from "@/lib/goalService";
import type { GoalInput } from "@/lib/goals";

function validateGoalInput(body: Partial<GoalInput>): body is GoalInput {
  return Boolean(
    body.title &&
    body.periodType &&
    body.goalType &&
    typeof body.targetValue === "number" &&
    typeof body.startedAt === "number" &&
    typeof body.endsAt === "number",
  );
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await getActiveGoals(session.user.id);
  return NextResponse.json(snapshot);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Partial<GoalInput>;
  if (!validateGoalInput(body)) {
    return NextResponse.json(
      { error: "Invalid goal payload" },
      { status: 400 },
    );
  }

  const result = await createGoal(session.user.id, body);
  return NextResponse.json({
    goalSnapshot: result.snapshot,
    rewardEvents: result.rewardEvents,
  });
}
