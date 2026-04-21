import Link from "next/link";
import { AdminOverviewChart } from "@/components/admin/AdminOverviewChart";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { getAdminDashboardData } from "@/lib/adminData";

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
}

function formatHours(value: number) {
  return `${value}h`;
}

function formatDate(value: Date | null) {
  return value
    ? value.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";
}

export default async function AdminOverviewPage() {
  const dashboard = await getAdminDashboardData();

  return (
    <main className="space-y-5 pb-8">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-4xl bg-slate-950 px-5 py-6 text-white shadow-2xl sm:px-6">
          <p className="text-sm uppercase tracking-[0.24em] text-orange-300">
            Metrics-first overview
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Every core product metric, without leaving the admin surface.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Track user growth, typing quality, practice volume, goal adherence,
            review activity, Swift AI usage, and admin operational load in one
            responsive cockpit.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/api/admin/export?scope=users&format=csv"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Export users CSV
            </a>
            <a
              href="/api/admin/export?scope=audit&format=json"
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
            >
              Export audit JSON
            </a>
          </div>
        </div>

        <div className="rounded-4xl border border-white/60 bg-white/85 p-5 shadow-lg backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Current coverage
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Users</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {formatCompactNumber(dashboard.summary.totalUsers)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sessions</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {formatCompactNumber(dashboard.summary.totalTypingSessions)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Swift AI</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {formatCompactNumber(dashboard.summary.totalChatSessions)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Admins</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {formatCompactNumber(dashboard.summary.totalAdmins)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Active users / 7d"
          value={formatCompactNumber(dashboard.summary.activeUsers7d)}
          hint="Users with any recent app or content activity"
        />
        <AdminStatCard
          label="Practice volume"
          value={formatHours(dashboard.summary.totalPracticeHours)}
          hint="Accumulated typing duration across saved sessions"
        />
        <AdminStatCard
          label="Quality baseline"
          value={`${dashboard.summary.averageAccuracy}%`}
          hint={`Average accuracy at ${dashboard.summary.averageWpm} WPM`}
        />
        <AdminStatCard
          label="Active admin sessions"
          value={String(dashboard.summary.activeAdminSessions)}
          hint="Open admin sessions currently not ended"
        />
        <AdminStatCard
          label="Active goals"
          value={formatCompactNumber(dashboard.summary.activeGoals)}
          hint={`${dashboard.summary.completedGoals} goals completed historically`}
        />
        <AdminStatCard
          label="Reviews"
          value={formatCompactNumber(dashboard.summary.totalReviews)}
          hint="User testimonials and social proof submissions"
        />
        <AdminStatCard
          label="Rewards"
          value={formatCompactNumber(dashboard.summary.totalRewards)}
          hint="Earned milestones, streaks, and goal unlocks"
        />
        <AdminStatCard
          label="Swift AI chats"
          value={formatCompactNumber(dashboard.summary.totalChatSessions)}
          hint="Chat session containers tracked in product storage"
        />
      </section>

      <section className="rounded-4xl border border-white/60 bg-white/85 p-4 shadow-lg backdrop-blur sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              14-day movement
            </p>
            <p className="mt-1 text-lg font-bold text-slate-950">
              Sessions, chats, users, and practice depth over time
            </p>
          </div>
        </div>
        <AdminOverviewChart data={dashboard.trends} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-4xl border border-white/60 bg-white/85 p-4 shadow-lg backdrop-blur sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Top users
              </p>
              <p className="mt-1 text-lg font-bold text-slate-950">
                Highest practice volume
              </p>
            </div>
            <Link href="/admin/users" className="text-sm font-semibold text-slate-950">
              View all
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {dashboard.topUsers.map((user) => (
              <Link
                key={user.userId}
                href={`/admin/users/${user.userId}`}
                className="block rounded-2xl bg-slate-50 p-4 transition hover:bg-slate-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                    {Math.round(user.totalPracticeSeconds / 60)} min
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>{user.sessionsCount} sessions</span>
                  <span>{user.averageWpm} avg WPM</span>
                  <span>{user.averageAccuracy}% accuracy</span>
                  <span>{user.currentStreak} day streak</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-4xl border border-white/60 bg-white/85 p-4 shadow-lg backdrop-blur sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                User directory snapshot
              </p>
              <p className="mt-1 text-lg font-bold text-slate-950">
                Recent activity across the product graph
              </p>
            </div>
            <a
              href="/api/admin/export?scope=users&format=json"
              className="text-sm font-semibold text-slate-950"
            >
              Export JSON
            </a>
          </div>

          <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200">
            <div className="hidden grid-cols-[1.3fr_1fr_0.8fr_0.8fr_0.8fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 lg:grid">
              <span>User</span>
              <span>Last active</span>
              <span>Sessions</span>
              <span>Goals</span>
              <span>Chat</span>
            </div>
            <div className="divide-y divide-slate-200">
              {dashboard.users.slice(0, 8).map((user) => (
                <Link
                  key={user.userId}
                  href={`/admin/users/${user.userId}`}
                  className="block px-4 py-4 transition hover:bg-slate-50"
                >
                  <div className="space-y-3 lg:hidden">
                    <div>
                      <p className="font-semibold text-slate-950">{user.name}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                      <span>Last active: {formatDate(user.lastActiveAt)}</span>
                      <span>Sessions: {user.sessionsCount}</span>
                      <span>Goals done: {user.completedGoals}</span>
                      <span>Chats: {user.chatSessionsCount}</span>
                    </div>
                  </div>

                  <div className="hidden grid-cols-[1.3fr_1fr_0.8fr_0.8fr_0.8fr] gap-3 lg:grid">
                    <div>
                      <p className="font-semibold text-slate-950">{user.name}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                    <span className="text-sm text-slate-600">{formatDate(user.lastActiveAt)}</span>
                    <span className="text-sm text-slate-600">{user.sessionsCount}</span>
                    <span className="text-sm text-slate-600">
                      {user.completedGoals}/{user.activeGoals + user.completedGoals}
                    </span>
                    <span className="text-sm text-slate-600">{user.chatSessionsCount}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}