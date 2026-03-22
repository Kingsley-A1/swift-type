import { db } from "@/db";
import { sql } from "drizzle-orm";

let ensureFeedbackColumnPromise: Promise<void> | null = null;

function hasMissingFeedbackColumn(error: unknown) {
  const candidates = [error, (error as { cause?: unknown })?.cause];

  return candidates.some((candidate) => {
    if (!candidate || typeof candidate !== "object") {
      return false;
    }

    const dbError = candidate as { code?: string; message?: string };
    return (
      dbError.code === "42703" &&
      typeof dbError.message === "string" &&
      dbError.message.includes('column "feedback" does not exist')
    );
  });
}

async function ensureChatFeedbackColumn() {
  if (!ensureFeedbackColumnPromise) {
    ensureFeedbackColumnPromise = (async () => {
      await db.execute(
        sql.raw(
          "ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS feedback JSONB DEFAULT '{}'::jsonb",
        ),
      );
      await db.execute(
        sql.raw(
          "UPDATE chat_sessions SET feedback = '{}'::jsonb WHERE feedback IS NULL",
        ),
      );
    })();
  }

  return ensureFeedbackColumnPromise;
}

export async function withChatFeedbackColumn<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    if (!hasMissingFeedbackColumn(error)) {
      throw error;
    }

    await ensureChatFeedbackColumn();
    return operation();
  }
}
