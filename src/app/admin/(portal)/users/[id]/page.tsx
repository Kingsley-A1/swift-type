import { notFound } from "next/navigation";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { getAdminSession } from "@/lib/adminAuth";
import { getAdminUserDetail } from "@/lib/adminData";
import { recordAdminAudit } from "@/lib/adminAudit";

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

  const partText = firstMessage.parts?.find((part) => part.type === "text")?.text;
  return partText || firstMessage.content || "No text preview available";
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, admin] = await Promise.all([
    getAdminUserDetail(id),
    getAdminSession(),
  ]);

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
    <main className="space-y-5 pb-8">
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-4xl bg-slate-950 px-5 py-6 text-white shadow-2xl sm:px-6">
          <p className="text-sm uppercase tracking-[0.24em] text-orange-300">
            User observability
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            {detail.overview.name}
          </h1>
          <p className="mt-2 text-sm text-slate-300">{detail.overview.email}</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-200">
            <span>Joined {formatDate(detail.overview.createdAt)}</span>
            <span>Last active {formatDate(detail.overview.lastActiveAt)}</span>
            <span>{detail.overview.currentStreak} day live streak</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`/api/admin/export?scope=user&userId=${detail.overview.userId}&format=json`}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Export user JSON
            </a>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminStatCard
            label="Practice depth"
            value={`${Math.round(detail.overview.totalPracticeSeconds / 60)} min`}
            hint={`${detail.overview.sessionsCount} sessions and ${detail.overview.totalKeystrokes} keystrokes`}
          />
          <AdminStatCard
            label="Performance"
            value={`${detail.overview.averageWpm} / ${detail.overview.averageAccuracy}%`}
            hint="Average WPM and accuracy across saved sessions"
          />
          <AdminStatCard
            label="Goals"
            value={`${detail.overview.goalCompletionRate}%`}
            hint={`${detail.overview.completedGoals} completed, ${detail.overview.activeGoals} active`}
          />
          <AdminStatCard
            label="Swift AI span"
            value={formatDuration(detail.overview.longestChatSpanMs)}
            hint={`${detail.chats.length} chat sessions with stored history`}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-4xl border border-white/60 bg-white/85 p-4 shadow-lg backdrop-blur sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Session history
              </p>
              <p className="mt-1 text-lg font-bold text-slate-950">
                Typing quality over time
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {detail.sessions.slice(0, 12).map((session) => (
              <div key={session.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-950">{formatDate(session.date)}</p>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                    {session.mode}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-600 sm:grid-cols-4">
                  <span>{session.wpm} WPM</span>
                  <span>{session.accuracy}% accuracy</span>
                  <span>{Math.round(session.duration / 60)} min</span>
                  <span>{session.keystrokes} keystrokes</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-4xl border border-white/60 bg-white/85 p-4 shadow-lg backdrop-blur sm:p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Typing friction
            </p>
            <div className="mt-4 space-y-3">
              {detail.topKeys.slice(0, 6).map((entry) => (
                <div key={entry.key} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-950">Key {entry.key}</p>
                    <p className="text-sm text-slate-500">
                      {entry.misses} misses, {entry.hits} hits
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    {entry.averageTimeMs} ms
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-4xl border border-white/60 bg-white/85 p-4 shadow-lg backdrop-blur sm:p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Top n-grams
            </p>
            <div className="mt-4 space-y-3">
              {detail.topNGrams.slice(0, 6).map((entry) => (
                <div key={entry.ngram} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-950">{entry.ngram}</p>
                    <p className="text-sm text-slate-500">
                      {entry.misses} misses across {entry.occurrences} attempts
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    {entry.averageTimeMs} ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-4xl border border-white/60 bg-white/85 p-4 shadow-lg backdrop-blur sm:p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Goals and rewards
          </p>
          <div className="mt-4 space-y-3">
            {detail.goals.slice(0, 8).map((goal) => (
              <div key={goal.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950">{goal.title}</p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {goal.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {goal.goalType} · {goal.currentValue}/{goal.targetValue} · {goal.periodType}
                </p>
              </div>
            ))}

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Recent rewards</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {detail.rewards.slice(0, 10).map((reward) => (
                  <span
                    key={reward.id}
                    className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
                  >
                    {reward.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-4xl border border-white/60 bg-white/85 p-4 shadow-lg backdrop-blur sm:p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Swift AI history
          </p>
          <div className="mt-4 space-y-3">
            {detail.chats.slice(0, 6).map((chat) => (
              <details key={chat.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{chat.title}</p>
                      <p className="text-sm text-slate-500">
                        {chat.messageCount} messages · {formatDuration(chat.durationMs)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {formatDate(chat.updatedAt ?? chat.createdAt)}
                    </span>
                  </div>
                </summary>
                <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                  {extractMessagePreview(chat.messages)}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-4xl border border-white/60 bg-white/85 p-4 shadow-lg backdrop-blur sm:p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Reviews and profile
          </p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Review count</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{detail.reviews.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Preferred mode</p>
              <p className="mt-2 font-semibold text-slate-950">
                {detail.preferences?.preferredMode ?? "Unknown"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Goal reminder</p>
              <p className="mt-2 font-semibold text-slate-950">
                {detail.preferences?.goalReminderEnabled ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-4xl border border-white/60 bg-white/85 p-4 shadow-lg backdrop-blur sm:p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Latest activity
          </p>
          <div className="mt-4 space-y-3">
            {detail.activities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{activity.action}</p>
                    <p className="text-sm text-slate-500">
                      {activity.entityType} · {formatDate(activity.occurredAt)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    {formatDuration(activity.durationMs)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}