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

function toValidDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function getReviewDateMs(row: {
  createdAt?: unknown;
  updatedAt?: unknown;
}) {
  return (
    toValidDate(row.createdAt)?.getTime() ??
    toValidDate(row.updatedAt)?.getTime() ??
    0
  );
}

function normalizeReviewRow<T extends { createdAt?: unknown; updatedAt?: unknown }>(
  row: T,
) {
  const normalizedCreatedAt =
    toValidDate(row.createdAt) ?? toValidDate(row.updatedAt) ?? new Date();
  const normalizedUpdatedAt =
    toValidDate(row.updatedAt) ?? normalizedCreatedAt;

  return {
    ...row,
    createdAt: normalizedCreatedAt.toISOString(),
    updatedAt: normalizedUpdatedAt.toISOString(),
  };
}

// ─── GET: all reviews ordered by role hierarchy ───────────────────────────────
export async function GET(_req: Request) {
  try {
    const session = await auth();
    const rows = await db
      .select()
      .from(userReviews)
      .orderBy(desc(userReviews.createdAt));

    const sorted = [...rows].sort((a, b) => {
      const pa = ROLE_PRIORITY[(a.role as ReviewRole)] ?? 99;
      const pb = ROLE_PRIORITY[(b.role as ReviewRole)] ?? 99;
      if (pa !== pb) return pa - pb;
      return getReviewDateMs(b) - getReviewDateMs(a);
    });

    const normalized = sorted.map((row) => normalizeReviewRow(row));

    const sessionUserId = session?.user?.id;
    const myReview = sessionUserId
      ? (normalized.find((r) => r.userId === sessionUserId) ?? null)
      : null;

    return json({ reviews: normalized, myReview });
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
    return json({ review: normalizeReviewRow(updated) });
  }

  const [created] = await db
    .insert(userReviews)
    .values({ userId, userName, userImage, content, role, organisation: org })
    .returning();

  return json({ review: normalizeReviewRow(created) }, 201);
}
