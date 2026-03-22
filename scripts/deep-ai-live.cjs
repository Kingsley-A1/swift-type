const { readFileSync, writeFileSync } = require("fs");
const { randomUUID } = require("crypto");
const { Client } = require("pg");
const { generateText } = require("ai");
const { google } = require("@ai-sdk/google");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

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

function buildTypingContext(recentSessions, stats) {
  const ctx = { totalSessions: recentSessions.length };
  const normalizedSessions = recentSessions.map((session) => ({
    ...session,
    wpm: Number(session.wpm),
    accuracy: Number(session.accuracy),
  }));

  if (normalizedSessions.length > 0) {
    ctx.averageWpm = Math.round(
      normalizedSessions.reduce((sum, session) => sum + session.wpm, 0) /
        normalizedSessions.length,
    );
    ctx.averageAccuracy = Math.round(
      normalizedSessions.reduce((sum, session) => sum + session.accuracy, 0) /
        normalizedSessions.length,
    );
    ctx.bestWpm = Math.max(...normalizedSessions.map((session) => session.wpm));
    ctx.recentSessions = normalizedSessions
      .slice(0, 5)
      .map(
        (session) =>
          `${session.wpm} WPM / ${session.accuracy}% acc (${session.mode})`,
      )
      .join(" | ");
  }

  if (stats?.per_key_stats) {
    const entries = Object.entries(stats.per_key_stats);
    const scored = entries
      .filter(([, value]) => value.hits + value.misses >= 5)
      .map(([key, value]) => ({
        key,
        errorRate: value.misses / (value.hits + value.misses),
      }))
      .sort((a, b) => b.errorRate - a.errorRate);
    ctx.weakestKeys = scored
      .slice(0, 5)
      .map(
        (entry) => `${entry.key} (${Math.round(entry.errorRate * 100)}% error)`,
      );
  }

  if (stats?.n_gram_stats) {
    const entries = Object.entries(stats.n_gram_stats);
    const scored = entries
      .filter(([, value]) => value.occurrences >= 5)
      .map(([bigram, value]) => ({
        bigram,
        errorRate: value.misses / value.occurrences,
      }))
      .sort((a, b) => b.errorRate - a.errorRate);
    ctx.weakestBigrams = scored
      .slice(0, 5)
      .map(
        (entry) =>
          `"${entry.bigram}" (${Math.round(entry.errorRate * 100)}% error)`,
      );
  }

  return ctx;
}

