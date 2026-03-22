import { streamText, UIMessage, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { sessions, userStats, chatSessions, userRewards } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { saveChatMessages } from "@/lib/r2";
import { getActiveGoals } from "@/lib/goalService";
import { formatGoalProgress } from "@/lib/goals";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface TypingContext {
  totalSessions: number;
  averageWpm?: number;
  averageAccuracy?: number;
  bestWpm?: number;
  recentSessions?: string;
  weakestKeys?: string[];
  weakestBigrams?: string[];
  activeDailyGoal?: string;
  activeWeeklyGoal?: string;
  currentStreak?: number;
  bestStreak?: number;
  latestReward?: string;
  streakState?: "on_track" | "at_risk" | "missed";
}

// ─── CONTEXT BUILDER ─────────────────────────────────────────────────────────

function buildTypingContext(
  recentSessions: (typeof sessions.$inferSelect)[],
  stats: typeof userStats.$inferSelect | undefined,
  goalSnapshot: Awaited<ReturnType<typeof getActiveGoals>>,
  latestReward?: typeof userRewards.$inferSelect,
): TypingContext {
  const ctx: TypingContext = { totalSessions: recentSessions.length };
  const normalizedSessions = recentSessions.map((session) => ({
    ...session,
    wpm: Number(session.wpm),
    accuracy: Number(session.accuracy),
  }));

  if (normalizedSessions.length > 0) {
    ctx.averageWpm = Math.round(
      normalizedSessions.reduce((sum, s) => sum + s.wpm, 0) /
        normalizedSessions.length,
    );
    ctx.averageAccuracy = Math.round(
      normalizedSessions.reduce((sum, s) => sum + s.accuracy, 0) /
        normalizedSessions.length,
    );
    ctx.bestWpm = Math.max(...normalizedSessions.map((s) => s.wpm));
    ctx.recentSessions = normalizedSessions
      .slice(0, 5)
      .map((s) => `${s.wpm} WPM / ${s.accuracy}% acc (${s.mode})`)
      .join(" | ");
  }

  if (stats?.perKeyStats) {
    const entries = Object.entries(
      stats.perKeyStats as Record<string, { hits: number; misses: number }>,
    );
    const scored = entries
      .filter(([, v]) => v.hits + v.misses >= 5)
      .map(([key, v]) => ({ key, errorRate: v.misses / (v.hits + v.misses) }))
      .sort((a, b) => b.errorRate - a.errorRate);
    ctx.weakestKeys = scored
      .slice(0, 5)
      .map((s) => `${s.key} (${Math.round(s.errorRate * 100)}% error)`);
  }

  if (stats?.nGramStats) {
    const entries = Object.entries(
      stats.nGramStats as Record<
        string,
        { occurrences: number; misses: number }
      >,
    );
    const scored = entries
      .filter(([, v]) => v.occurrences >= 5)
      .map(([bigram, v]) => ({ bigram, errorRate: v.misses / v.occurrences }))
      .sort((a, b) => b.errorRate - a.errorRate);
    ctx.weakestBigrams = scored
      .slice(0, 5)
      .map((s) => `"${s.bigram}" (${Math.round(s.errorRate * 100)}% error)`);
  }

  if (goalSnapshot.dailyGoal) {
    ctx.activeDailyGoal = `${goalSnapshot.dailyGoal.title} (${formatGoalProgress(goalSnapshot.dailyGoal)})`;
  }

  if (goalSnapshot.weeklyGoal) {
    ctx.activeWeeklyGoal = `${goalSnapshot.weeklyGoal.title} (${formatGoalProgress(goalSnapshot.weeklyGoal)})`;
  }

  if (goalSnapshot.streak.currentStreak > 0) {
    ctx.currentStreak = goalSnapshot.streak.currentStreak;
  }

  if (goalSnapshot.streak.bestStreak > 0) {
    ctx.bestStreak = goalSnapshot.streak.bestStreak;
  }

  if (latestReward) {
    ctx.latestReward = `${latestReward.title} (${latestReward.earnedAt.toLocaleDateString()})`;
  }

  if (
    goalSnapshot.streak.currentStreak === 0 &&
    goalSnapshot.streak.bestStreak >= 3
  ) {
    ctx.streakState = "missed";
  } else if (
    goalSnapshot.streak.currentStreak > 0 &&
    goalSnapshot.streak.lastQualifiedAt
  ) {
    const now = new Date();
    const last = new Date(goalSnapshot.streak.lastQualifiedAt);
    const isSameDay =
      now.getFullYear() === last.getFullYear() &&
      now.getMonth() === last.getMonth() &&
      now.getDate() === last.getDate();

    if (!isSameDay && now.getHours() >= 18) {
      ctx.streakState = "at_risk";
    } else {
      ctx.streakState = "on_track";
    }
  }

  return ctx;
}

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────

function buildSystemPrompt(userName: string, ctx: TypingContext): string {
  return `You are Swift AI — the intelligent typing coach built into Swift Type, a keyboard mastery platform.

## IDENTITY
- Name: Swift AI (or just "Swift")
- Personality: Warm, encouraging, concise. Call the user "${userName}". Celebrate progress, normalize struggle.
- Expertise: Touch typing, keyboard ergonomics, muscle memory, speed building, accuracy strategies.

## KNOWLEDGE
- Home row (ASDF JKL;) is the foundation of all touch typing
- Speed comes from accuracy first, then muscle memory, then reducing finger travel
- Common plateaus at 40, 60, 80 WPM — each needs different techniques
- Bigram fluency matters more than individual key speed
- Beginners should never look at their keyboard

## USER DATA
${ctx.totalSessions > 0 ? `- Sessions completed: ${ctx.totalSessions}` : "- New user — no sessions yet"}
${ctx.averageWpm ? `- Average WPM: ${ctx.averageWpm}` : ""}
${ctx.averageAccuracy ? `- Average accuracy: ${ctx.averageAccuracy}%` : ""}
${ctx.bestWpm ? `- Personal best: ${ctx.bestWpm} WPM` : ""}
${ctx.recentSessions ? `- Recent sessions: ${ctx.recentSessions}` : ""}
${ctx.weakestKeys?.length ? `- Weakest keys: ${ctx.weakestKeys.join(", ")}` : ""}
${ctx.weakestBigrams?.length ? `- Weakest bigrams: ${ctx.weakestBigrams.join(", ")}` : ""}
${ctx.activeDailyGoal ? `- Active daily goal: ${ctx.activeDailyGoal}` : ""}
${ctx.activeWeeklyGoal ? `- Active weekly goal: ${ctx.activeWeeklyGoal}` : ""}
${ctx.currentStreak ? `- Current streak: ${ctx.currentStreak} day(s)` : ""}
${ctx.bestStreak ? `- Best streak: ${ctx.bestStreak} day(s)` : ""}
${ctx.latestReward ? `- Latest reward: ${ctx.latestReward}` : ""}
${ctx.streakState ? `- Streak state: ${ctx.streakState}` : ""}

## CANONICAL METRICS
${ctx.totalSessions > 0 ? `SESSIONS_COMPLETED=${ctx.totalSessions}` : "SESSIONS_COMPLETED=unavailable"}
${ctx.averageWpm ? `AVERAGE_WPM=${ctx.averageWpm}` : "AVERAGE_WPM=unavailable"}
${ctx.averageAccuracy ? `AVERAGE_ACCURACY=${ctx.averageAccuracy}%` : "AVERAGE_ACCURACY=unavailable"}
${ctx.bestWpm ? `PERSONAL_BEST=${ctx.bestWpm} WPM` : "PERSONAL_BEST=unavailable"}
${ctx.weakestBigrams?.length ? `WEAKEST_BIGRAMS=${ctx.weakestBigrams.join(", ")}` : "WEAKEST_BIGRAMS=unavailable"}
${ctx.activeDailyGoal ? `ACTIVE_DAILY_GOAL=${ctx.activeDailyGoal}` : "ACTIVE_DAILY_GOAL=none"}
${ctx.activeWeeklyGoal ? `ACTIVE_WEEKLY_GOAL=${ctx.activeWeeklyGoal}` : "ACTIVE_WEEKLY_GOAL=none"}
${ctx.currentStreak ? `CURRENT_STREAK=${ctx.currentStreak}` : "CURRENT_STREAK=0"}
${ctx.latestReward ? `LATEST_REWARD=${ctx.latestReward}` : "LATEST_REWARD=none"}
${ctx.streakState ? `STREAK_STATE=${ctx.streakState}` : "STREAK_STATE=unknown"}

## DATA INTEGRITY
- USER DATA is the source of truth.
- CANONICAL METRICS is the preferred block for quoting exact stats.
- If you mention a metric, key, or bigram from USER DATA, copy it exactly as written.
- Never recalculate, merge, or invent numbers.
- If a metric is missing, say it is unavailable instead of guessing.

## RULES
1. ALWAYS reference the user's actual data. Never give generic advice.
2. Reference Swift Type features: Curriculum mode, Adaptive toggle, key highlights.
3. Keep responses concise — 2-4 paragraphs max unless asked for detail.
4. If asked about anything unrelated to typing, politely redirect.
5. Never say you're "an AI" or "a language model." You are Swift AI, the built-in coach.
6. When quoting stats, repeat the exact labels and values from USER DATA.
7. If the user has an active goal or streak, use it naturally in your coaching and recommendations.
8. Celebrate completions and suggest the next logical goal upgrade only when momentum is stable.
9. If STREAK_STATE=missed, recommend smaller, easier next goals instead of pushing harder.
10. If STREAK_STATE=at_risk, prioritize one short session today before any advanced drills.

## PRIVACY POLICY KNOWLEDGE
If the user asks about privacy, data, security, or what Swift Type does with their information, answer accurately using the following facts:

**What Swift Type collects:**
- Typing session data: WPM, accuracy, keystroke timing, character error maps (to power coaching).
- OAuth profile info (name, email, avatar) from Google or GitHub — not stored independently.
- Chat messages are processed by Google Gemini (Google's servers) and not stored long-term by Swift Type.
- Browser theme preference is stored locally only.

**What Swift Type does NOT collect:**
- The actual text typed during practice sessions.
- Passwords (OAuth-only sign-in).
- Third-party ad or tracking cookies.
- Any data from unauthenticated users.

**Data storage:**
- Sessions and account data: Neon PostgreSQL (encrypted at rest, TLS in transit).
- Chat message archives: Cloudflare R2 (AES-256 encrypted).
- Authentication sessions: encrypted JWT cookies, 30-day expiry.
- Infrastructure: Vercel (SOC 2 Type II, ISO 27001 certified).

**User rights:**
- Request a copy of all stored data.
- Request full account and data deletion.
- Opt out of AI-enhanced processing.
- Contact: privacy@swifttype.app

**Compliance:** GDPR and CCPA principles followed. Data is never sold to advertisers or third parties.`;
}

// ─── ROUTE ───────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const {
    messages,
    chatSessionId,
  }: { messages: UIMessage[]; chatSessionId: string } = await req.json();
  const userId = session.user.id;
  const userName = session.user.name || "there";

  const [chatSession] = await db
    .select({ id: chatSessions.id })
    .from(chatSessions)
    .where(
      and(eq(chatSessions.id, chatSessionId), eq(chatSessions.userId, userId)),
    )
    .limit(1);

  if (!chatSession) {
    return new Response("Chat session not found", { status: 404 });
  }

  const [recentSessions, statsRows, goalSnapshot, latestRewardRow] =
    await Promise.all([
      db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, userId))
        .orderBy(desc(sessions.date))
        .limit(10),
      db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1),
      getActiveGoals(userId),
      db
        .select()
        .from(userRewards)
        .where(eq(userRewards.userId, userId))
        .orderBy(desc(userRewards.earnedAt))
        .limit(1),
    ]);

  const typingContext = buildTypingContext(
    recentSessions,
    statsRows[0],
    goalSnapshot,
    latestRewardRow[0],
  );
  const systemPrompt = buildSystemPrompt(userName, typingContext);

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    temperature: 0,
    providerOptions: {
      google: {
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
    onFinish({ text }) {
      // Save messages to R2 after streaming completes (fire-and-forget)
      const allMessages = [
        ...messages,
        {
          id: crypto.randomUUID(),
          role: "assistant" as const,
          parts: [{ type: "text" as const, text }],
        },
      ];
      saveChatMessages(userId, chatSessionId, allMessages)
        .then(() =>
          db
            .update(chatSessions)
            .set({ updatedAt: new Date() })
            .where(eq(chatSessions.id, chatSessionId)),
        )
        .catch(() => {});
    },
  });

  return result.toUIMessageStreamResponse();
}
