import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { patchGoal } from "@/lib/goalService";
import type { GoalRecord } from "@/lib/goals";

type GoalPatchInput = Partial<
  Pick<
    GoalRecord,
    "currentValue" | "currentSessions" | "status" | "completedAt"
  >
>;

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await req.json()) as GoalPatchInput;
  const result = await patchGoal(session.user.id, id, body);

  if (!result) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  return NextResponse.json({
    goalSnapshot: result.snapshot,
    rewardEvents: result.rewardEvents,
  });
}
