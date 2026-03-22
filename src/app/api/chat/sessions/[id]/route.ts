import { auth } from "@/lib/auth";
import { db } from "@/db";
import { chatSessions } from "@/db/schema";
import { withChatFeedbackColumn } from "@/lib/ensureChatFeedbackColumn";
import { eq, and } from "drizzle-orm";
import {
  getChatMessages,
  deleteChatMessages,
  saveChatMessages,
} from "@/lib/r2";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;

  const { id } = await params;

  const [messages, dbSession] = await Promise.all([
    getChatMessages(userId, id),
    withChatFeedbackColumn(() =>
      db.query.chatSessions.findFirst({
        where: and(
          eq(chatSessions.id, id),
          eq(chatSessions.userId, userId),
        ),
        columns: {
          feedback: true,
        },
      }),
    ),
  ]);

  return Response.json({
    messages: messages || [],
    feedback: dbSession?.feedback || {},
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;

  const { id } = await params;
  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.isPinned !== undefined) updates.isPinned = body.isPinned;
  if (body.feedback !== undefined) updates.feedback = body.feedback;

  if (body.messages !== undefined) {
    await saveChatMessages(userId, id, body.messages);
    updates.updatedAt = new Date();
  }

  if (Object.keys(updates).length > 0) {
    await withChatFeedbackColumn(() =>
      db
        .update(chatSessions)
        .set(updates)
        .where(and(eq(chatSessions.id, id), eq(chatSessions.userId, userId))),
    );
  }

  return Response.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;

  const { id } = await params;
  await Promise.all([
    db
      .delete(chatSessions)
      .where(and(eq(chatSessions.id, id), eq(chatSessions.userId, userId))),
    deleteChatMessages(userId, id),
  ]);

  return Response.json({ ok: true });
}
