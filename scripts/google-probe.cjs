const { readFileSync, writeFileSync } = require('fs');

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

async function main() {
  loadEnv('.env.local');

  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) {
    throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY');
  }

  const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
  const modelsJson = await modelsResponse.json();

  const generateResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: 'Reply with exactly: SWIFT_AI_OK' }],
          },
        ],
      }),
    },
  );
  const generateJson = await generateResponse.json();

  writeFileSync(
    'scripts/google-probe.log',
    JSON.stringify(
      {
        modelsStatus: modelsResponse.status,
        modelsJson,
        generateStatus: generateResponse.status,
        generateJson,
      },
      null,
      2,
    ),
  );

  console.log('GOOGLE_PROBE_DONE');
}

main().catch((error) => {
  writeFileSync('scripts/google-probe.log', String(error.stack || error.message || error));
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
