import Link from "next/link";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { getAdminDashboardData } from "@/lib/adminData";

function formatDate(value: Date | null) {
  return value
    ? value.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";
}

export default async function AdminUsersPage() {
  const dashboard = await getAdminDashboardData();

  return (
    <main className="space-y-5 pb-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Total users"
          value={String(dashboard.summary.totalUsers)}
          hint="Registered Swift Type accounts"
        />
        <AdminStatCard
          label="Active users / 7d"
          value={String(dashboard.summary.activeUsers7d)}
          hint="Users with current product activity"
        />
        <AdminStatCard
          label="Total sessions"
          value={String(dashboard.summary.totalTypingSessions)}
          hint="Saved typing sessions in persistent storage"
        />
        <AdminStatCard
          label="Swift AI sessions"
          value={String(dashboard.summary.totalChatSessions)}
          hint="Chat containers linked to authenticated users"
        />
      </section>

      <section className="rounded-4xl border border-white/60 bg-white/85 p-4 shadow-lg backdrop-blur sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              User index
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              Drill into any user’s sessions, goals, chats, streaks, and reviews.
            </h1>
          </div>
          <a
            href="/api/admin/export?scope=users&format=csv"
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Export users CSV
          </a>
        </div>

        <div className="mt-4 grid gap-3">
          {dashboard.users.map((user) => (
            <Link
              key={user.userId}
              href={`/admin/users/${user.userId}`}
              className="rounded-3xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-bold text-slate-950">{user.name}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 sm:grid-cols-4 lg:min-w-lg">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Last active</p>
                    <p className="mt-1 font-semibold text-slate-950">{formatDate(user.lastActiveAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Sessions</p>
                    <p className="mt-1 font-semibold text-slate-950">{user.sessionsCount}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Avg quality</p>
                    <p className="mt-1 font-semibold text-slate-950">
                      {user.averageWpm} WPM / {user.averageAccuracy}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Engagement</p>
                    <p className="mt-1 font-semibold text-slate-950">
                      {Math.round(user.totalPracticeSeconds / 60)} min, {user.chatSessionsCount} chats
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}