import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { chatSessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/chat/sessions/[id]/title
 * Body: { firstMessage: string }
 *
 * Uses Gemini to generate a short, punchy chat title from the first
 * user message and persists it to the DB.  Returns { title }.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const { firstMessage } = (await req.json()) as { firstMessage: string };

  if (!firstMessage?.trim()) {
    return Response.json({ title: "New Chat" });
  }

  // Cap input to avoid token waste
  const truncated = firstMessage.slice(0, 200);

  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    prompt: `Summarise the following typing-coach question into a short chat title (max 5 words, no quotes, no punctuation at the end):\n\n"${truncated}"`,
    providerOptions: {
      google: { thinkingConfig: { thinkingBudget: 0 } },
    },
  });

  const title = text.trim().slice(0, 50) || "New Chat";

  await db
    .update(chatSessions)
    .set({ title, updatedAt: new Date() })
    .where(
      and(eq(chatSessions.id, id), eq(chatSessions.userId, session.user.id)),
    );

  return Response.json({ title });
}
