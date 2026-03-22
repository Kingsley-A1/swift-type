const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

function loadEnvFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [name, ...valueParts] = trimmed.split("=");
    const value = valueParts
      .join("=")
      .trim()
      .replace(/^['\"]|['\"]$/g, "");
    process.env[name] = value;
  }
}

async function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const envPath = path.join(repoRoot, ".env.local");

  if (fs.existsSync(envPath)) {
    loadEnvFile(envPath);
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not available in process.env");
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("sslmode=")
      ? { rejectUnauthorized: false }
      : undefined,
  });

  const statements = [
    "ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS goal_reminder_enabled boolean DEFAULT true",
    "ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS preferred_goal_period text DEFAULT 'daily'",
    "ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS preferred_goal_template text",
    "ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS sidebar_dismissed_at timestamp",
    "CREATE TABLE IF NOT EXISTS user_goals (id text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, title text NOT NULL, period_type text NOT NULL, goal_type text NOT NULL, target_value integer NOT NULL, current_value integer NOT NULL DEFAULT 0, required_sessions integer NOT NULL DEFAULT 1, current_sessions integer NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'active', timezone text NOT NULL DEFAULT 'UTC', started_at timestamp NOT NULL, ends_at timestamp NOT NULL, completed_at timestamp, created_at timestamp DEFAULT now(), updated_at timestamp DEFAULT now())",
    "CREATE TABLE IF NOT EXISTS user_streaks (user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, current_streak integer NOT NULL DEFAULT 0, best_streak integer NOT NULL DEFAULT 0, last_qualified_at timestamp, updated_at timestamp DEFAULT now())",
  ];

  try {
    await client.connect();

    for (const statement of statements) {
      await client.query(statement);
    }

    const tables = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_name IN ('user_goals', 'user_streaks') ORDER BY table_name",
    );
    const columns = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'user_preferences' AND column_name IN ('goal_reminder_enabled', 'preferred_goal_period', 'preferred_goal_template', 'sidebar_dismissed_at') ORDER BY column_name",
    );

    console.log(`TABLES=${tables.rows.map((row) => row.table_name).join(",")}`);
    console.log(
      `PREF_COLUMNS=${columns.rows.map((row) => row.column_name).join(",")}`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
});