function buildSystemPrompt(userName, ctx) {
  return `You are Swift AI — the intelligent typing coach built into Swift Type, a keyboard mastery platform.

## IDENTITY
- Name: Swift AI (or just "Swift")
- Personality: Warm, encouraging, concise. Call the user "${userName}". Celebrate progress, normalize struggle.
- Expertise: Touch typing, keyboard ergonomics, muscle memory, speed building, accuracy strategies.

## KNOWLEDGE
- Home row (ASDF JKL;) is the foundation of all touch typing
- Speed comes from accuracy first, then muscle memory, then reducing finger travel
- Common plateaus at 40, 60, 80 WPM — each needs different techniques
- Bigram fluency matters more than individual key speed
- Beginners should never look at their keyboard

## USER DATA
${ctx.totalSessions > 0 ? `- Sessions completed: ${ctx.totalSessions}` : "- New user — no sessions yet"}
${ctx.averageWpm ? `- Average WPM: ${ctx.averageWpm}` : ""}
${ctx.averageAccuracy ? `- Average accuracy: ${ctx.averageAccuracy}%` : ""}
${ctx.bestWpm ? `- Personal best: ${ctx.bestWpm} WPM` : ""}
${ctx.recentSessions ? `- Recent sessions: ${ctx.recentSessions}` : ""}
${ctx.weakestKeys?.length ? `- Weakest keys: ${ctx.weakestKeys.join(", ")}` : ""}
${ctx.weakestBigrams?.length ? `- Weakest bigrams: ${ctx.weakestBigrams.join(", ")}` : ""}

## CANONICAL METRICS
${ctx.totalSessions > 0 ? `SESSIONS_COMPLETED=${ctx.totalSessions}` : "SESSIONS_COMPLETED=unavailable"}
${ctx.averageWpm ? `AVERAGE_WPM=${ctx.averageWpm}` : "AVERAGE_WPM=unavailable"}
${ctx.averageAccuracy ? `AVERAGE_ACCURACY=${ctx.averageAccuracy}%` : "AVERAGE_ACCURACY=unavailable"}
${ctx.bestWpm ? `PERSONAL_BEST=${ctx.bestWpm} WPM` : "PERSONAL_BEST=unavailable"}
${ctx.weakestBigrams?.length ? `WEAKEST_BIGRAMS=${ctx.weakestBigrams.join(", ")}` : "WEAKEST_BIGRAMS=unavailable"}

## DATA INTEGRITY
- USER DATA is the source of truth.
- CANONICAL METRICS is the preferred block for quoting exact stats.
- If you mention a metric, key, or bigram from USER DATA, copy it exactly as written.
- Never recalculate, merge, or invent numbers.
- If a metric is missing, say it is unavailable instead of guessing.

## RULES
1. ALWAYS reference the user's actual data. Never give generic advice.
2. Reference Swift Type features: Curriculum mode, Adaptive toggle, key highlights.
3. Keep responses concise — 2-4 paragraphs max unless asked for detail.
4. If asked about anything unrelated to typing, politely redirect.
5. Never say you're "an AI" or "a language model." You are Swift AI, the built-in coach.
6. When quoting stats, repeat the exact labels and values from USER DATA.`;
}

function chatKey(userId, chatId) {
  return `chats/${userId}/${chatId}.json`;
}

