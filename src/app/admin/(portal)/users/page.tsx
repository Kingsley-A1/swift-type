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
    <main className="space-y-6 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
            Users
          </p>
          <h1 className="mt-1 text-xl font-black tracking-tight text-gray-900">
            User Index
          </h1>
        </div>
        <a
          href="/api/admin/export?scope=users&format=csv"
          className="h-8 rounded-lg bg-[#ff6b35] px-3 text-[12px] font-semibold text-white hover:opacity-90 transition-opacity flex items-center self-start sm:self-auto"
        >
          Export CSV
        </a>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AdminStatCard
          label="Total users"
          value={String(dashboard.summary.totalUsers)}
          hint="Registered Swift Type accounts"
        />
        <AdminStatCard
          label="Active 7d"
          value={String(dashboard.summary.activeUsers7d)}
          hint="Users with recent product activity"
        />
        <AdminStatCard
          label="Typing sessions"
          value={String(dashboard.summary.totalTypingSessions)}
          hint="Saved sessions in persistent storage"
        />
        <AdminStatCard
          label="Swift AI sessions"
          value={String(dashboard.summary.totalChatSessions)}
          hint="Chat containers linked to users"
        />
      </section>

      <section className="bg-white rounded-xl border border-[#ff6b35]/15 overflow-hidden">
        <div className="hidden grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.9fr] gap-3 bg-[#fff7f3] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 lg:grid">
          <span>User</span>
          <span>Last active</span>
          <span>Sessions</span>
          <span>Quality</span>
          <span>Engagement</span>
        </div>
        <div className="divide-y divide-gray-100">
          {dashboard.users.map((user) => (
            <Link
              key={user.userId}
              href={`/admin/users/${user.userId}`}
              className="block px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="lg:hidden space-y-2">
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-gray-400">{user.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[12px] text-gray-500">
                  <span>Last active: {formatDate(user.lastActiveAt)}</span>
                  <span>{user.sessionsCount} sessions</span>
                  <span>
                    {user.averageWpm} WPM / {user.averageAccuracy}%
                  </span>
                  <span>
                    {Math.round(user.totalPracticeSeconds / 60)} min &middot;{" "}
                    {user.chatSessionsCount} chats
                  </span>
                </div>
              </div>
              <div className="hidden grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.9fr] gap-3 items-center lg:grid">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
                <span className="text-[13px] text-gray-500">
                  {formatDate(user.lastActiveAt)}
                </span>
                <span className="text-[13px] text-gray-500">
                  {user.sessionsCount}
                </span>
                <span className="text-[13px] text-gray-500">
                  {user.averageWpm} WPM / {user.averageAccuracy}%
                </span>
                <span className="text-[13px] text-gray-500">
                  {Math.round(user.totalPracticeSeconds / 60)} min &middot;{" "}
                  {user.chatSessionsCount} chats
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
