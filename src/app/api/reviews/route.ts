import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userReviews, ROLE_PRIORITY, type ReviewRole } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ─── GET: all reviews ordered by role hierarchy ───────────────────────────────
export async function GET(_req: Request) {
  try {
    const session = await auth();
    const rows = await db.select().from(userReviews).orderBy(desc(userReviews.createdAt));

    const sorted = [...rows].sort((a, b) => {
      const pa = ROLE_PRIORITY[(a.role as ReviewRole)] ?? 99;
      const pb = ROLE_PRIORITY[(b.role as ReviewRole)] ?? 99;
      if (pa !== pb) return pa - pb;
      return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
    });

    const myReview = session?.user?.id
      ? (sorted.find((r) => r.userId === session.user!.id) ?? null)
      : null;

    return json({ reviews: sorted, myReview });
  } catch {
    return json({ error: "Failed to fetch reviews" }, 500);
  }
}

// ─── POST: create or update the authenticated user's review ──────────────────
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return json({ error: "Unauthorized" }, 401);
  }

  const body = await req.json() as {
    content?: string;
    role?: string;
    organisation?: string;
  };

  if (!body.content?.trim()) {
    return json({ error: "Review content is required" }, 400);
  }

  const content  = body.content.trim().slice(0, 500);
  const role     = body.role?.trim() || "Swift Typist";
  const org      = body.organisation?.trim().slice(0, 80) || null;
  const userId   = session.user.id;
  const userName = session.user.name || "Anonymous";
  const userImage = session.user.image ?? null;

  const existing = await db
    .select({ id: userReviews.id })
    .from(userReviews)
    .where(eq(userReviews.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(userReviews)
      .set({ content, role, organisation: org, userImage, updatedAt: new Date() })
      .where(eq(userReviews.userId, userId))
      .returning();
    return json({ review: updated });
  }

  const [created] = await db
    .insert(userReviews)
    .values({ userId, userName, userImage, content, role, organisation: org })
    .returning();

  return json({ review: created }, 201);
}
