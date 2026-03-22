import { db } from "@/db";
import { sql } from "drizzle-orm";

let ensurePasswordColumnPromise: Promise<void> | null = null;

function hasMissingPasswordColumn(error: unknown): boolean {
  const candidates = [error, (error as { cause?: unknown })?.cause];

  return candidates.some((candidate) => {
    if (!candidate || typeof candidate !== "object") return false;
    const dbError = candidate as { code?: string; message?: string };
    return (
      dbError.code === "42703" &&
      typeof dbError.message === "string" &&
      dbError.message.includes('column "password" does not exist')
    );
  });
}

async function runEnsurePasswordColumn() {
  if (!ensurePasswordColumnPromise) {
    ensurePasswordColumnPromise = db
      .execute(
        sql.raw("ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT"),
      )
      .then(() => undefined);
  }
  return ensurePasswordColumnPromise;
}

export async function withUsersPasswordColumn<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!hasMissingPasswordColumn(error)) throw error;
    await runEnsurePasswordColumn();
    return operation();
  }
}
