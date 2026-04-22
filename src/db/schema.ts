import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ─── AUTH TABLES (NextAuth Drizzle Adapter) ──────────────────────────────────

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique().notNull(),
  password: text("password"),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    uniqueIndex("provider_account_idx").on(
      table.provider,
      table.providerAccountId,
    ),
  ],
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [
    uniqueIndex("verification_token_idx").on(table.identifier, table.token),
  ],
);

// ─── SWIFT TYPE TABLES ───────────────────────────────────────────────────────

export const sessions = pgTable(
  "typing_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: timestamp("date", { mode: "date" }).notNull(),
    wpm: integer("wpm").notNull(),
    accuracy: integer("accuracy").notNull(),
    mode: text("mode").notNull(),
    duration: integer("duration").notNull(),
    keystrokes: integer("keystrokes").notNull(),
    historyData:
      jsonb("history_data").$type<
        Array<{ second: number; wpm: number; raw: number }>
      >(),
  },
  (table) => [
    index("typing_sessions_user_id_idx").on(table.userId),
    index("typing_sessions_date_idx").on(table.date),
  ],
);

export const userStats = pgTable("user_stats", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  perKeyStats: jsonb("per_key_stats")
    .$type<
      Record<string, { hits: number; misses: number; totalTimeMs: number }>
    >()
    .default({}),
  nGramStats: jsonb("n_gram_stats")
    .$type<
      Record<
        string,
        { occurrences: number; misses: number; totalTimeMs: number }
      >
    >()
    .default({}),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  hasPlayedIntro: boolean("has_played_intro").default(false),
  preferredLevel: text("preferred_level").default("beginner"),
  preferredMode: text("preferred_mode").default("timed"),
  preferredDuration: integer("preferred_duration").default(60),
  goalReminderEnabled: boolean("goal_reminder_enabled").default(true),
  preferredGoalPeriod: text("preferred_goal_period").default("daily"),
  preferredGoalTemplate: text("preferred_goal_template"),
  sidebarDismissedAt: timestamp("sidebar_dismissed_at", { mode: "date" }),
});

export const userGoals = pgTable(
  "user_goals",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    periodType: text("period_type").notNull(),
    goalType: text("goal_type").notNull(),
    targetValue: integer("target_value").notNull(),
    currentValue: integer("current_value").notNull().default(0),
    requiredSessions: integer("required_sessions").notNull().default(1),
    currentSessions: integer("current_sessions").notNull().default(0),
    status: text("status").notNull().default("active"),
    timezone: text("timezone").notNull().default("UTC"),
    startedAt: timestamp("started_at", { mode: "date" }).notNull(),
    endsAt: timestamp("ends_at", { mode: "date" }).notNull(),
    completedAt: timestamp("completed_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
  },
  (table) => [index("user_goals_user_id_idx").on(table.userId)],
);

export const userStreaks = pgTable("user_streaks", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  lastQualifiedAt: timestamp("last_qualified_at", { mode: "date" }),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const userRewards = pgTable(
  "user_rewards",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rewardType: text("reward_type").notNull(),
    rewardKey: text("reward_key").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    earnedAt: timestamp("earned_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("user_reward_key_idx").on(table.userId, table.rewardKey),
    index("user_rewards_user_id_idx").on(table.userId),
  ],
);

export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New Chat"),
    isPinned: boolean("is_pinned").default(false),
    feedback: jsonb("feedback")
      .$type<Record<string, "up" | "down" | null>>()
      .default({}),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
  },
  (table) => [index("chat_sessions_user_id_idx").on(table.userId)],
);

export const adminUsers = pgTable(
  "admin_users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    email: text("email").unique().notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
    lastLoginAt: timestamp("last_login_at", { mode: "date" }),
  },
  (table) => [index("admin_users_email_idx").on(table.email)],
);

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    adminUserId: text("admin_user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { mode: "date" }).defaultNow(),
    endedAt: timestamp("ended_at", { mode: "date" }),
  },
  (table) => [
    index("admin_sessions_admin_user_id_idx").on(table.adminUserId),
    index("admin_sessions_created_at_idx").on(table.createdAt),
  ],
);

export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    adminUserId: text("admin_user_id").references(() => adminUsers.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    durationMs: integer("duration_ms"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  },
  (table) => [
    index("admin_audit_logs_admin_user_id_idx").on(table.adminUserId),
    index("admin_audit_logs_created_at_idx").on(table.createdAt),
    index("admin_audit_logs_entity_type_idx").on(table.entityType),
  ],
);

// ─── USER REVIEWS (Testimonials) ─────────────────────────────────────────────

export const REVIEW_ROLES = [
  "Founder",
  "CTO",
  "Developer",
  "Engineer",
  "Instructor",
  "Learner",
  "Enthusiast",
  "Explorer",
  "Swift Typist",
] as const;

export type ReviewRole = (typeof REVIEW_ROLES)[number];

export const ROLE_PRIORITY: Record<ReviewRole, number> = {
  Founder: 1,
  CTO: 2,
  Developer: 3,
  Engineer: 4,
  Instructor: 5,
  Learner: 6,
  Enthusiast: 7,
  Explorer: 8,
  "Swift Typist": 9,
};

export const KEY_ROLES: ReviewRole[] = [
  "Founder",
  "CTO",
  "Developer",
  "Engineer",
  "Instructor",
];

export const userReviews = pgTable(
  "user_reviews",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userName: text("user_name").notNull(),
    userImage: text("user_image"),
    content: text("content").notNull(),
    role: text("role").notNull().default("Swift Typist"),
    organisation: text("organisation"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
  },
  (table) => [uniqueIndex("user_reviews_user_id_idx").on(table.userId)],
);
