/**
 * Swift Rank — XP Engine
 *
 * Single source of truth for XP calculation and tier assignment.
 * All numbers are integers to keep the DB clean (no float drift).
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface XpBreakdown {
  xpAwarded: number;
  wpmContribution: number;
  accuracyContribution: number;
  durationContribution: number;
  streakContribution: number;
}

export interface RankTier {
  name: string;
  minXp: number;
  color: string;
  emoji: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  rank: number;
  tier: string;
  tierEmoji: string;
  totalXp: number;
  avgWpm: number;
  avgAccuracy: number;
  totalSessions: number;
  totalPracticeMinutes: number;
  bestStreak: number;
  isAnonymous: boolean;
}

export interface XpLedgerEntry {
  id: string;
  sessionId: string | null;
  period: string;
  xpAwarded: number;
  wpmContribution: number;
  accuracyContribution: number;
  durationContribution: number;
  streakContribution: number;
  createdAt: Date | null;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

export const SWIFT_RANK_TIERS: RankTier[] = [
  { name: "Rookie",   minXp: 0,      color: "#9ca3af", emoji: "⚪" },
  { name: "Bronze",   minXp: 500,    color: "#cd7f32", emoji: "🥉" },
  { name: "Silver",   minXp: 1_500,  color: "#9ca3af", emoji: "🥈" },
  { name: "Gold",     minXp: 3_500,  color: "#f59e0b", emoji: "🥇" },
  { name: "Platinum", minXp: 7_000,  color: "#60a5fa", emoji: "💎" },
  { name: "Elite",    minXp: 12_000, color: "#fa4c0c", emoji: "🏆" },
];

// XP weights — see strategy doc for rationale
const WEIGHT_WPM      = 1.0;
const WEIGHT_ACCURACY = 0.8;
const WEIGHT_DURATION = 2.0; // per minute
const WEIGHT_STREAK   = 0.5;
const MAX_STREAK_BONUS = 30; // caps at 30 days

export const CURRENT_PERIOD = (): string => {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

// ─── XP CALCULATION ───────────────────────────────────────────────────────────

export function calculateSessionXp(params: {
  wpm: number;
  accuracy: number; // 0–100
  durationSeconds: number;
  currentStreak: number;
}): XpBreakdown {
  const { wpm, accuracy, durationSeconds, currentStreak } = params;

  const durationMinutes = durationSeconds / 60;
  const cappedStreak = Math.min(currentStreak, MAX_STREAK_BONUS);

  const wpmContribution      = Math.round(wpm * WEIGHT_WPM);
  const accuracyContribution = Math.round(accuracy * WEIGHT_ACCURACY);
  const durationContribution = Math.round(durationMinutes * WEIGHT_DURATION);
  const streakContribution   = Math.round(cappedStreak * WEIGHT_STREAK);

  const xpAwarded =
    wpmContribution +
    accuracyContribution +
    durationContribution +
    streakContribution;

  return {
    xpAwarded,
    wpmContribution,
    accuracyContribution,
    durationContribution,
    streakContribution,
  };
}

// ─── TIER RESOLUTION ─────────────────────────────────────────────────────────

export function resolveRankTier(totalXp: number): RankTier {
  // Walk backwards — highest tier first
  for (let i = SWIFT_RANK_TIERS.length - 1; i >= 0; i--) {
    if (totalXp >= SWIFT_RANK_TIERS[i].minXp) {
      return SWIFT_RANK_TIERS[i];
    }
  }
  return SWIFT_RANK_TIERS[0];
}

export function getTierInfo(tierName: string): RankTier {
  return SWIFT_RANK_TIERS.find((t) => t.name === tierName) ?? SWIFT_RANK_TIERS[0];
}
