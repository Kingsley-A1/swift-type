import { readFileSync } from 'fs';
import { join } from 'path';
import pg from 'pg';

const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
const dbLine = envFile.split('\n').find(l => l.startsWith('DATABASE_URL='));
const dbUrl = dbLine.substring('DATABASE_URL='.length).trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log('Connected to NeonDB.');

const sql = `
-- user_xp_ledger: immutable per-session XP audit trail
CREATE TABLE IF NOT EXISTS "user_xp_ledger" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "session_id" text REFERENCES "typing_sessions"("id") ON DELETE SET NULL,
  "period" text NOT NULL,
  "xp_awarded" integer NOT NULL,
  "wpm_contribution" integer NOT NULL,
  "accuracy_contribution" integer NOT NULL,
  "duration_contribution" integer NOT NULL,
  "streak_contribution" integer NOT NULL,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "xp_ledger_user_period_idx" ON "user_xp_ledger" ("user_id", "period");
CREATE INDEX IF NOT EXISTS "xp_ledger_period_idx" ON "user_xp_ledger" ("period");
CREATE INDEX IF NOT EXISTS "xp_ledger_session_id_idx" ON "user_xp_ledger" ("session_id");

-- swift_rank_snapshots: pre-computed monthly rank snapshot
CREATE TABLE IF NOT EXISTS "swift_rank_snapshots" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "period" text NOT NULL,
  "total_xp" integer NOT NULL DEFAULT 0,
  "rank" integer,
  "tier" text NOT NULL DEFAULT 'Rookie',
  "avg_wpm" real NOT NULL DEFAULT 0,
  "avg_accuracy" real NOT NULL DEFAULT 0,
  "total_sessions" integer NOT NULL DEFAULT 0,
  "total_practice_minutes" real NOT NULL DEFAULT 0,
  "best_streak" integer NOT NULL DEFAULT 0,
  "is_anonymous" boolean NOT NULL DEFAULT false,
  "snapshot_at" timestamp DEFAULT now(),
  UNIQUE ("user_id", "period")
);

CREATE INDEX IF NOT EXISTS "swift_rank_period_xp_idx" ON "swift_rank_snapshots" ("period", "total_xp");
`;

try {
  await client.query(sql);
  console.log('✅ Migration complete — swift_rank tables created successfully.');
} catch (e) {
  console.error('❌ Migration failed:', e.message);
} finally {
  await client.end();
}
