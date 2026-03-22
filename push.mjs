import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(process.cwd(), '.env.local');

const envFile = readFileSync(envPath, 'utf-8');
const lines = envFile.split('\n');
const dbLine = lines.find(l => l.startsWith('DATABASE_URL='));
if (!dbLine) throw new Error("Could not find DATABASE_URL in .env.local");

const dbUrl = dbLine.substring('DATABASE_URL='.length).trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');

console.log("Pushing schema to NeonDB...");

try {
  const out = execSync('npx drizzle-kit push --force', { 
    env: { ...process.env, DATABASE_URL: dbUrl }, 
  });
  console.log("Schema push complete!", out.toString());
} catch(e) {
  console.error("DIAGNOSTIC ERROR:");
  console.error(e.stdout ? e.stdout.toString() : e);
  console.error("STDERR:", e.stderr ? e.stderr.toString() : '');
}
