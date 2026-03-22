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
    "CREATE TABLE IF NOT EXISTS user_rewards (id text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, reward_type text NOT NULL, reward_key text NOT NULL, title text NOT NULL, description text, metadata jsonb DEFAULT '{}'::jsonb, earned_at timestamp NOT NULL, created_at timestamp DEFAULT now())",
    "CREATE UNIQUE INDEX IF NOT EXISTS user_reward_key_idx ON user_rewards (user_id, reward_key)",
  ];

  try {
    await client.connect();

    for (const statement of statements) {
      await client.query(statement);
    }

    const tables = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_name IN ('user_rewards') ORDER BY table_name",
    );

    const indexes = await client.query(
      "SELECT indexname FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'user_rewards' AND indexname = 'user_reward_key_idx'",
    );

    console.log(`TABLES=${tables.rows.map((row) => row.table_name).join(",")}`);
    console.log(
      `INDEXES=${indexes.rows.map((row) => row.indexname).join(",")}`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
});
