import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserRankDetail } from "@/lib/swiftRankService";
import { CURRENT_PERIOD, getTierInfo } from "@/lib/swiftRank";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  // "me" alias resolves to the authenticated user
  const targetId = userId === "me" ? session.user.id : userId;

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || CURRENT_PERIOD();

  const { snapshot, ledger } = await getUserRankDetail(targetId, period);

  if (!snapshot) {
    return NextResponse.json(
      { error: "No rank data for this period" },
      { status: 404 },
    );
  }

  const tierInfo = getTierInfo(snapshot.tier);

  return NextResponse.json({
    period,
    snapshot: {
      ...snapshot,
      tierEmoji: tierInfo.emoji,
      tierColor: tierInfo.color,
      tierMinXp: tierInfo.minXp,
    },
    ledger,
  });
}
