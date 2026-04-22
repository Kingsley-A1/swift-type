import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { getAdminAuditTrail } from "@/lib/adminData";

function formatDate(value: Date) {
  return value.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(durationMs: number | null) {
  if (!durationMs) {
    return "—";
  }

  const seconds = Math.round(durationMs / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.round(seconds / 60);
  return `${minutes}m`;
}

export default async function AdminAuditPage() {
  const entries = await getAdminAuditTrail(200);
  const adminEntries = entries.filter((entry) => entry.actorType === "admin");
  const userEntries = entries.filter((entry) => entry.actorType === "user");

  return (
    <main className="space-y-6 pb-8">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
            Audit
          </p>
          <h1 className="mt-1 text-xl font-black tracking-tight text-gray-900">
            Audit Trail
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/admin/export?scope=audit&format=csv"
            className="h-8 rounded-lg border border-gray-200 bg-white px-3 text-[12px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center"
          >
            Export CSV
          </a>
          <a
            href="/api/admin/export?scope=audit&format=json"
            className="h-8 rounded-lg bg-[#ff6b35] px-3 text-[12px] font-semibold text-white hover:opacity-90 transition-opacity flex items-center"
          >
            Export JSON
          </a>
        </div>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AdminStatCard
          label="Audit rows"
          value={String(entries.length)}
          hint="Combined admin and user activity events"
        />
        <AdminStatCard
          label="Admin actions"
          value={String(adminEntries.length)}
          hint="Exports, sign-ins, sign-outs, drill-downs"
        />
        <AdminStatCard
          label="User actions"
          value={String(userEntries.length)}
          hint="Typing, goals, reviews, rewards, Swift AI"
        />
        <AdminStatCard
          label="Export"
          value="CSV / JSON"
          hint="Download the full audit ledger"
        />
      </section>

      {/* Audit log */}
      <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.6fr] gap-3 bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 lg:grid">
          <span>Actor / Action</span>
          <span>Entity</span>
          <span>Occurred</span>
          <span>Duration</span>
          <span>Type</span>
        </div>

        <div className="divide-y divide-gray-100">
          {entries.map((entry) => (
            <div key={entry.id} className="px-5 py-4">
              {/* Mobile */}
              <div className="lg:hidden space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={[
                      "inline-block h-1.5 w-1.5 rounded-full shrink-0",
                      entry.actorType === "admin"
                        ? "bg-[#ff6b35]"
                        : "bg-gray-300",
                    ].join(" ")}
                  />
                  <p className="text-[13px] font-semibold text-gray-900">
                    {entry.action}
                  </p>
                </div>
                <p className="text-[11px] text-gray-400">
                  {entry.actorName}
                  {entry.actorEmail ? ` · ${entry.actorEmail}` : ""}
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[12px] text-gray-500">
                  <span>Entity: {entry.entityType}</span>
                  <span>{formatDate(entry.occurredAt)}</span>
                  <span>Duration: {formatDuration(entry.durationMs)}</span>
                </div>
              </div>

              {/* Desktop */}
              <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.6fr] gap-3 items-start lg:grid">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">
                    {entry.action}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {entry.actorName}
                    {entry.actorEmail ? ` · ${entry.actorEmail}` : ""}
                  </p>
                </div>
                <span className="text-[13px] text-gray-500 truncate">
                  {entry.entityType}
                  {entry.entityId ? ` · ${entry.entityId.slice(0, 8)}…` : ""}
                </span>
                <span className="text-[13px] text-gray-500">
                  {formatDate(entry.occurredAt)}
                </span>
                <span className="text-[13px] text-gray-500">
                  {formatDuration(entry.durationMs)}
                </span>
                <span
                  className={[
                    "inline-flex items-center gap-1 text-[11px] font-semibold",
                    entry.actorType === "admin"
                      ? "text-[#ff6b35]"
                      : "text-gray-400",
                  ].join(" ")}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {entry.actorType}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
