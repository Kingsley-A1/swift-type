import { NextResponse } from "next/server";
import {
  authenticateAdmin,
  createAdminSession,
  setAdminSessionCookie,
} from "@/lib/adminAuth";
import { recordAdminAudit } from "@/lib/adminAudit";

function getClientInfo(request: Request) {
  return {
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null,
    userAgent: request.headers.get("user-agent") || null,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const admin = await authenticateAdmin(
      String(body.email ?? ""),
      String(body.code ?? ""),
    );

    if (!admin) {
      return NextResponse.json(
        { message: "Unknown admin account for this email" },
        { status: 404 },
      );
    }

    const token = await createAdminSession(admin.id, getClientInfo(request));
    await setAdminSessionCookie(token);
    await recordAdminAudit({
      adminUserId: admin.id,
      action: "admin.logged_in",
      entityType: "admin_session",
      request,
      metadata: { email: admin.email },
    });

    return NextResponse.json({ ok: true, adminId: admin.id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sign in";
    return NextResponse.json({ message }, { status: 400 });
  }
}
