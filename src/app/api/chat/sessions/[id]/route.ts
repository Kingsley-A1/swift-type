import { auth } from "@/lib/auth";
import { db } from "@/db";
import { chatSessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getChatMessages, deleteChatMessages } from "@/lib/r2";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const messages = await getChatMessages(session.user.id, id);
  return Response.json(messages);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.isPinned !== undefined) updates.isPinned = body.isPinned;

  await db
    .update(chatSessions)
    .set(updates)
    .where(
      and(eq(chatSessions.id, id), eq(chatSessions.userId, session.user.id)),
    );

  return Response.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  await Promise.all([
    db
      .delete(chatSessions)
      .where(
        and(eq(chatSessions.id, id), eq(chatSessions.userId, session.user.id)),
      ),
    deleteChatMessages(session.user.id, id),
  ]);

  return Response.json({ ok: true });
}
