import { NextResponse } from "next/server";
import {
  clearAdminSessionCookie,
  endAdminSession,
  getAdminSession,
} from "@/lib/adminAuth";
import { recordAdminAudit } from "@/lib/adminAudit";

export async function POST(request: Request) {
  const admin = await getAdminSession();

  if (admin) {
    await endAdminSession(admin.sessionId);
    await recordAdminAudit({
      adminUserId: admin.adminId,
      action: "admin.logged_out",
      entityType: "admin_session",
      entityId: admin.sessionId,
      request,
    });
  }

  await clearAdminSessionCookie();
  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}
