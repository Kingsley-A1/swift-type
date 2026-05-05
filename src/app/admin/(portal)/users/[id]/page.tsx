import { notFound } from "next/navigation";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { getAdminSession } from "@/lib/adminAuth";
import { getAdminUserDetail } from "@/lib/adminData";
import { recordAdminAudit } from "@/lib/adminAudit";
import { getUserRankDetail } from "@/lib/swiftRankService";
import { getUserRankRewards } from "@/lib/swiftRankRewards";
import { CURRENT_PERIOD, getTierInfo } from "@/lib/swiftRank";

function formatDate(value: Date | null) {
  return value
    ? value.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "N/A";
}

function formatDuration(durationMs: number | null) {
  if (!durationMs) {
    return "N/A";
  }

  const totalMinutes = Math.round(durationMs / 60000);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function extractMessagePreview(messages: unknown[]) {
  const firstMessage = messages.find(
    (message) => message && typeof message === "object",
  ) as
    | {
        parts?: Array<{ type?: string; text?: string }>;
        content?: string;
      }
    | undefined;

  if (!firstMessage) {
    return "No stored messages";
  }

  const partText = firstMessage.parts?.find(
    (part) => part.type === "text",
  )?.text;
  return partText || firstMessage.content || "No text preview available";
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const period = CURRENT_PERIOD();
  const [detail, admin, rankData, rankRewards] = await Promise.all([
    getAdminUserDetail(id),
    getAdminSession(),
    getUserRankDetail(id, period),
    getUserRankRewards(id),
  ]);

  const { snapshot: rankSnapshot, ledger: rankLedger } = rankData;
  const tierInfo = rankSnapshot ? getTierInfo(rankSnapshot.tier) : null;

  if (!detail) {
    notFound();
  }

  if (admin) {
    await recordAdminAudit({
      adminUserId: admin.adminId,
      action: "admin.viewed_user",
      entityType: "user",
      entityId: id,
      metadata: { email: detail.overview.email },
    });
  }

  return (
    <main className="space-y-6 pb-8">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
            User detail
          </p>
          <h1 className="mt-1 text-xl font-black tracking-tight text-gray-900">
            {detail.overview.name}
          </h1>
          <p className="mt-0.5 text-[13px] text-gray-400">
            {detail.overview.email}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-[12px] text-gray-500">
            <span>Joined {formatDate(detail.overview.createdAt)}</span>
            <span>Last active {formatDate(detail.overview.lastActiveAt)}</span>
            <span>{detail.overview.currentStreak}-day streak</span>
          </div>
        </div>
        <a
          href={`/api/admin/export?scope=user&userId=${detail.overview.userId}&format=json`}
          className="h-8 rounded-lg bg-[#fa4c0c] px-3 text-[12px] font-semibold text-white hover:opacity-90 transition-opacity flex items-center self-start"
        >
          Export user JSON
        </a>
      </div>

      {/* Key stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AdminStatCard
          label="Practice depth"
          value={`${Math.round(detail.overview.totalPracticeSeconds / 60)} min`}
          hint={`${detail.overview.sessionsCount} sessions · ${detail.overview.totalKeystrokes} keystrokes`}
        />
        <AdminStatCard
          label="Performance"
          value={`${detail.overview.averageWpm} WPM`}
          hint={`${detail.overview.averageAccuracy}% avg accuracy`}
        />
        <AdminStatCard
          label="Goals"
          value={`${detail.overview.goalCompletionRate}%`}
          hint={`${detail.overview.completedGoals} completed, ${detail.overview.activeGoals} active`}
        />
        <AdminStatCard
          label="Swift AI"
          value={formatDuration(detail.overview.longestChatSpanMs)}
          hint={`${detail.chats.length} chat sessions`}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Session history
          </p>
          <div className="mt-3 divide-y divide-gray-100">
            {detail.sessions.slice(0, 12).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-b-0"
              >
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">
                    {formatDate(session.date)}
                  </p>
                  <div className="mt-0.5 flex flex-wrap gap-3 text-[12px] text-gray-500">
                    <span>{session.wpm} WPM</span>
                    <span>{session.accuracy}% accuracy</span>
                    <span>{Math.round(session.duration / 60)} min</span>
                    <span>{session.keystrokes} ks</span>
                  </div>
                </div>
                <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-600">
                  {session.mode}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Typing friction
            </p>
            <div className="mt-3 divide-y divide-gray-100">
              {detail.topKeys.slice(0, 6).map((entry) => (
                <div
                  key={entry.key}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">
                      Key {entry.key}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {entry.misses} misses · {entry.hits} hits
                    </p>
                  </div>
                  <span className="text-[13px] font-semibold text-gray-500">
                    {entry.averageTimeMs} ms
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Top n-grams
            </p>
            <div className="mt-3 divide-y divide-gray-100">
              {detail.topNGrams.slice(0, 6).map((entry) => (
                <div
                  key={entry.ngram}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">
                      {entry.ngram}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {entry.misses} misses · {entry.occurrences} attempts
                    </p>
                  </div>
                  <span className="text-[13px] font-semibold text-gray-500">
                    {entry.averageTimeMs} ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Goals and rewards
          </p>
          <div className="mt-3 space-y-2">
            {detail.goals.slice(0, 8).map((goal) => (
              <div
                key={goal.id}
                className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">
                    {goal.title}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {goal.goalType} · {goal.currentValue}/{goal.targetValue} ·{" "}
                    {goal.periodType}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                  {goal.status}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 mb-3">
              Rewards
            </p>
            <div className="flex flex-wrap gap-2">
              {detail.rewards.slice(0, 10).map((reward) => (
                <span
                  key={reward.id}
                  className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-[12px] font-medium text-gray-600"
                >
                  {reward.title}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Swift AI history
          </p>
          <div className="mt-3 space-y-2">
            {detail.chats.slice(0, 6).map((chat) => (
              <details
                key={chat.id}
                className="group rounded-lg border border-gray-100"
              >
                <summary className="cursor-pointer list-none px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">
                        {chat.title}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {chat.messageCount} messages ·{" "}
                        {formatDuration(chat.durationMs)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-gray-400">
                      {formatDate(chat.updatedAt ?? chat.createdAt)}
                    </span>
                  </div>
                </summary>
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-[12px] leading-6 text-gray-600 rounded-b-lg">
                  {extractMessagePreview(chat.messages)}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Swift Rank Audit */}
      <section className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base">{tierInfo?.emoji ?? "⚪"}</span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Swift Rank</p>
            <p className="text-sm font-bold text-gray-900">
              {rankSnapshot
                ? `${rankSnapshot.tier} · #${rankSnapshot.rank ?? "—"} globally · ${rankSnapshot.totalXp.toLocaleString()} XP`
                : "No ranking data for current period"}
            </p>
          </div>
        </div>

        {rankSnapshot && (
          <>
            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Avg WPM", value: Math.round(rankSnapshot.avgWpm) },
                { label: "Avg Accuracy", value: `${Math.round(rankSnapshot.avgAccuracy)}%` },
                { label: "Sessions", value: rankSnapshot.totalSessions },
                { label: "Practice", value: `${Math.round(rankSnapshot.totalPracticeMinutes)}m` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
                  <p className="text-[15px] font-black text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {/* Recent XP ledger */}
            {rankLedger.length > 0 && (
              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <div className="grid grid-cols-[6rem_1fr_1fr_1fr_1fr_4rem] gap-2 bg-gray-50 px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  <span>Date</span>
                  <span>WPM XP</span>
                  <span>Acc XP</span>
                  <span>Dur XP</span>
                  <span>Streak XP</span>
                  <span className="text-right">Total</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {rankLedger.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="grid grid-cols-[6rem_1fr_1fr_1fr_1fr_4rem] gap-2 px-4 py-2.5 text-[12px]">
                      <span className="text-gray-400 font-mono">
                        {entry.createdAt
                          ? new Date(entry.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
                          : "—"}
                      </span>
                      <span className="text-gray-600">{entry.wpmContribution}</span>
                      <span className="text-gray-600">{entry.accuracyContribution}</span>
                      <span className="text-gray-600">{entry.durationContribution}</span>
                      <span className="text-gray-600">{entry.streakContribution}</span>
                      <span className="font-black text-[#fa4c0c] text-right">+{entry.xpAwarded}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Rank rewards earned */}
        {rankRewards.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Rank Rewards Earned</p>
            <div className="flex flex-wrap gap-2">
              {rankRewards.map((r) => (
                <span
                  key={r.id}
                  className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                  style={{ borderColor: `${getTierInfo(rankSnapshot?.tier ?? "Rookie").color}40`, color: getTierInfo(rankSnapshot?.tier ?? "Rookie").color, background: `${getTierInfo(rankSnapshot?.tier ?? "Rookie").color}10` }}
                >
                  {r.title}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Reviews and profile
          </p>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <p className="text-[12px] text-gray-500">Review count</p>
              <p className="text-[13px] font-semibold text-gray-900">
                {detail.reviews.length}
              </p>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <p className="text-[12px] text-gray-500">Preferred mode</p>
              <p className="text-[13px] font-semibold text-gray-900">
                {detail.preferences?.preferredMode ?? "Unknown"}
              </p>
            </div>
            <div className="flex items-center justify-between py-3">
              <p className="text-[12px] text-gray-500">Goal reminder</p>
              <p className="text-[13px] font-semibold text-gray-900">
                {detail.preferences?.goalReminderEnabled
                  ? "Enabled"
                  : "Disabled"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Latest activity
          </p>
          <div className="mt-3 divide-y divide-gray-100">
            {detail.activities.slice(0, 10).map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">
                    {activity.action}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {activity.entityType} · {formatDate(activity.occurredAt)}
                  </p>
                </div>
                <span className="shrink-0 text-[13px] font-semibold text-gray-500">
                  {formatDuration(activity.durationMs)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
