# Swift Rank — Engineering Strategy
> Version 1.0 · Swift Type Platform · Authored: May 2026

---

## 1. What We Are Building

A **global, real-time competitive leaderboard** — the "Premier League table" of Swift Type. Every authenticated user earns **Swift XP** from their typing activity. XP rolls up into a **monthly rank** that resets at the start of each calendar month, rewarding consistent improvement, not just one-time performance.

Clicking any row in the global table opens a **per-user Rank Audit Modal** that explains exactly how their rank was calculated, their contribution breakdown across each metric, and how Swift XP is awarded.

---

## 2. Design Principles

| Principle | Rationale |
|---|---|
| **Computed, not stored raw** | Ranks are derived from existing data (`typing_sessions`, `user_streaks`, `user_stats`). We store only the final XP and snapshot — not re-run the formula on every request. |
| **Monthly window** | Resets eliminate permanent dominance. New users can compete every cycle — same as EPL season resets. |
| **Server-side ranking** | Ranking SQL runs on the DB (`RANK() OVER`), not in application code. This scales to thousands of users without a performance hit. |
| **Opt-in display name** | Users can choose to appear as anonymous in the public table. Privacy by default. |
| **Incremental recalculation** | XP is recalculated only on session-save, not on every page load. The leaderboard table is a cached materialized view refreshed on a schedule and on-demand. |

---

## 3. The XP Formula

Swift XP is awarded per completed typing session using a **weighted composite score**:

```
Session XP =
  (netWPM × 1.0)               // Speed — raw contribution
  + (accuracy × 0.8)           // Accuracy — quality gate
  + (durationMinutes × 2.0)    // Practice time — consistency reward
  + (currentStreak × 0.5)      // Streak — habit multiplier (capped at 30)
```

### Why these weights?

- **Speed (1.0×):** The primary metric, but not inflated — a 120 WPM typist shouldn't utterly dominate.
- **Accuracy (0.8×):** Applied to the `accuracy` percentage (0–100). Rewards clean typing over spray-and-pray at high WPM.
- **Duration (2.0×):** The heaviest per-unit weight because consistent practice time is the strongest long-term predictor of improvement. Casual one-minute sessions score poorly.
- **Streak (0.5×):** A daily habit bonus, capped at 30 days to prevent compounding unfairness. Rewards regularity without permanently handicapping new users.

### Tier assignment (monthly XP total):

| Tier | Min XP | Badge |
|---|---|---|
| **Rookie** | 0 | ⚪ |
| **Bronze** | 500 | 🥉 |
| **Silver** | 1,500 | 🥈 |
| **Gold** | 3,500 | 🥇 |
| **Platinum** | 7,000 | 💎 |
| **Elite** | 12,000+ | 🏆 |

---

## 4. Database — New Tables

The project uses **Drizzle ORM** with PostgreSQL. Two new tables are required.

### 4.1 `user_xp_ledger`

Records every XP-earning event. This is the audit trail — it explains *why* a user has the XP they have.

```ts
// src/db/schema.ts (addition)
export const userXpLedger = pgTable(
  "user_xp_ledger",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => sessions.id, { onDelete: "set null" }),
    period: text("period").notNull(), // "2026-05" — YYYY-MM
    xpAwarded: integer("xp_awarded").notNull(),
    wpmContribution: integer("wpm_contribution").notNull(),
    accuracyContribution: integer("accuracy_contribution").notNull(),
    durationContribution: integer("duration_contribution").notNull(),
    streakContribution: integer("streak_contribution").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  },
  (t) => [
    index("xp_ledger_user_period_idx").on(t.userId, t.period),
    index("xp_ledger_period_idx").on(t.period),
  ]
);
```

### 4.2 `swift_rank_snapshots`

Stores the pre-computed monthly rank for each user. Refreshed on session-save (for the current user) and by a scheduled cron job (for the full table, every 10 minutes).

```ts
export const swiftRankSnapshots = pgTable(
  "swift_rank_snapshots",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    period: text("period").notNull(),          // "2026-05"
    totalXp: integer("total_xp").notNull().default(0),
    rank: integer("rank"),                      // position: 1, 2, 3…
    tier: text("tier").notNull().default("Rookie"),
    avgWpm: integer("avg_wpm").notNull().default(0),
    avgAccuracy: integer("avg_accuracy").notNull().default(0),
    totalSessions: integer("total_sessions").notNull().default(0),
    totalPracticeMinutes: integer("total_practice_minutes").notNull().default(0),
    bestStreak: integer("best_streak").notNull().default(0),
    displayName: text("display_name"),          // null → shows real name
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    snapshotAt: timestamp("snapshot_at", { mode: "date" }).defaultNow(),
  },
  (t) => [
    uniqueIndex("swift_rank_user_period_idx").on(t.userId, t.period),
    index("swift_rank_period_idx").on(t.period),
    index("swift_rank_xp_idx").on(t.period, t.totalXp), // for ORDER BY performance
  ]
);
```

> **Why two tables?** The ledger is immutable audit history. The snapshot is the materialised, queryable state. Separating them keeps the leaderboard query fast and keeps the audit trail clean.

---

## 5. Backend API Design

All endpoints live under `/api/rank/`.

### `GET /api/rank/leaderboard?period=2026-05&limit=100&offset=0`

Returns the paginated global table. Reads from `swift_rank_snapshots`, sorted by `rank ASC`. No auth required (public leaderboard). Anonymised names respected.

**Response shape:**
```ts
{
  period: string;          // "2026-05"
  totalParticipants: number;
  myRank: RankEntry | null; // the authed user's own row, always included
  entries: RankEntry[];
}

type RankEntry = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  rank: number;
  tier: string;
  totalXp: number;
  avgWpm: number;
  avgAccuracy: number;
  totalSessions: number;
  totalPracticeMinutes: number;
  bestStreak: number;
  isAnonymous: boolean;
};
```

