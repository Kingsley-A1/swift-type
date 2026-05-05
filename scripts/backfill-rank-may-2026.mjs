/**
 * Swift Rank — May 2026 Backfill Script
 *
 * Retroactively awards XP for all typing sessions completed from
 * 2026-05-01 onwards that haven't been scored yet, then rebuilds
 * every affected user's snapshot and recomputes global ranks.
 *
 * Safe to run multiple times — duplicate-session guard prevents double-counting.
 *
 * Usage:
 *   node scripts/backfill-rank-may-2026.mjs
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import pg from 'pg';

// ─── Load DB credentials ──────────────────────────────────────────────────────

const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
const dbLine = envFile.split('\n').find(l => l.startsWith('DATABASE_URL='));
if (!dbLine) throw new Error('DATABASE_URL not found in .env.local');
const dbUrl = dbLine.substring('DATABASE_URL='.length).trim()
  .replace(/^"|"$/g, '').replace(/^'|'$/g, '');

// Single client — same pattern as migrate-rank-tables.mjs (confirmed working)
const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

const PERIOD = '2026-05';
const PERIOD_START = '2026-05-01T00:00:00.000Z';
const PERIOD_END   = '2026-06-01T00:00:00.000Z';

// XP weights (must mirror src/lib/swiftRank.ts exactly)
const WEIGHT_WPM      = 1.0;
const WEIGHT_ACCURACY = 0.8;
const WEIGHT_DURATION = 2.0; // per minute
const WEIGHT_STREAK   = 0.5;
const MAX_STREAK_BONUS = 30;

function calculateXp({ wpm, accuracy, durationSeconds, streak }) {
  const durationMinutes = durationSeconds / 60;
  const cappedStreak = Math.min(streak, MAX_STREAK_BONUS);

  const wpmContribution      = Math.round(wpm * WEIGHT_WPM);
  const accuracyContribution = Math.round(accuracy * WEIGHT_ACCURACY);
  const durationContribution = Math.round(durationMinutes * WEIGHT_DURATION);
  const streakContribution   = Math.round(cappedStreak * WEIGHT_STREAK);

  return {
    xpAwarded: wpmContribution + accuracyContribution + durationContribution + streakContribution,
    wpmContribution,
    accuracyContribution,
    durationContribution,
    streakContribution,
  };
}

function resolveTier(totalXp) {
  const tiers = [
    { name: 'Elite',    minXp: 12000 },
    { name: 'Platinum', minXp: 7000  },
    { name: 'Gold',     minXp: 3500  },
    { name: 'Silver',   minXp: 1500  },
    { name: 'Bronze',   minXp: 500   },
    { name: 'Rookie',   minXp: 0     },
  ];
  return (tiers.find(t => totalXp >= t.minXp) ?? tiers[tiers.length - 1]).name;
}

async function run() {
  await client.connect();
  console.log('\n🚀 Swift Rank — May 2026 Backfill Starting\n');
  console.log(`   Period  : ${PERIOD}`);
  console.log(`   Window  : ${PERIOD_START} → ${PERIOD_END}\n`);

  try {
    // ── 1. Fetch ALL sessions in May 2026 ─────────────────────────────────────
    const { rows: allSessions } = await client.query(`
      SELECT
        ts.id,
        ts.user_id,
        ts.wpm,
        ts.accuracy,
        ts.duration,
        ts.date,
        COALESCE(us.current_streak, 0) AS current_streak
      FROM typing_sessions ts
      LEFT JOIN user_streaks us ON us.user_id = ts.user_id
      WHERE ts.date >= $1 AND ts.date < $2
      ORDER BY ts.date ASC
    `, [PERIOD_START, PERIOD_END]);

    console.log(`📋 Sessions found in May 2026: ${allSessions.length}`);

    if (allSessions.length === 0) {
      console.log('   ⚠️  No sessions found. Nothing to backfill.');
      return;
    }

    // ── 2. Find sessions already in the ledger ────────────────────────────────
    const sessionIds = allSessions.map(s => s.id);
    const placeholders = sessionIds.map((_, i) => `$${i + 1}`).join(',');
    const { rows: alreadyScored } = sessionIds.length > 0
      ? await client.query(
          `SELECT session_id FROM user_xp_ledger WHERE session_id IN (${placeholders})`,
          sessionIds,
        )
      : { rows: [] };

    const scoredSet = new Set(alreadyScored.map(r => r.session_id));
    const toProcess = allSessions.filter(s => !scoredSet.has(s.id));

    console.log(`✅ Already scored  : ${scoredSet.size}`);
    console.log(`🆕 To backfill     : ${toProcess.length}\n`);

    if (toProcess.length === 0) {
      console.log('✅ All sessions already scored — ledger is up to date.');
    } else {
      // ── 3. Insert XP ledger entries in batches ──────────────────────────────
      let inserted = 0;
      for (const sess of toProcess) {
        const xp = calculateXp({
          wpm: Number(sess.wpm),
          accuracy: Number(sess.accuracy),
          durationSeconds: Number(sess.duration),
          streak: Number(sess.current_streak),
        });

        await client.query(`
          INSERT INTO user_xp_ledger
            (id, user_id, session_id, period, xp_awarded,
             wpm_contribution, accuracy_contribution,
             duration_contribution, streak_contribution, created_at)
          VALUES
            (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT DO NOTHING
        `, [
          sess.user_id,
          sess.id,
          PERIOD,
          xp.xpAwarded,
          xp.wpmContribution,
          xp.accuracyContribution,
          xp.durationContribution,
          xp.streakContribution,
          new Date(sess.date),
        ]);
        inserted++;

        if (inserted % 50 === 0) {
          process.stdout.write(`\r   Inserted ${inserted}/${toProcess.length} ledger entries…`);
        }
      }
      console.log(`\r   Inserted ${inserted}/${toProcess.length} ledger entries ✅`);
    }

    // ── 4. Get every distinct user with ANY session in May 2026 ───────────────
    const distinctUsers = [...new Set(allSessions.map(s => s.user_id))];
    console.log(`\n👤 Users to snapshot: ${distinctUsers.length}`);

    // ── 5. Rebuild snapshot for every user ────────────────────────────────────
    let snapshotted = 0;
    for (const userId of distinctUsers) {
      // Total XP for this user in this period
      const { rows: xpRows } = await client.query(`
        SELECT COALESCE(SUM(xp_awarded), 0) AS total_xp
        FROM user_xp_ledger
        WHERE user_id = $1 AND period = $2
      `, [userId, PERIOD]);

      const totalXp = Number(xpRows[0].total_xp);
      const tier = resolveTier(totalXp);

      // Session aggregates for the period
      const { rows: sessAgg } = await client.query(`
        SELECT
          COALESCE(AVG(wpm), 0)          AS avg_wpm,
          COALESCE(AVG(accuracy), 0)     AS avg_accuracy,
          COUNT(id)                      AS total_sessions,
          COALESCE(SUM(duration), 0)     AS total_duration_seconds
        FROM typing_sessions
        WHERE user_id = $1 AND date >= $2 AND date < $3
      `, [userId, PERIOD_START, PERIOD_END]);

      const agg = sessAgg[0];

      // Best streak
      const { rows: streakRows } = await client.query(`
        SELECT COALESCE(best_streak, 0) AS best_streak
        FROM user_streaks
        WHERE user_id = $1
      `, [userId]);

      const bestStreak = Number(streakRows[0]?.best_streak ?? 0);
      const avgWpm = Number(agg.avg_wpm);
      const avgAccuracy = Number(agg.avg_accuracy);
      const totalSessions = Number(agg.total_sessions);
      const totalPracticeMinutes = Number(agg.total_duration_seconds) / 60;

      await client.query(`
        INSERT INTO swift_rank_snapshots
          (id, user_id, period, total_xp, tier,
           avg_wpm, avg_accuracy, total_sessions,
           total_practice_minutes, best_streak, snapshot_at)
        VALUES
          (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (user_id, period) DO UPDATE SET
          total_xp              = EXCLUDED.total_xp,
          tier                  = EXCLUDED.tier,
          avg_wpm               = EXCLUDED.avg_wpm,
          avg_accuracy          = EXCLUDED.avg_accuracy,
          total_sessions        = EXCLUDED.total_sessions,
          total_practice_minutes = EXCLUDED.total_practice_minutes,
          best_streak           = EXCLUDED.best_streak,
          snapshot_at           = NOW()
      `, [userId, PERIOD, totalXp, tier, avgWpm, avgAccuracy, totalSessions, totalPracticeMinutes, bestStreak]);

      snapshotted++;
      if (snapshotted % 20 === 0) {
        process.stdout.write(`\r   Snapshotted ${snapshotted}/${distinctUsers.length} users…`);
      }
    }
    console.log(`\r   Snapshotted ${snapshotted}/${distinctUsers.length} users ✅`);

    // ── 6. Recompute global RANK() for all snapshots in May 2026 ─────────────
    console.log('\n🏆 Recomputing global ranks…');
    await client.query(`
      UPDATE swift_rank_snapshots AS s
      SET rank = sub.computed_rank
      FROM (
        SELECT id,
               RANK() OVER (PARTITION BY period ORDER BY total_xp DESC) AS computed_rank
        FROM swift_rank_snapshots
        WHERE period = $1
      ) AS sub
      WHERE s.id = sub.id AND s.period = $1
    `, [PERIOD]);

    // ── 7. Summary report ─────────────────────────────────────────────────────
    const { rows: summary } = await client.query(`
      SELECT
        COUNT(*)                    AS total_users,
        SUM(total_xp)               AS total_xp_pool,
        MAX(total_xp)               AS highest_xp,
        AVG(total_xp)::int          AS avg_xp,
        SUM(total_sessions)         AS total_sessions,
        tier,
        COUNT(*) FILTER (WHERE rank = 1) AS first_place
      FROM swift_rank_snapshots
      WHERE period = $1
      GROUP BY tier
      ORDER BY MAX(total_xp) DESC
    `, [PERIOD]);

    console.log('\n─────────────────────────────────────────────────────');
    console.log('  Swift Rank — May 2026 Summary');
    console.log('─────────────────────────────────────────────────────');
    summary.forEach(row => {
      console.log(`  ${row.tier.padEnd(10)} │ ${String(row.total_users).padStart(4)} users │ avg ${row.avg_xp} XP │ max ${row.highest_xp} XP`);
    });
    console.log('─────────────────────────────────────────────────────');

    const { rows: [totals] } = await client.query(`
      SELECT COUNT(*) AS total FROM swift_rank_snapshots WHERE period = $1
    `, [PERIOD]);
    console.log(`\n  Total ranked users: ${totals.total}`);
    console.log('\n✅ Backfill complete — Swift Rank is live from May 1, 2026.\n');

  } finally {
    await client.end();
  }
}

run().catch(err => {
  console.error('\n❌ Backfill failed:', err.message);
  process.exit(1);
});
