import { readFileSync } from 'fs';
import { join } from 'path';
import pg from 'pg';

const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
const dbLine = envFile.split('\n').find(l => l.startsWith('DATABASE_URL='));
const dbUrl = dbLine.substring('DATABASE_URL='.length).trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
await client.connect();

const res = await client.query(`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('user_xp_ledger', 'swift_rank_snapshots')
  ORDER BY table_name;
`);

console.log('Swift Rank tables found:', res.rows.map(r => r.table_name));

if (res.rows.length === 2) {
  console.log('✅ Migration SUCCESS — both tables exist in NeonDB.');
} else {
  console.log('⚠️  Tables not found. Running push now...');
}

await client.end();