**Why include `myRank` separately?** The authenticated user may be ranked #847. If we only return the top 100, they would not see themselves. The API always appends their row regardless of offset.

---

### `GET /api/rank/user/[userId]?period=2026-05`

Returns the detailed audit breakdown for a specific user (or `me` alias for the authed user). Uses the `user_xp_ledger` to show per-session breakdown. Used by the Rank Audit Modal.

---

### `POST /api/rank/recalculate` (internal/cron)

Triggered:
1. **On session save** — recalculates only the current user's snapshot for the current period.
2. **By a Vercel Cron Job** (every 10 minutes) — recalculates ALL snapshots for the current period and recomputes `RANK()`.

The rank column uses PostgreSQL's window function:
```sql
RANK() OVER (PARTITION BY period ORDER BY total_xp DESC)
```

This runs entirely in the DB — no in-app sorting.

---

## 6. UI Architecture

### 6.1 The Global Leaderboard Panel (`SwiftRankPanel.tsx`)

Slides in from the right (same pattern as Goals, Rewards). Has three visual zones:

```
┌─────────────────────────────────────┐
│  🏆 Swift Rank  │ MAY 2026  │  [X]  │ ← Header with period selector
├─────────────────────────────────────┤
│  YOUR RANK     #12  Gold 🥇         │ ← Pinned user row (always visible)
│  4,820 XP  ·  67 WPM  ·  96% acc   │
├─────────────────────────────────────┤
│  #  Name           XP    Tier       │ ← EPL-style table header
│  1  Kingsley A.   9,210  Platinum   │
│  2  swift_user2   8,440  Platinum   │
│  3  …                              │
│  …                                 │
│  [Load more]                       │
└─────────────────────────────────────┘
```

**Design decisions:**
- Alternating row shading (very subtle) for scannability — exactly like a real football table.
- The user's own row is **highlighted in brand-orange** regardless of their position.
- Tier badge is a colored pill (not just text).
- Each row is **clickable** — opens the Rank Audit Modal.

---

### 6.2 Rank Audit Modal (`RankAuditModal.tsx`)

Opens as a centered overlay when a leaderboard row is clicked.

```
┌──────────────────────────────────────────────────────┐
│  Kingsley A.  ·  Rank #12  ·  Gold 🥇                │
│  May 2026                              [Close]       │
├──────────────────────────────────────────────────────┤
│  TOTAL XP: 4,820                                     │
│  ┌──────────┬──────────┬──────────┬──────────┐       │
│  │  Speed   │ Accuracy │ Practice │  Streak  │       │
│  │  2,140   │  1,820   │   680    │   180    │       │
│  └──────────┴──────────┴──────────┴──────────┘       │
├──────────────────────────────────────────────────────┤
│  How Swift XP is calculated              [?]         │
│  ────────────────────────────────────────────        │
│  XP = (WPM × 1) + (Accuracy × 0.8)                  │
│       + (Minutes × 2) + (Streak × 0.5, max 30)      │
├──────────────────────────────────────────────────────┤
│  SESSION BREAKDOWN (last 10)                         │
│  May 04  ·  67 WPM  ·  96%  ·  60s  →  +124 XP      │
│  May 03  ·  65 WPM  ·  98%  ·  60s  →  +121 XP      │
│  …                                                   │
└──────────────────────────────────────────────────────┘
```

---

### 6.3 AppSidebar — Unlock the "Swift Rank" Item

The `SwiftRank` nav item already exists in the sidebar but is `disabled`. Once implemented, remove the `disabled` prop and wire it to `onOpenRank`.

---

## 7. Monthly Reset & Rewards

At the end of each month (first cron job of the new month):
1. **Snapshot is frozen** for the previous period — data never deleted, only read-only.
2. **Top 3 users** per tier receive a `user_rewards` entry with `rewardType: "rank"` — this surfaces in the existing Rewards panel automatically.
3. New-month snapshot starts at 0 XP.

**Why not reset in the DB?** We don't delete. Old `swift_rank_snapshots` rows for past periods remain for historical viewing. The period filter on the leaderboard API controls which month is displayed.

---

## 8. Phased Delivery

| Phase | Scope | Effort |
|---|---|---|
| **1 — Foundation** | DB migration (two new tables), XP calculation on session-save, `/api/rank` endpoints | ~1 day |
| **2 — Leaderboard UI** | `SwiftRankPanel` component, global table, pinned user row, AppSidebar wiring | ~1 day |
| **3 — Audit Modal** | `RankAuditModal`, per-user XP breakdown, formula explainer | ~0.5 days |
| **4 — Monthly Rewards** | Cron job, end-of-period badge grant, Rewards panel integration | ~0.5 days |
| **5 — Polish** | Animations, real-time refresh (polling every 60s), anonymous mode toggle in Profile | ~0.5 days |

**Total estimated engineering: ~3.5 focused days.**

---

## 9. What We Are NOT Doing (and Why)

| Skipped | Reason |
|---|---|
| WebSockets for live updates | Overkill for a leaderboard. 60-second polling is imperceptible and eliminates infrastructure complexity. |
| Per-key XP modifiers | Overcomplicates the formula. The current weighting is transparent and easy to explain to users. |
| Infinite historical leaderboards | Previous months are viewable via the period selector but not the primary view. Keeps the UI focused. |
| Admin-adjustable XP | No manual XP grants. The formula is the only source of truth — preserves fairness and trust. |

---

*Next step: Begin Phase 1 — DB schema addition and Drizzle migration on your confirmation.*
