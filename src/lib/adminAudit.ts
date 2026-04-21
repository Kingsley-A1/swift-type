import { db } from "@/db";
import { adminAuditLogs } from "@/db/schema";
import { withAdminTables } from "@/lib/ensureAdminTables";

interface RecordAdminAuditInput {
  adminUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  durationMs?: number | null;
  metadata?: Record<string, unknown>;
  request?: Request;
}

function getClientInfo(request?: Request) {
  if (!request) {
    return {
      ipAddress: null,
      userAgent: null,
    };
  }

  return {
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null,
    userAgent: request.headers.get("user-agent") || null,
  };
}

export async function recordAdminAudit(input: RecordAdminAuditInput) {
  const clientInfo = getClientInfo(input.request);

  return withAdminTables(async () => {
    await db.insert(adminAuditLogs).values({
      id: crypto.randomUUID(),
      adminUserId: input.adminUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      durationMs: input.durationMs ?? null,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      metadata: input.metadata ?? {},
      createdAt: new Date(),
    });
  });
}