import { streamText, UIMessage, convertToModelMessages, tool } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  sessions,
  userStats,
  chatSessions,
  userRewards,
  userReviews,
} from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { saveChatMessages } from "@/lib/r2";
import { getActiveGoals, createGoal } from "@/lib/goalService";
import {
  formatGoalProgress,
  createGoalWindow,
  GOAL_TEMPLATES,
  getGoalSnapshotTimezone,
  isGoalStreakAtRisk,
} from "@/lib/goals";

// ─── CONTEXT CACHE (60s TTL per user) ────────────────────────────────────────
// Prevents 5 DB queries on every back-to-back chat message.

const contextCache = new Map<
  string,
  { context: TypingContext; expiresAt: number }
>();
const CACHE_TTL_MS = 60_000;

function getCachedContext(userId: string): TypingContext | null {
  const entry = contextCache.get(userId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    contextCache.delete(userId);
    return null;
  }
  return entry.context;
}

function setCachedContext(userId: string, context: TypingContext) {
  contextCache.set(userId, { context, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface TypingContext {
  totalSessions: number; //Total number of sessions a user completed
  averageWpm?: number; //Average words per minute across all sessions
  averageAccuracy?: number; //Average accuracy across all sessions
  bestWpm?: number; //Best words per minute achieved in a session
  recentSessions?: string; //Summary of recent sessions
  weakestKeys?: string[]; //Keys with the highest error rates
  weakestBigrams?: string[]; //Bigrams with the highest error rates
  activeDailyGoal?: string; //Current active daily goal
  activeWeeklyGoal?: string; //Current active weekly goal
  currentStreak?: number; //Current streak count
  bestStreak?: number; //Best streak count
  latestReward?: string; //Latest reward earned
  streakState?: "on_track" | "at_risk" | "missed"; //State of the current streak
  communityReviews?: string[]; //Community reviews
  reviewCount?: number; //Number of reviews
}

// ─── CONTEXT BUILDER ─────────────────────────────────────────────────────────

function buildTypingContext(
  recentSessions: (typeof sessions.$inferSelect)[],
  stats: typeof userStats.$inferSelect | undefined,
  goalSnapshot: Awaited<ReturnType<typeof getActiveGoals>>,
  latestReward?: typeof userRewards.$inferSelect,
  allReviews?: (typeof userReviews.$inferSelect)[],
): TypingContext {
  const ctx: TypingContext = { totalSessions: recentSessions.length };
  const normalizedSessions = recentSessions.map((session) => ({
    ...session,
    wpm: Number(session.wpm),
    accuracy: Number(session.accuracy),
  }));
// Calculate averages, bests, and summaries
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
    const timezone = getGoalSnapshotTimezone(goalSnapshot, "UTC");
    ctx.streakState = isGoalStreakAtRisk(
      goalSnapshot.streak,
      timezone,
      Date.now(),
    )
      ? "at_risk"
      : "on_track";
  }

  // Community reviews (top 6 for citation)
  if (allReviews && allReviews.length > 0) {
    ctx.reviewCount = allReviews.length;
    ctx.communityReviews = allReviews
      .slice(0, 6)
      .map(
        (r) =>
          `${r.userName} (${r.role}${r.organisation ? ` @ ${r.organisation}` : ""}): "${r.content}"`,
      );
  }

  return ctx;
}

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────

function buildSystemPrompt(userName: string, ctx: TypingContext): string {
  return `You are Swift AI — the intelligent typing coach built into Swift Type, a next-gen productivity-first keyboard mastery platform.

## IDENTITY
- Name: Swift AI (or just "Swift")
- Built by: King Tech Foundation, led by Kingsley Maduabuchi (Founder)
- Platform: Swift Type — a next-generation, productivity-first efficient typing coach
- Personality: Warm, encouraging, concise, occasionally witty. Call the user "${userName}". Celebrate progress, normalize struggle, and keep them coming back.
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

## COMMUNITY REVIEWS
${ctx.reviewCount ? `Swift Type has ${ctx.reviewCount} community review(s). You may cite these naturally to encourage ${userName}:` : "No community reviews yet — if appropriate, gently invite the user to be the first to leave one in the Reviews panel."}
${ctx.communityReviews?.join("\n") ?? ""}

## DATA INTEGRITY
- USER DATA is the source of truth.
- CANONICAL METRICS is the preferred block for quoting exact stats.
- If you mention a metric, key, or bigram from USER DATA, copy it exactly as written.
- Never recalculate, merge, or invent numbers.
- If a metric is missing, say it is unavailable instead of guessing.

## KING TECH FOUNDATION
Swift Type is built and maintained by King Tech Foundation, a tech organisation led by Kingsley Maduabuchi.
- Website: https://kingtech.com.ng
- Partnerships: https://kingtech.com.ng/partnerships
- When a user shows dedication, improved consistently, or asks about advanced coaching, you may naturally mention: "If you love what we're building, King Tech Foundation is always looking for partners to push typing education further — check out kingtech.com.ng/partnerships."
- Keep it organic. Only mention partnerships when genuinely relevant (e.g. user asks who built this, user hits a big milestone, user wants to contribute). Never force it. Maximum once per conversation.

## TOOLS
You have access to tools that let you take real actions on behalf of the user. USE THEM — do not just talk about doing things.
- **createGoal**: Actually create a goal for the user when they ask for one, or when you recommend one. ALWAYS use this tool instead of just describing a goal.
- **navigateTo**: Open a specific panel or page in the app. Use this to direct users to the right place (e.g. "Let me open the Goals panel for you").
- **startSession**: Start a typing session for the user with optimal settings based on their skill level and needs.

When using tools:
- If the user asks you to create a goal, USE the createGoal tool. Do not say "I've created a goal" without actually calling the tool.
- If you recommend a panel, use navigateTo so the user can click to open it directly.
- If you suggest practicing, use startSession to actually start a session with the right config.
- You can combine tools with text. For example: use navigateTo to open a panel AND explain why.

## RULES
1. ALWAYS reference the user's actual data. Never give generic advice.
2. Reference Swift Type features: Curriculum mode, Adaptive toggle, key highlights, Goals, Reviews panel.
3. Keep responses concise — 2-4 paragraphs max unless asked for detail.
4. If asked about anything unrelated to typing, politely redirect.
5. Never say you're "an AI" or "a language model." You are Swift AI, the built-in coach from King Tech Foundation.
6. When quoting stats, repeat the exact labels and values from USER DATA.
7. If the user has an active goal or streak, use it naturally in your coaching.
8. Celebrate completions and suggest the next logical goal upgrade only when momentum is stable.
9. If STREAK_STATE=missed, recommend smaller, easier next goals instead of pushing harder.
10. If STREAK_STATE=at_risk, prioritize one short session today before any advanced drills.
11. If the user is new (no sessions), warmly welcome them, explain what Swift Type can do, and suggest starting with a 60-second timed session.
12. Occasionally — especially when a user hits a milestone or seems engaged — invite them to share a review in the Reviews panel. Keep it natural, never pushy.
13. When relevant, cite community reviews verbatim (with the reviewer's name) to motivate the user.
14. ALWAYS use your tools to take action. Do not claim you did something without actually calling the tool.
15. When directing users to a page or panel, use the navigateTo tool so they see a clickable link.

## PRIVACY POLICY KNOWLEDGE
If the user asks about privacy, data, security, or what Swift Type does with their information, answer accurately:

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

  // Check cache first — rebuild only if expired (60s TTL)
  let typingContext = getCachedContext(userId);

  if (!typingContext) {
    const [
      recentSessions,
      statsRows,
      goalSnapshot,
      latestRewardRow,
      allReviews,
    ] = await Promise.all([
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
      db
        .select()
        .from(userReviews)
        .orderBy(desc(userReviews.createdAt))
        .limit(20),
    ]);

    typingContext = buildTypingContext(
      recentSessions,
      statsRows[0],
      goalSnapshot,
      latestRewardRow[0],
      allReviews,
    );
    setCachedContext(userId, typingContext);
  }
  const systemPrompt = buildSystemPrompt(userName, typingContext);

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    temperature: 0.4,
    providerOptions: {
      google: {
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
    tools: {
      createGoal: tool({
        description:
          "Create a typing goal for the user. Use this whenever you recommend or the user requests a goal. Pick the best matching goal type and period.",
        inputSchema: z.object({
          templateKey: z
            .enum([
              "daily-3-sessions",
              "daily-95-accuracy",
              "weekly-15-minutes",
              "weekly-45-wpm",
            ])
            .describe("The goal template key to use"),
        }),
        execute: async ({ templateKey }) => {
          const template = GOAL_TEMPLATES.find((t) => t.key === templateKey);
          if (!template)
            return { success: false, error: "Unknown goal template" };

          const now = Date.now();
          const window = createGoalWindow(template.periodType, now);

          const result = await createGoal(userId, {
            title: template.title,
            periodType: template.periodType,
            goalType: template.goalType,
            targetValue: template.targetValue,
            requiredSessions: template.requiredSessions,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            startedAt: window.startedAt,
            endsAt: window.endsAt,
          });

          // Invalidate cached context so next message picks up the new goal
          contextCache.delete(userId);

          const goal =
            template.periodType === "daily"
              ? result.snapshot.dailyGoal
              : result.snapshot.weeklyGoal;

          return {
            success: true,
            goalTitle: template.title,
            goalType: template.goalType,
            targetValue: template.targetValue,
            periodType: template.periodType,
            progress: goal ? formatGoalProgress(goal) : "0",
            goalSnapshot: result.snapshot,
            rewardEvents: result.rewardEvents,
          };
        },
      }),

      navigateTo: tool({
        description:
          "Open a panel or page in Swift Type. Use this to direct users to the right place with a clickable action. The user will see a button they can click.",
        inputSchema: z.object({
          target: z
            .enum([
              "goals",
              "history",
              "guide",
              "rewards",
              "profile",
              "reviews",
              "privacy",
              "terms",
            ])
            .describe("The panel or page to open"),
          label: z
            .string()
            .describe(
              "The text shown on the clickable button, e.g. 'Open Goals Panel'",
            ),
        }),
      }),

      startSession: tool({
        description:
          "Start a typing session for the user with optimal settings. Use this when you suggest they practice, or when they ask to start typing.",
        inputSchema: z.object({
          mode: z
            .enum(["timed", "words", "curriculum"])
            .describe("The session mode"),
          level: z
            .enum(["beginner", "intermediate", "advanced"])
            .describe(
              "Skill level — pick based on user's current WPM and accuracy",
            ),
          duration: z
            .number()
            .optional()
            .describe("Duration in seconds for timed mode (15, 30, 60, 120)"),
          wordCount: z
            .number()
            .optional()
            .describe("Word count for words mode (10, 25, 50, 100)"),
        }),
      }),
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
