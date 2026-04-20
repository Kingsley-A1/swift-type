import { readFileSync } from 'fs';
import { join } from 'path';
import pkg from 'pg';
const { Client } = pkg;

const envPath = join(process.cwd(), '.env.local');
const envFile = readFileSync(envPath, 'utf-8');
const dbLine = envFile.split('\n').find(l => l.startsWith('DATABASE_URL='));
if (!dbLine) throw new Error("DATABASE_URL not found in .env.local");
const dbUrl = dbLine.substring('DATABASE_URL='.length).trim().replace(/^"|"$/g, '');

const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function migrate() {
  console.log('Connecting to database...');
  await client.connect();
  console.log('Connected. Running migration...');

  const statements = [
    {
      label: 'user_reviews table',
      sql: `CREATE TABLE IF NOT EXISTS "user_reviews" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "user_name" text NOT NULL,
        "user_image" text,
        "content" text NOT NULL,
        "role" text DEFAULT 'Swift Typist' NOT NULL,
        "organisation" text,
        "created_at" timestamp,
        "updated_at" timestamp
      )`
    },
    {
      label: 'user_reviews unique index',
      sql: `CREATE UNIQUE INDEX IF NOT EXISTS "user_reviews_user_id_idx" ON "user_reviews"("user_id")`
    },
    {
      label: 'typing_sessions user_id index',
      sql: `CREATE INDEX IF NOT EXISTS "typing_sessions_user_id_idx" ON "typing_sessions"("user_id")`
    },
    {
      label: 'typing_sessions date index',
      sql: `CREATE INDEX IF NOT EXISTS "typing_sessions_date_idx" ON "typing_sessions"("date")`
    },
    {
      label: 'user_goals user_id index',
      sql: `CREATE INDEX IF NOT EXISTS "user_goals_user_id_idx" ON "user_goals"("user_id")`
    },
    {
      label: 'user_rewards user_id index',
      sql: `CREATE INDEX IF NOT EXISTS "user_rewards_user_id_idx" ON "user_rewards"("user_id")`
    },
    {
      label: 'chat_sessions user_id index',
      sql: `CREATE INDEX IF NOT EXISTS "chat_sessions_user_id_idx" ON "chat_sessions"("user_id")`
    },
  ];

  for (const { label, sql } of statements) {
    try {
      await client.query(sql);
      console.log(`✓ ${label}`);
    } catch (err) {
      console.error(`✗ ${label}: ${err.message}`);
    }
  }

  await client.end();
  console.log('\n✅ Migration complete!');
}

migrate().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
