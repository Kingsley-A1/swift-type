import { streamText, UIMessage, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { sessions, userStats, chatSessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { saveChatMessages } from "@/lib/r2";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface TypingContext {
  totalSessions: number;
  averageWpm?: number;
  averageAccuracy?: number;
  bestWpm?: number;
  recentSessions?: string;
  weakestKeys?: string[];
  weakestBigrams?: string[];
}

// ─── CONTEXT BUILDER ─────────────────────────────────────────────────────────

function buildTypingContext(
  recentSessions: (typeof sessions.$inferSelect)[],
  stats: typeof userStats.$inferSelect | undefined,
): TypingContext {
  const ctx: TypingContext = { totalSessions: recentSessions.length };

  if (recentSessions.length > 0) {
    ctx.averageWpm = Math.round(
      recentSessions.reduce((sum, s) => sum + s.wpm, 0) / recentSessions.length,
    );
    ctx.averageAccuracy = Math.round(
      recentSessions.reduce((sum, s) => sum + s.accuracy, 0) /
        recentSessions.length,
    );
    ctx.bestWpm = Math.max(...recentSessions.map((s) => s.wpm));
    ctx.recentSessions = recentSessions
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

## RULES
1. ALWAYS reference the user's actual data. Never give generic advice.
2. Reference Swift Type features: Curriculum mode, Adaptive toggle, key highlights.
3. Keep responses concise — 2-4 paragraphs max unless asked for detail.
4. If asked about anything unrelated to typing, politely redirect.
5. Never say you're "an AI" or "a language model." You are Swift AI, the built-in coach.`;
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

  const [recentSessions, statsRows] = await Promise.all([
    db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.date))
      .limit(10),
    db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1),
  ]);

  const typingContext = buildTypingContext(recentSessions, statsRows[0]);
  const systemPrompt = buildSystemPrompt(userName, typingContext);

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    providerOptions: {
      google: {
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
    onFinish({ text }) {
      // Save messages to R2 after streaming completes (fire-and-forget)
      const allMessages = [
        ...messages,
        { role: "assistant" as const, content: text, timestamp: Date.now() },
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
