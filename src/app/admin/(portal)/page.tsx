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
  const { summary } = dashboard;

  return (
    <main className="space-y-6 pb-8">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
            Dashboard
          </p>
          <h1 className="mt-1 text-xl font-black tracking-tight text-gray-900">
            Overview
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/admin/export?scope=users&format=csv"
            className="h-8 rounded-lg border border-gray-200 bg-white px-3 text-[12px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center"
          >
            Export users CSV
          </a>
          <a
            href="/api/admin/export?scope=audit&format=json"
            className="h-8 rounded-lg bg-[#ff6b35] px-3 text-[12px] font-semibold text-white hover:opacity-90 transition-opacity flex items-center"
          >
            Export audit JSON
          </a>
        </div>
      </div>

      {/* Primary stats row */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Users
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-gray-900">
            {formatCompactNumber(summary.totalUsers)}
          </p>
          <p className="mt-1 text-[12px] text-gray-400">
            {summary.activeUsers7d} active this week
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Sessions
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-gray-900">
            {formatCompactNumber(summary.totalTypingSessions)}
          </p>
          <p className="mt-1 text-[12px] text-gray-400">
            {formatHours(summary.totalPracticeHours)} practice time
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Swift AI
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-gray-900">
            {formatCompactNumber(summary.totalChatSessions)}
          </p>
          <p className="mt-1 text-[12px] text-gray-400">
            {summary.totalAIFeedbackUp} helpful responses
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Reviews
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-gray-900">
            {formatCompactNumber(summary.totalReviews)}
          </p>
          <p className="mt-1 text-[12px] text-gray-400">
            User testimonials
          </p>
        </div>
      </section>

      {/* Detailed stat cards */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Quality baseline"
          value={`${summary.averageWpm} WPM`}
          hint={`${summary.averageAccuracy}% avg accuracy across all sessions`}
        />
        <AdminStatCard
          label="Active goals"
          value={formatCompactNumber(summary.activeGoals)}
          hint={`${summary.completedGoals} completed goals total`}
        />
        <AdminStatCard
          label="Rewards earned"
          value={formatCompactNumber(summary.totalRewards)}
          hint="Milestones, streaks, and goal unlocks"
        />
        <AdminStatCard
          label="AI response feedback"
          value={`${summary.totalAIFeedbackUp} up`}
          hint={`${summary.totalAIFeedbackDown} marked not helpful`}
        />
        <AdminStatCard
          label="Active admin sessions"
          value={String(summary.activeAdminSessions)}
          hint={`${summary.totalAdmins} registered admins`}
        />
        <AdminStatCard
          label="Practice depth"
          value={formatHours(summary.totalPracticeHours)}
          hint="Cumulative typing duration saved"
        />
        <AdminStatCard
          label="Goals in progress"
          value={formatCompactNumber(summary.activeGoals)}
          hint="Users actively working toward a goal"
        />
        <AdminStatCard
          label="Completion rate"
          value={
            summary.activeGoals + summary.completedGoals > 0
              ? `${Math.round((summary.completedGoals / (summary.activeGoals + summary.completedGoals)) * 100)}%`
              : "—"
          }
          hint="Goals completed vs total created"
        />
      </section>

      {/* Trends chart */}
      <section className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            14-day trends
          </p>
          <p className="mt-1 text-base font-bold text-gray-900">
            Sessions, chats, users, and practice over time
          </p>
        </div>
        <AdminOverviewChart data={dashboard.trends} />
      </section>

      {/* Top users + Recent reviews */}
      <section className="grid gap-4 xl:grid-cols-2">
        {/* Top users */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Top users
              </p>
              <p className="mt-1 text-sm font-bold text-gray-900">
                Highest practice volume
              </p>
            </div>
            <Link
              href="/admin/users"
              className="text-[12px] font-semibold text-[#ff6b35] hover:opacity-80 transition-opacity"
            >
              View all
            </Link>
          </div>

          <div className="space-y-2">
            {dashboard.topUsers.map((user) => (
              <Link
                key={user.userId}
                href={`/admin/users/${user.userId}`}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
                <div className="ml-3 shrink-0 text-right">
                  <p className="text-[12px] font-semibold text-gray-700">
                    {Math.round(user.totalPracticeSeconds / 60)} min
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {user.averageWpm} WPM
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent reviews */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Recent reviews
            </p>
            <p className="mt-1 text-sm font-bold text-gray-900">
              Latest user testimonials
            </p>
          </div>

          {dashboard.recentReviews.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No reviews submitted yet.
            </p>
          ) : (
            <div className="space-y-3">
              {dashboard.recentReviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900">
                        {review.userName}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {review.role}
                        {review.organisation ? ` · ${review.organisation}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-gray-400">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-[12px] text-gray-600 leading-5 line-clamp-2">
                    {review.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* User directory snapshot */}
      <section className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              User directory
            </p>
            <p className="mt-1 text-sm font-bold text-gray-900">
              Recent activity across the product
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/users"
              className="text-[12px] font-semibold text-[#ff6b35] hover:opacity-80 transition-opacity"
            >
              View all
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-100">
          <div className="hidden grid-cols-[1.4fr_1fr_0.7fr_0.7fr_0.7fr] gap-3 bg-gray-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 lg:grid">
            <span>User</span>
            <span>Last active</span>
            <span>Sessions</span>
            <span>Goals</span>
            <span>AI chats</span>
          </div>
          <div className="divide-y divide-gray-100">
            {dashboard.users.slice(0, 8).map((user) => (
              <Link
                key={user.userId}
                href={`/admin/users/${user.userId}`}
                className="block px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                {/* Mobile */}
                <div className="lg:hidden space-y-2">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-gray-400">{user.email}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[12px] text-gray-500">
                    <span>Last active: {formatDate(user.lastActiveAt)}</span>
                    <span>Sessions: {user.sessionsCount}</span>
                    <span>Goals done: {user.completedGoals}</span>
                    <span>Chats: {user.chatSessionsCount}</span>
                  </div>
                </div>

                {/* Desktop */}
                <div className="hidden grid-cols-[1.4fr_1fr_0.7fr_0.7fr_0.7fr] gap-3 items-center lg:grid">
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
                    {user.completedGoals}/{user.activeGoals + user.completedGoals}
                  </span>
                  <span className="text-[13px] text-gray-500">
                    {user.chatSessionsCount}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