async function main() {
  loadEnv(".env.local");
  assertEnv([
    "DATABASE_URL",
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "R2_ENDPOINT",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
  ]);

  const userId = `swift-ai-live-${Date.now()}`;
  const chatId = randomUUID();
  const email = `${userId}@example.com`;
  const userName = "Integration Tester";
  const logPath = "scripts/deep-ai-live.log";
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("sslmode=")
      ? { rejectUnauthorized: false }
      : undefined,
  });
  const r2 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  const typedSessions = [
    { wpm: 72, accuracy: 91, mode: "timed", duration: 60, keystrokes: 420 },
    {
      wpm: 84,
      accuracy: 94,
      mode: "curriculum",
      duration: 60,
      keystrokes: 470,
    },
    { wpm: 66, accuracy: 89, mode: "adaptive", duration: 60, keystrokes: 390 },
  ];

  await client.connect();

  try {
    await client.query("begin");

    await client.query(
      `
        insert into users (id, name, email, created_at)
        values ($1, $2, $3, now())
      `,
      [userId, userName, email],
    );

    await client.query(
      `
        insert into chat_sessions (id, user_id, title, is_pinned, created_at, updated_at)
        values ($1, $2, 'Integration Probe', false, now(), now())
      `,
      [chatId, userId],
    );

    for (const session of typedSessions) {
      await client.query(
        `
          insert into typing_sessions (id, user_id, date, wpm, accuracy, mode, duration, keystrokes)
          values ($1, $2, now(), $3, $4, $5, $6, $7)
        `,
        [
          randomUUID(),
          userId,
          session.wpm,
          session.accuracy,
          session.mode,
          session.duration,
          session.keystrokes,
        ],
      );
    }

    await client.query(
      `
        insert into user_stats (user_id, per_key_stats, n_gram_stats, updated_at)
        values ($1, $2::jsonb, $3::jsonb, now())
      `,
      [
        userId,
        JSON.stringify({
          a: { hits: 12, misses: 1, totalTimeMs: 1500 },
          t: { hits: 8, misses: 4, totalTimeMs: 1600 },
          g: { hits: 7, misses: 3, totalTimeMs: 1700 },
        }),
        JSON.stringify({
          th: { occurrences: 10, misses: 4, totalTimeMs: 3000 },
          er: { occurrences: 12, misses: 2, totalTimeMs: 2400 },
          in: { occurrences: 9, misses: 1, totalTimeMs: 1800 },
        }),
      ],
    );

    const sessionsResult = await client.query(
      `
        select wpm, accuracy, mode
        from typing_sessions
        where user_id = $1
        order by date desc
        limit 10
      `,
      [userId],
    );
    const statsResult = await client.query(
      `
        select per_key_stats, n_gram_stats
        from user_stats
        where user_id = $1
        limit 1
      `,
      [userId],
    );

    const typingContext = buildTypingContext(
      sessionsResult.rows,
      statsResult.rows[0],
    );
    const systemPrompt = buildSystemPrompt(
      userName.split(" ")[0],
      typingContext,
    );
    const prompt =
      "Based only on my Swift Type data, give me a short practice plan. In the first sentence, quote the exact values from CANONICAL METRICS for AVERAGE_WPM, AVERAGE_ACCURACY, PERSONAL_BEST, and WEAKEST_BIGRAMS before giving advice.";

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      prompt,
      temperature: 0,
      maxOutputTokens: 220,
      providerOptions: {
        google: {
          thinkingConfig: { thinkingBudget: 0 },
        },
      },
    });

    const responseText = result.text.trim();
    const responseLower = responseText.toLowerCase();
    const checks = {
      exactAverageWpm: responseLower.includes("74"),
      exactAverageAccuracy: responseLower.includes("91"),
      personalBest: responseLower.includes("84"),
      weakestBigram: responseLower.includes("th"),
      sessionCount:
        responseLower.includes("3 session") ||
        responseLower.includes("3-session"),
      swiftTypeFeature:
        responseLower.includes("curriculum") ||
        responseLower.includes("adaptive") ||
        responseLower.includes("key highlight"),
    };

    const coreIntegrationPassed =
      checks.personalBest && checks.weakestBigram && checks.swiftTypeFeature;

    if (!coreIntegrationPassed) {
      throw new Error(
        `Core integration signals missing: ${JSON.stringify(checks, null, 2)}\n\n${responseText}`,
      );
    }

    const transcript = [
      {
        id: randomUUID(),
        role: "user",
        parts: [{ type: "text", text: prompt }],
      },
      {
        id: randomUUID(),
        role: "assistant",
        parts: [{ type: "text", text: responseText }],
      },
    ];

    const key = chatKey(userId, chatId);
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(transcript),
        ContentType: "application/json",
      }),
    );

    const object = await r2.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      }),
    );
    const body = await object.Body.transformToString();
    const roundTrip = JSON.parse(body);

    if (!Array.isArray(roundTrip) || roundTrip.length !== 2) {
      throw new Error(`Unexpected R2 transcript payload: ${body}`);
    }

    if (roundTrip[1]?.parts?.[0]?.text !== responseText) {
      throw new Error(
        "R2 transcript round-trip did not preserve assistant text",
      );
    }

    await client.query("commit");
    await client.query(`delete from user_stats where user_id = $1`, [userId]);
    await client.query(`delete from typing_sessions where user_id = $1`, [
      userId,
    ]);
    await client.query(`delete from chat_sessions where user_id = $1`, [
      userId,
    ]);
    await client.query(`delete from users where id = $1`, [userId]);
    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      }),
    );

    writeFileSync(
      logPath,
      JSON.stringify(
        {
          ok: true,
          coreIntegrationPassed,
          strictNumericGroundingPassed:
            checks.exactAverageWpm && checks.exactAverageAccuracy,
          checks,
          typingContext,
          prompt,
          responseText,
          r2Key: key,
        },
        null,
        2,
      ),
    );

    console.log("DEEP_AI_LIVE_OK");
    console.log(
      `STRICT_NUMERIC_GROUNDING=${checks.exactAverageWpm && checks.exactAverageAccuracy ? "pass" : "warn"}`,
    );
    console.log(`LOG=${logPath}`);
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  writeFileSync(
    "scripts/deep-ai-live.log",
    String(error.stack || error.message || error),
  );
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
