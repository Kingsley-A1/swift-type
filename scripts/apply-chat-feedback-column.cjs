const { readFileSync } = require("fs");
const { neon } = require("@neondatabase/serverless");

function loadEnv(filePath) {
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    const key = match[1].trim();
    let value = match[2].trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

async function main() {
  loadEnv(".env.local");

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing from .env.local");
  }

  const sql = neon(process.env.DATABASE_URL);

  await sql`
    ALTER TABLE chat_sessions
    ADD COLUMN IF NOT EXISTS feedback JSONB DEFAULT '{}'::jsonb
  `;

  await sql`
    UPDATE chat_sessions
    SET feedback = '{}'::jsonb
    WHERE feedback IS NULL
  `;

  const result = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'chat_sessions' AND column_name = 'feedback'
  `;

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
