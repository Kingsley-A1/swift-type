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
    return "N/A";
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
    <main className="space-y-5 pb-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Audit rows"
          value={String(entries.length)}
          hint="Combined admin and user activity events"
        />
        <AdminStatCard
          label="Admin actions"
          value={String(adminEntries.length)}
          hint="Exports, sign-ins, sign-outs, and admin drill-downs"
        />
        <AdminStatCard
          label="User actions"
          value={String(userEntries.length)}
          hint="Typing, goals, reviews, rewards, and Swift AI activity"
        />
        <AdminStatCard
          label="Export"
          value="CSV / JSON"
          hint="Pull the latest audit ledger for offline analysis"
        />
      </section>

      <section className="rounded-4xl border border-white/60 bg-white/85 p-4 shadow-lg backdrop-blur sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Full audit trail
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              Who did what, when it happened, and how long it lasted.
            </h1>
          </div>
          <div className="flex gap-3">
            <a
              href="/api/admin/export?scope=audit&format=csv"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Export CSV
            </a>
            <a
              href="/api/admin/export?scope=audit&format=json"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Export JSON
            </a>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                      {entry.actorType}
                    </span>
                    <p className="font-semibold text-slate-950">{entry.action}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {entry.actorName}
                    {entry.actorEmail ? ` · ${entry.actorEmail}` : ""}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 lg:min-w-md lg:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Entity</p>
                    <p className="mt-1 font-semibold text-slate-950">{entry.entityType}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Occurred</p>
                    <p className="mt-1 font-semibold text-slate-950">{formatDate(entry.occurredAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Duration</p>
                    <p className="mt-1 font-semibold text-slate-950">{formatDuration(entry.durationMs)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}