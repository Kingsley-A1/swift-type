import { auth } from "@/lib/auth";
import { db } from "@/db";
import { chatSessions } from "@/db/schema";
import { withChatFeedbackColumn } from "@/lib/ensureChatFeedbackColumn";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;

  const chats = await withChatFeedbackColumn(() =>
    db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt)),
  );

  return Response.json(chats);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;

  const { title } = await req.json();
  const id = crypto.randomUUID();

  await withChatFeedbackColumn(() =>
    db.insert(chatSessions).values({
      id,
      userId,
      title: title || "New Chat",
    }),
  );

  return Response.json({ id, title: title || "New Chat" });
}
