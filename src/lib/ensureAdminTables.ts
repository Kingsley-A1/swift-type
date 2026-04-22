import { db } from "@/db";
import { sql } from "drizzle-orm";

let ensureAdminTablesPromise: Promise<void> | null = null;

async function runEnsureAdminTables() {
  if (!ensureAdminTablesPromise) {
    ensureAdminTablesPromise = (async () => {
      await db.execute(
        sql.raw(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          last_login_at TIMESTAMP
        )
      `),
      );
      await db.execute(
        sql.raw(`
        CREATE INDEX IF NOT EXISTS admin_users_email_idx
        ON admin_users (email)
      `),
      );

      await db.execute(
        sql.raw(`
        CREATE TABLE IF NOT EXISTS admin_sessions (
          id TEXT PRIMARY KEY,
          admin_user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
          ip_address TEXT,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          last_seen_at TIMESTAMP DEFAULT NOW(),
          ended_at TIMESTAMP
        )
      `),
      );
      await db.execute(
        sql.raw(`
        CREATE INDEX IF NOT EXISTS admin_sessions_admin_user_id_idx
        ON admin_sessions (admin_user_id)
      `),
      );
      await db.execute(
        sql.raw(`
        CREATE INDEX IF NOT EXISTS admin_sessions_created_at_idx
        ON admin_sessions (created_at)
      `),
      );

      await db.execute(
        sql.raw(`
        CREATE TABLE IF NOT EXISTS admin_audit_logs (
          id TEXT PRIMARY KEY,
          admin_user_id TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
          action TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT,
          duration_ms INTEGER,
          ip_address TEXT,
          user_agent TEXT,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `),
      );
      await db.execute(
        sql.raw(`
        CREATE INDEX IF NOT EXISTS admin_audit_logs_admin_user_id_idx
        ON admin_audit_logs (admin_user_id)
      `),
      );
      await db.execute(
        sql.raw(`
        CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx
        ON admin_audit_logs (created_at)
      `),
      );
      await db.execute(
        sql.raw(`
        CREATE INDEX IF NOT EXISTS admin_audit_logs_entity_type_idx
        ON admin_audit_logs (entity_type)
      `),
      );
    })();
  }

  return ensureAdminTablesPromise;
}

export async function withAdminTables<T>(operation: () => Promise<T>) {
  await runEnsureAdminTables();
  return operation();
}

export async function ensureAdminTables() {
  await runEnsureAdminTables();
}
