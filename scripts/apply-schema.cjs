const { readFileSync } = require('fs');
const { Client } = require('pg');

function loadEnv(filePath) {
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
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

loadEnv('.env.local');

const statements = [
  `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT NOT NULL UNIQUE,
      email_verified TIMESTAMP,
      image TEXT,
      created_at TIMESTAMP DEFAULT now()
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INT,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT
    )
  `,
  `CREATE UNIQUE INDEX IF NOT EXISTS provider_account_idx ON accounts (provider, provider_account_id)`,
  `
    CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier TEXT NOT NULL,
      token TEXT NOT NULL,
      expires TIMESTAMP NOT NULL
    )
  `,
  `CREATE UNIQUE INDEX IF NOT EXISTS verification_token_idx ON verification_tokens (identifier, token)`,
  `
    CREATE TABLE IF NOT EXISTS typing_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TIMESTAMP NOT NULL,
      wpm INT NOT NULL,
      accuracy INT NOT NULL,
      mode TEXT NOT NULL,
      duration INT NOT NULL,
      keystrokes INT NOT NULL,
      history_data JSONB
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS user_stats (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      per_key_stats JSONB DEFAULT '{}'::jsonb,
      n_gram_stats JSONB DEFAULT '{}'::jsonb,
      updated_at TIMESTAMP DEFAULT now()
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      has_played_intro BOOLEAN DEFAULT false,
      preferred_level TEXT DEFAULT 'beginner',
      preferred_mode TEXT DEFAULT 'timed',
      preferred_duration INT DEFAULT 60
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT 'New Chat',
      is_pinned BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    )
  `,
];

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('sslmode=')
      ? { rejectUnauthorized: false }
      : undefined,
  });

  await client.connect();
  try {
    for (const statement of statements) {
      await client.query(statement);
    }
    console.log('SCHEMA_APPLY_OK');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('SCHEMA_APPLY_FAILED');
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
