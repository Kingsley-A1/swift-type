const { readFileSync } = require("fs");
const { generateText } = require("ai");
const { google } = require("@ai-sdk/google");
const { Client } = require("pg");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { appendFileSync, writeFileSync } = require("fs");

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

function assertEnv(keys) {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}

function logLine(message) {
  appendFileSync("scripts/integration-smoke.status.log", `${message}\n`);
}
async function checkDatabase() {
  const expectedTables = [
    "accounts",
    "chat_sessions",
    "typing_sessions",
    "user_preferences",
    "user_stats",
    "users",
    "verification_tokens",
  ];

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("sslmode=")
      ? { rejectUnauthorized: false }
      : undefined,
  });

  await client.connect();

  try {
    const result = await client.query(
      `
        select table_name
        from information_schema.tables
        where table_schema = 'public'
          and table_name = any($1)
        order by table_name
      `,
      [expectedTables],
    );

    const foundTables = result.rows.map((row) => row.table_name);
    const missingTables = expectedTables.filter(
      (name) => !foundTables.includes(name),
    );

    if (missingTables.length > 0) {
      throw new Error(
        `Database missing expected tables: ${missingTables.join(", ")}`,
      );
    }

    console.log("DB OK:", foundTables.join(", "));
    logLine(`DB OK: ${foundTables.join(", ")}`);
  } finally {
    await client.end();
  }
}

async function checkGemini() {
  const result = await generateText({
    model: google("gemini-2.5-flash"),
    prompt: "Reply with exactly: SWIFT_AI_OK",
    maxOutputTokens: 10,
    providerOptions: {
      google: {
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
  });

  if (!result.text.trim().includes("SWIFT_AI_OK")) {
    throw new Error(
      `Unexpected Gemini response: ${JSON.stringify(result.text)}`,
    );
  }

  console.log("AI OK:", result.text.trim());
  logLine(`AI OK: ${result.text.trim()}`);
}

async function checkR2() {
  const client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  const bucket = process.env.R2_BUCKET_NAME;
  const key = `smoke-tests/${Date.now()}.json`;
  const payload = JSON.stringify({
    ok: true,
    createdAt: new Date().toISOString(),
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: payload,
      ContentType: "application/json",
    }),
  );

  const object = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  const body = await object.Body.transformToString();
  if (body !== payload) {
    throw new Error("R2 round-trip payload mismatch");
  }

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  console.log("R2 OK:", key);
  logLine(`R2 OK: ${key}`);
}

async function main() {
  writeFileSync("scripts/integration-smoke.status.log", "STARTED\n");
  loadEnv(".env.local");
  assertEnv([
    "DATABASE_URL",
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "R2_ENDPOINT",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
  ]);

  await checkDatabase();
  await checkGemini();
  await checkR2();

  console.log("SMOKE TESTS PASSED");
  logLine("SMOKE TESTS PASSED");
}

main().catch((error) => {
  writeFileSync(
    "scripts/integration-smoke.status.log",
    `FAILED\n${error instanceof Error ? error.stack || error.message : String(error)}\n`,
    { flag: "a" },
  );
  console.error("SMOKE TESTS FAILED");
  console.error(
    error instanceof Error ? error.stack || error.message : String(error),
  );
  process.exit(1);
});
