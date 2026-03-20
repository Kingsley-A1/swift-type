const { readFileSync, writeFileSync } = require('fs');
const { spawnSync } = require('child_process');
const { join } = require('path');
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
process.env.NODE_PATH = join(process.cwd(), 'node_modules');

async function applySchemaFallback() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('sslmode=')
      ? { rejectUnauthorized: false }
      : undefined,
  });

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
    `
      CREATE UNIQUE INDEX IF NOT EXISTS provider_account_idx
      ON accounts (provider, provider_account_id)
    `,
    `
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL,
        expires TIMESTAMP NOT NULL
      )
    `,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS verification_token_idx
      ON verification_tokens (identifier, token)
    `,
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

  await client.connect();
  try {
    for (const statement of statements) {
      await client.query(statement);
    }
  } finally {
    await client.end();
  }
}

const drizzleBinary = process.platform === 'win32'
  ? join('node_modules', '.bin', 'drizzle-kit.cmd')
  : join('node_modules', '.bin', 'drizzle-kit');

const result = spawnSync(drizzleBinary, ['push'], {
  encoding: 'utf8',
  shell: true,
  env: process.env,
});

const log = [
  `exitCode=${result.status ?? 'null'}`,
  'stdout:',
  result.stdout || '',
  'stderr:',
  result.stderr || '',
].join('\n');

writeFileSync('scripts/drizzle-push.log', log);

if (result.stdout) {
  process.stdout.write(result.stdout);
}

if (result.stderr) {
  process.stderr.write(result.stderr);
}

(async () => {
  if (
    result.status !== 0 &&
    log.includes("please install required packages: 'drizzle-orm'")
  ) {
    try {
      await applySchemaFallback();
      const fallbackMessage = '\nFallback schema apply succeeded.\n';
      writeFileSync('scripts/drizzle-push.log', log + fallbackMessage);
      process.stdout.write(fallbackMessage);
      process.exit(0);
    } catch (error) {
      const fallbackMessage = `\nFallback schema apply failed.\n${error.stack || error.message || String(error)}\n`;
      writeFileSync('scripts/drizzle-push.log', log + fallbackMessage);
      process.stderr.write(fallbackMessage);
      process.exit(1);
    }
  }

  process.exit(result.status ?? 1);
})().catch((error) => {
  process.stderr.write(`${error.stack || error.message || String(error)}\n`);
  process.exit(1);
});
