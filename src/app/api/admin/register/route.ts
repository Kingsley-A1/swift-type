import { NextResponse } from "next/server";
import { createAdminSession, registerAdmin, setAdminSessionCookie } from "@/lib/adminAuth";
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
    const admin = await registerAdmin({
      name: String(body.name ?? ""),
      email: String(body.email ?? ""),
      registrationPassword: String(body.registrationPassword ?? ""),
    });

    const token = await createAdminSession(admin.id, getClientInfo(request));
    await setAdminSessionCookie(token);
    await recordAdminAudit({
      adminUserId: admin.id,
      action: "admin.registered",
      entityType: "admin_user",
      entityId: admin.id,
      request,
      metadata: { email: admin.email },
    });

    return NextResponse.json({ ok: true, adminId: admin.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to register admin";
    return NextResponse.json({ message }, { status: 400 });
  }
}