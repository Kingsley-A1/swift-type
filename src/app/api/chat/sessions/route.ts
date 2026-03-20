import { auth } from "@/lib/auth";
import { db } from "@/db";
import { chatSessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const chats = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, session.user.id))
    .orderBy(desc(chatSessions.updatedAt));

  return Response.json(chats);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { title } = await req.json();
  const id = crypto.randomUUID();

  await db.insert(chatSessions).values({
    id,
    userId: session.user.id,
    title: title || "New Chat",
  });

  return Response.json({ id, title: title || "New Chat" });
}
