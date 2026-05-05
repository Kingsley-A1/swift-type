import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { grantMonthlyRankRewards } from "@/lib/swiftRankRewards";

/**
 * POST /api/admin/rank/grant-rewards?period=2026-05
 * Manually trigger monthly reward grant for a given period.
 * Admin-only. Safe to call multiple times (idempotent).
 */
export async function POST(req: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period");
  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    return NextResponse.json(
      { error: "Invalid or missing period (expected YYYY-MM)" },
      { status: 400 },
    );
  }

  const result = await grantMonthlyRankRewards(period);
  return NextResponse.json({ ok: true, ...result });
}
