import { NextResponse } from "next/server";
import { getAdminSession, touchAdminSession } from "@/lib/adminAuth";
import {
  getAdminAuditTrail,
  getAdminDashboardData,
  getAdminUserDetail,
} from "@/lib/adminData";
import { recordAdminAudit } from "@/lib/adminAudit";

function toCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Array.from(
    rows.reduce((set, row) => {
      for (const key of Object.keys(row)) {
        set.add(key);
      }
      return set;
    }, new Set<string>()),
  );

  const escape = (value: unknown) => {
    const text =
      value instanceof Date
        ? value.toISOString()
        : typeof value === "object" && value !== null
          ? JSON.stringify(value)
          : String(value ?? "");

    return `"${text.replaceAll('"', '""')}"`;
  };

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escape(row[header])).join(","));
  }

  return lines.join("\n");
}

export async function GET(request: Request) {
  const admin = await getAdminSession();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await touchAdminSession(admin.sessionId);

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "users";
  const format = searchParams.get("format") ?? "json";
  const userId = searchParams.get("userId");

  let payload: unknown;
  let filename = `${scope}-export`;

  if (scope === "audit") {
    payload = await getAdminAuditTrail();
  } else if (scope === "user" && userId) {
    payload = await getAdminUserDetail(userId);
    filename = `user-${userId}`;
  } else {
    const dashboard = await getAdminDashboardData();
    payload = dashboard.users;
  }

  await recordAdminAudit({
    adminUserId: admin.adminId,
    action: "admin.exported_data",
    entityType: "export",
    request,
    metadata: { scope, format, userId },
  });

  if (format === "csv") {
    if (!Array.isArray(payload)) {
      return NextResponse.json(
        { message: "CSV export is supported for tabular scopes only" },
        { status: 400 },
      );
    }

    return new NextResponse(toCsv(payload as Array<Record<string, unknown>>), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.json"`,
    },
  });
}