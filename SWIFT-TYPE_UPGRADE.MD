# SWIFT TYPE → SWIFT TYPE 2.0: The Intelligence Upgrade

### _From adaptive typing trainer to AI-powered keyboard mastery platform_

---

## 0. What We Have (The Foundation — And It's Solid)

After a full audit of every file in this codebase, here's the honest truth: **Swift Type is already excellent.** This is not a rewrite. This is an evolution.

**Current Architecture:**

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **State:** Zustand with `persist` middleware → `localStorage` (key: `swiftyper-storage`)
- **Styling:** Tailwind CSS v4 + `clsx` + `tailwind-merge`
- **Animation:** Framer Motion (spring-based panels, caret, splash)
- **Charts:** Recharts (WPM/history visualization)
- **Icons:** Lucide React
- **Fonts:** Inter (UI) + JetBrains Mono (typing interface)
- **PWA:** `next-pwa` with service worker + offline caching
- **Deploy:** Vercel

**What's Already Working Well:**
| Feature | Implementation | Quality |
|---|---|---|
| Touch typing engine | `useTypingStore.ts` — keystroke tracking, WPM/accuracy math | Production-grade |
| Adaptive learning | N-gram bigram analysis + per-key struggle scoring | Algorithmic, not gimmick |
| Session history | 200 sessions persisted, lifetime averages, session drilldowns | Complete |
| Keyboard visualization | Dynamic QWERTY/Mac layout, finger-color mapping, next-key glow | Beautiful |
| Curriculum mode | Staged key introduction (home row → top → bottom) | Functional |
| User guide | Slide-out panel with search, section drill-down, level filters | Polished |
| Theme system | Dark/light with CSS variables, smooth transitions | Done |
| Controls | Pill-group selectors (mode, level, duration, word count) | Clean |

**What This Document Adds:**

1. **Swift AI** — A Gemini 2.5 Flash-powered typing coach with full platform awareness
2. **Authentication** — Minimal, passwordless (magic link / OAuth)
3. **CockroachDB** — Persistent user data for authenticated users
4. **Cloudflare R2** — Chat conversation history storage
5. **Dual-mode data layer** — `localStorage` for guests, DB for authenticated users
6. **Chat UI** — Slide-out sidebar matching the User Guide's architecture

---

## 1. The Package Additions (Exact Dependencies)

```bash
# AI SDK + Gemini Provider
pnpm add ai @ai-sdk/google

# Database (CockroachDB via PostgreSQL)
pnpm add @neondatabase/serverless drizzle-orm
pnpm add -D drizzle-kit

# Authentication
pnpm add next-auth@beta @auth/drizzle-adapter

# Cloudflare R2 (S3-compatible)
pnpm add @aws-sdk/client-s3

# UUID generation (for chat sessions)
# Already available — crypto.randomUUID() is used throughout the codebase
```

**Why these exact libraries:**

- **`ai` (Vercel AI SDK):** The `useChat` hook handles streaming, message management, and abort control out of the box. We write zero streaming logic.
- **`@ai-sdk/google`:** Official Gemini provider for AI SDK. Supports `gemini-2.5-flash` directly.
- **`@neondatabase/serverless`:** CockroachDB is PostgreSQL-compatible. This driver works over HTTP (serverless-friendly, no connection pooling headaches on Vercel).
- **`drizzle-orm`:** Type-safe SQL. No Prisma bloat. Schema lives in TypeScript.
- **`next-auth@beta`:** v5 supports App Router natively. Handles sessions, JWT, OAuth, magic links.
- **`@aws-sdk/client-s3`:** R2 is S3-compatible. This is the standard way to talk to it.

---

## 2. Architecture: The Dual-Mode Data Layer

This is the core strategic decision. Swift Type currently stores everything in `localStorage` via Zustand's `persist` middleware. We **keep this for unauthenticated users** and add a DB sync layer for authenticated ones.

### 2.1 The Principle: No User Left Behind

```
┌─────────────────────────────────────────────────────────────┐
│                      SWIFT TYPE CLIENT                       │
│                                                              │
│   ┌──────────────────┐     ┌──────────────────────────────┐ │
│   │   Zustand Store   │     │    Auth Context (next-auth)  │ │
│   │  (always active)  │     │   isAuthenticated? user.name │ │
│   └────────┬─────────┘     └──────────┬───────────────────┘ │
│            │                           │                     │
│            ▼                           ▼                     │
│   ┌──────────────────────────────────────────┐               │
│   │          Data Sync Layer                  │               │
│   │  if (guest) → localStorage only           │               │
│   │  if (authed) → API routes → CockroachDB   │               │
│   │               + merge localStorage on      │               │
│   │                 first sign-in              │               │
│   └──────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 What Gets Stored Where

| Data               | Guest (localStorage) | Authenticated (CockroachDB)   |
| ------------------ | -------------------- | ----------------------------- |
| `savedSessions`    | ✅ Zustand persist   | ✅ `sessions` table           |
| `perKeyStats`      | ✅ Zustand persist   | ✅ `user_stats` table (JSONB) |
| `nGramStats`       | ✅ Zustand persist   | ✅ `user_stats` table (JSONB) |
| `hasPlayedIntro`   | ✅ Zustand persist   | ✅ `user_preferences` table   |
| User profile/name  | ❌ N/A               | ✅ `users` table (from Auth)  |
| Chat conversations | ❌ Not available     | ✅ Cloudflare R2 (JSON blobs) |
| Chat session index | ❌ Not available     | ✅ `chat_sessions` table      |

### 2.3 The Merge Strategy (First Sign-In)

When a guest user signs up, their `localStorage` data shouldn't vanish. Here's the flow:

```
User signs in for first time
    → Client reads localStorage (Zustand persisted state)
    → POST /api/sync/merge
        → Server receives { savedSessions, perKeyStats, nGramStats }
        → Server inserts into DB (deduplicates by session.id)
        → Server returns { success: true }
    → Client continues using Zustand locally
    → Background sync pushes new sessions to DB after each completion
```

**Implementation note:** The `endSession` and `tick` functions in `useTypingStore.ts` already create `SessionHistory` objects with `crypto.randomUUID()` IDs. These IDs become the deduplication key during merge.

---

## 3. Database Schema (CockroachDB via Drizzle)

### 3.1 File: `src/db/schema.ts`

```typescript
import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
  real,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // next-auth user ID
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
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
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // matches SessionHistory.id (UUID)
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  wpm: integer("wpm").notNull(),
  accuracy: integer("accuracy").notNull(),
  mode: text("mode").notNull(), // "timed" | "words" | "curriculum"
  duration: integer("duration").notNull(),
  keystrokes: integer("keystrokes").notNull(),
  historyData:
    jsonb("history_data").$type<
      Array<{ second: number; wpm: number; raw: number }>
    >(),
});

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
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  hasPlayedIntro: boolean("has_played_intro").default(false),
  preferredLevel: text("preferred_level").default("beginner"),
  preferredMode: text("preferred_mode").default("timed"),
  preferredDuration: integer("preferred_duration").default(60),
});

export const chatSessions = pgTable("chat_sessions", {
  id: text("id").primaryKey(), // UUID
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("New Chat"),
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Actual messages stored in R2 at: /{userId}/{chatSessionId}.json
});
```

### 3.2 File: `src/db/index.ts`

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### 3.3 Why CockroachDB + Neon Driver?

CockroachDB is PostgreSQL wire-compatible. The `@neondatabase/serverless` driver uses HTTP-based queries — no persistent connections, no connection pooling (PgBouncer), no cold start penalty. Perfect for Vercel's serverless functions where each API route invocation is stateless.

### 3.4 Drizzle Config: `drizzle.config.ts`

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

---

## 4. Cloudflare R2: Chat History Storage

### 4.1 Why R2 Instead of DB for Messages?

Chat conversations are append-heavy, arbitrarily long, and rarely queried individually. Storing them as JSON blobs in object storage is:

- **Cheaper** than row-per-message in a relational DB
- **Faster** to read (single GET returns entire conversation)
- **Simpler** to manage (no chat message table migrations)

### 4.2 R2 Structure

```
swift-type-r2-bucket/
  └── chats/
      └── {userId}/
          └── {chatSessionId}.json
```

Each JSON file:

```json
{
  "id": "chat-session-uuid",
  "messages": [
    {
      "role": "user",
      "content": "How do I improve my pinky accuracy?",
      "timestamp": 1711234567890
    },
    {
      "role": "assistant",
      "content": "Hey Kingsley! I can see from your stats that...",
      "timestamp": 1711234568100
    }
  ]
}
```

### 4.3 File: `src/lib/r2.ts`

```typescript
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

export async function getChatMessages(userId: string, chatId: string) {
  const key = `chats/${userId}/${chatId}.json`;
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const response = await r2.send(command);
  const body = await response.Body?.transformToString();
  return body ? JSON.parse(body) : { id: chatId, messages: [] };
}

export async function saveChatMessages(
  userId: string,
  chatId: string,
  messages: any[],
) {
  const key = `chats/${userId}/${chatId}.json`;
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: JSON.stringify({ id: chatId, messages }),
    ContentType: "application/json",
  });
  await r2.send(command);
}

export async function deleteChatMessages(userId: string, chatId: string) {
  const key = `chats/${userId}/${chatId}.json`;
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  await r2.send(command);
}
```

---

## 5. Authentication: Minimal, Frictionless

### 5.1 Strategy: Don't Block the Keyboard

Swift Type's core value is **instant access to typing practice**. Authentication gates destroy that. Our approach:

- **Anyone can type.** No account needed. Period.
- **Account unlocks Swift AI + cloud sync.** That's the incentive.
- **Auth method:** Google OAuth + GitHub OAuth (one-click, no passwords, no email verification delays)
- **Library:** NextAuth.js v5 (App Router native, JWT sessions, Drizzle adapter)

### 5.2 File: `src/lib/auth.ts`

```typescript
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    // No custom pages — use the modal-based sign-in within the app
  },
});
```

### 5.3 File: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

### 5.4 Auth UI Integration Point

In `Header.tsx`, replace one of the right-side action buttons with a conditional:

```
if (authenticated) → Show user avatar + "Ask Swift" button
if (guest) → Show "Sign In" button (opens modal) + disabled "Ask Swift" with tooltip
```

The sign-in modal is a small overlay (not a separate page) with Google + GitHub buttons. After sign-in, the `useEffect` on the client triggers the localStorage → DB merge (Section 2.3).

### 5.5 Auth State Access Pattern

```typescript
// In any Server Component or API Route:
import { auth } from "@/lib/auth";
const session = await auth();
// session?.user?.id, session?.user?.name, session?.user?.email

// In any Client Component:
import { useSession } from "next-auth/react";
const { data: session, status } = useSession();
// status: "loading" | "authenticated" | "unauthenticated"
```

Wrap the root layout with `<SessionProvider>` from `next-auth/react` so `useSession` works everywhere.

---

## 6. Swift AI: The Intelligence Layer

This is the centerpiece. Not a generic chatbot. A typing coach that knows your data, your patterns, and your name.

### 6.1 How Vercel AI SDK Works (The Leverage)

The Vercel AI SDK (`ai` package) gives us three things we'd otherwise build from scratch:

1. **`useChat` hook** (client) — Manages messages array, handles streaming, provides `input`, `handleInputChange`, `handleSubmit`, `isLoading`, `stop`, `reload`. This is our entire chat client logic.
2. **`streamText` function** (server) — Wraps the Gemini API call with automatic streaming, token counting, and abort handling.
3. **`@ai-sdk/google`** — Provider that translates AI SDK's universal interface to Gemini's API format.

**What we DON'T build:**

- Streaming response rendering (SDK handles it)
- Message state management (SDK handles it)
- Abort/retry logic (SDK handles it)
- Token counting (SDK handles it)
- SSE connection management (SDK handles it)

**What WE build:**

- The system prompt (Swift AI's personality + platform knowledge)
- The context injection (user's real-time typing data)
- The chat UI
- Chat session management (CRUD operations)

### 6.2 The System Prompt: Swift AI's DNA

This is where Swift AI becomes something no generic AI can replicate. The system prompt is dynamically assembled per request, injecting the user's real data:

```typescript
function buildSystemPrompt(
  user: { name: string },
  typingContext: TypingContext,
): string {
  return `You are Swift AI — the intelligent typing coach built into Swift Type, 
a keyboard mastery platform. You are NOT a general-purpose AI. You are a typing expert.

## YOUR IDENTITY
- Name: Swift AI (or just "Swift")
- Platform: Swift Type (swifttype.app)  
- Personality: Warm, encouraging, occasionally witty. You call the user by their 
  first name ("${user.name}"). You celebrate progress and normalize struggle.
- Expertise: Touch typing methodology, keyboard ergonomics, muscle memory science, 
  speed building techniques, accuracy improvement strategies.

## YOUR KNOWLEDGE BASE (Touch Typing Mastery)
- The home row technique (ASDF JKL;) is the foundation of all touch typing
- Each finger has designated keys. Pinky: outer columns. Index: center columns + reach keys
- Speed comes from accuracy first, then muscle memory, then reducing finger travel
- The ideal typing posture: wrists elevated, slight negative tilt, fingers curved
- Common plateaus occur at 40 WPM, 60 WPM, and 80 WPM — each requires different techniques
- Bigram fluency (letter pair combinations) matters more than individual key speed
- The world's fastest typists (200+ WPM) share these traits: perfect home row discipline, 
  minimal finger lift, rhythm-based typing, and years of deliberate practice
- Beginners should NEVER look at their keyboard. The orange key highlight in Swift Type 
  is the visual cue system — trust it

## THE USER'S REAL-TIME DATA
${typingContext.currentMode ? `- Currently practicing in: ${typingContext.currentMode} mode` : "- Not currently in a session"}
${typingContext.totalSessions > 0 ? `- Total practice sessions completed: ${typingContext.totalSessions}` : "- No sessions completed yet (brand new user)"}
${typingContext.averageWpm ? `- Lifetime average WPM: ${typingContext.averageWpm}` : ""}
${typingContext.averageAccuracy ? `- Lifetime average accuracy: ${typingContext.averageAccuracy}%` : ""}
${typingContext.bestWpm ? `- Personal best WPM: ${typingContext.bestWpm}` : ""}
${typingContext.recentSessions ? `- Last 5 sessions: ${typingContext.recentSessions}` : ""}
${typingContext.weakestKeys?.length ? `- Weakest keys (highest error rate): ${typingContext.weakestKeys.join(", ")}` : ""}
${typingContext.weakestBigrams?.length ? `- Weakest bigrams (letter pairs): ${typingContext.weakestBigrams.join(", ")}` : ""}
${typingContext.currentLevel ? `- Current difficulty level: ${typingContext.currentLevel}` : ""}
${typingContext.practiceStreak ? `- Practice streak: ${typingContext.practiceStreak} days` : ""}

## YOUR BEHAVIOR RULES
1. NEVER give generic typing advice. Always reference the user's actual data.
   BAD: "Try to improve your accuracy." 
   GOOD: "${user.name}, your accuracy has been around ${typingContext.averageAccuracy}% — 
          that tells me you're rushing. Let's slow down 10 WPM and watch that number climb."

2. When the user asks about their performance, analyze their ACTUAL session history.

3. Reference Swift Type's features directly:
   - "Try switching to Curriculum mode — it'll rebuild your home row foundation"
   - "Your adaptive engine data shows 'th' and 'er' bigrams are your bottleneck"
   - "Turn on the Adaptive toggle in the control bar — it generates words targeting your weak keys"

4. Keep responses concise. This is a sidebar chat, not an essay. 2-4 paragraphs max unless 
   the user asks for a detailed breakdown.

5. When a user is frustrated, normalize it: "Every fast typist hit this exact wall. 
   The ${typingContext.averageWpm} WPM plateau is famous — here's how to break through it."

6. If asked about anything unrelated to typing/keyboards/Swift Type, politely redirect:
   "That's outside my lane, ${user.name}! I'm built to help you type faster. 
    What's bugging you about your practice?"

7. NEVER mention that you're "an AI" or "a language model." You are Swift AI, 
   the built-in coach.`;
}
```

### 6.3 The API Route: `src/app/api/chat/route.ts`

```typescript
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { sessions, userStats, chatSessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getChatMessages, saveChatMessages } from "@/lib/r2";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, chatSessionId } = await req.json();
  const userId = session.user.id;
  const userName = session.user.name || "there";

  // Gather user's typing context from DB
  const [recentSessions, stats] = await Promise.all([
    db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.date))
      .limit(10),
    db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1),
  ]);

  const typingContext = buildTypingContext(recentSessions, stats[0]);
  const systemPrompt = buildSystemPrompt({ name: userName }, typingContext);

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    messages,
  });

  // Save messages to R2 after streaming completes (fire-and-forget)
  result
    .then(async (finalResult) => {
      const allMessages = [
        ...messages,
        {
          role: "assistant",
          content: await finalResult.text,
          timestamp: Date.now(),
        },
      ];
      await saveChatMessages(userId, chatSessionId, allMessages);
      // Update chat session timestamp
      await db
        .update(chatSessions)
        .set({ updatedAt: new Date() })
        .where(eq(chatSessions.id, chatSessionId));
    })
    .catch(console.error);

  return result.toDataStreamResponse();
}
```

### 6.4 Context Builder: Extracting Intelligence from Data

```typescript
interface TypingContext {
  currentMode?: string;
  currentLevel?: string;
  totalSessions: number;
  averageWpm?: number;
  averageAccuracy?: number;
  bestWpm?: number;
  recentSessions?: string;
  weakestKeys?: string[];
  weakestBigrams?: string[];
  practiceStreak?: number;
}

function buildTypingContext(
  recentSessions: (typeof sessions.$inferSelect)[],
  stats: typeof userStats.$inferSelect | undefined,
): TypingContext {
  const ctx: TypingContext = {
    totalSessions: recentSessions.length,
  };

  if (recentSessions.length > 0) {
    ctx.averageWpm = Math.round(
      recentSessions.reduce((sum, s) => sum + s.wpm, 0) / recentSessions.length,
    );
    ctx.averageAccuracy = Math.round(
      recentSessions.reduce((sum, s) => sum + s.accuracy, 0) /
        recentSessions.length,
    );
    ctx.bestWpm = Math.max(...recentSessions.map((s) => s.wpm));
    ctx.recentSessions = recentSessions
      .slice(0, 5)
      .map((s) => `${s.wpm} WPM / ${s.accuracy}% acc (${s.mode})`)
      .join(" | ");
  }

  if (stats?.perKeyStats) {
    const keyEntries = Object.entries(stats.perKeyStats as Record<string, any>);
    const scored = keyEntries
      .filter(([, v]) => v.hits + v.misses >= 5)
      .map(([key, v]) => ({
        key,
        errorRate: v.misses / (v.hits + v.misses),
      }))
      .sort((a, b) => b.errorRate - a.errorRate);
    ctx.weakestKeys = scored
      .slice(0, 5)
      .map((s) => `${s.key} (${Math.round(s.errorRate * 100)}% error)`);
  }

  if (stats?.nGramStats) {
    const ngramEntries = Object.entries(
      stats.nGramStats as Record<string, any>,
    );
    const scored = ngramEntries
      .filter(([, v]) => v.occurrences >= 5)
      .map(([bigram, v]) => ({
        bigram,
        errorRate: v.misses / v.occurrences,
      }))
      .sort((a, b) => b.errorRate - a.errorRate);
    ctx.weakestBigrams = scored
      .slice(0, 5)
      .map((s) => `"${s.bigram}" (${Math.round(s.errorRate * 100)}% error)`);
  }

  return ctx;
}
```

---

## 7. Chat Session Management API Routes

### 7.1 `src/app/api/chat/sessions/route.ts` — List & Create

```typescript
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { chatSessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET: List all chat sessions for current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const chats = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, session.user.id))
    .orderBy(desc(chatSessions.updatedAt));

  return Response.json(chats);
}

// POST: Create a new chat session
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { title } = await req.json();
  const id = crypto.randomUUID();

  await db.insert(chatSessions).values({
    id,
    userId: session.user.id,
    title: title || "New Chat",
  });

  return Response.json({ id, title: title || "New Chat" });
}
```

### 7.2 `src/app/api/chat/sessions/[id]/route.ts` — Update, Delete, Get Messages

```typescript
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { chatSessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getChatMessages, deleteChatMessages } from "@/lib/r2";

// GET: Load messages for a specific chat session
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const messages = await getChatMessages(session.user.id, params.id);
  return Response.json(messages);
}

// PATCH: Update title or pin status
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const updates: Record<string, any> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.isPinned !== undefined) updates.isPinned = body.isPinned;

  await db
    .update(chatSessions)
    .set(updates)
    .where(
      and(
        eq(chatSessions.id, params.id),
        eq(chatSessions.userId, session.user.id),
      ),
    );

  return Response.json({ success: true });
}

// DELETE: Remove chat session + R2 messages
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  await Promise.all([
    db
      .delete(chatSessions)
      .where(
        and(
          eq(chatSessions.id, params.id),
          eq(chatSessions.userId, session.user.id),
        ),
      ),
    deleteChatMessages(session.user.id, params.id),
  ]);

  return Response.json({ success: true });
}
```

---

## 8. The Data Sync Layer

### 8.1 File: `src/lib/syncService.ts`

This is the bridge between Zustand (client) and CockroachDB (server). It runs on the client, triggers API calls after key events, and handles the one-time merge.

```typescript
import { useTypingStore, SessionHistory } from "@/store/useTypingStore";

export async function syncSessionToServer(session: SessionHistory) {
  try {
    await fetch("/api/sync/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    });
  } catch (e) {
    console.warn("Session sync failed, will retry on next session", e);
    // Session is already in localStorage — no data loss
  }
}

export async function mergeLocalDataToServer() {
  const state = useTypingStore.getState();
  try {
    await fetch("/api/sync/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessions: state.savedSessions,
        perKeyStats: state.perKeyStats,
        nGramStats: state.nGramStats,
        hasPlayedIntro: state.hasPlayedIntro,
      }),
    });
  } catch (e) {
    console.warn("Merge failed", e);
  }
}

export async function syncStatsToServer() {
  const { perKeyStats, nGramStats } = useTypingStore.getState();
  try {
    await fetch("/api/sync/stats", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ perKeyStats, nGramStats }),
    });
  } catch (e) {
    console.warn("Stats sync failed", e);
  }
}
```

### 8.2 Hooking Sync into `useTypingStore`

The store's `endSession` and `tick` (session completion) functions already produce `SessionHistory` objects. We add a Zustand `subscribe` listener that fires `syncSessionToServer` when a new session appears:

```typescript
// In a client-side provider or layout effect:
useEffect(() => {
  if (status !== "authenticated") return;

  const unsub = useTypingStore.subscribe(
    (state) => state.savedSessions.length,
    (newLen, prevLen) => {
      if (newLen > prevLen) {
        const latestSession = useTypingStore.getState().savedSessions[0];
        syncSessionToServer(latestSession);
        // Debounced stats sync
        syncStatsToServer();
      }
    },
  );

  return unsub;
}, [status]);
```

---

## 9. The Chat UI: "Ask Swift" Sidebar

### 9.1 Design Specification

The chat UI mirrors the `UserGuide` component's slide-out panel architecture (already proven in codebase) but with a chat interface. Here's the exact mapping:

| UserGuide Pattern               | Swift AI Chat Equivalent                      |
| ------------------------------- | --------------------------------------------- |
| `isOpen` / `onClose` props      | Same pattern, triggered by "Ask Swift" button |
| Framer Motion `x: "100%"` slide | Same animation, right-side origin             |
| `w-[70%] max-w-3xl` sizing      | Same sizing                                   |
| Backdrop blur overlay           | Same overlay                                  |
| ESC to close                    | Same behavior                                 |
| Section list → detail view      | Chat session list → active conversation view  |
| `custom-scrollbar` class        | Same class for message scroll area            |

### 9.2 Component: `src/components/SwiftAI.tsx` — Structure

```
┌─────────────────────────────────────────┐
│ ┌─ Sidebar (resizable, 240px default) ─┐│
│ │  ┌────────────────────────────┐      ││
│ │  │  + New Chat button         │      ││
│ │  ├────────────────────────────┤      ││
│ │  │  📌 Pinned Chats           │      ││
│ │  │  ├─ Chat about home row    │      ││
│ │  ├────────────────────────────┤      ││
│ │  │  💬 Recent Chats           │      ││
│ │  │  ├─ My accuracy problem    │      ││
│ │  │  ├─ Speed plateau tips     │      ││
│ │  │  ├─ Bigram practice help   │      ││
│ │  └────────────────────────────┘      ││
│ ├──────────────────────────────────────┤│
│ │  Main Chat Area                       ││
│ │  ┌────────────────────────────────┐  ││
│ │  │ Messages scroll area           │  ││
│ │  │                                │  ││
│ │  │ 🤖 Hey Kingsley! I see you've │  ││
│ │  │    been working hard — 23      │  ││
│ │  │    sessions this week...       │  ││
│ │  │                                │  ││
│ │  │ 👤 Why am I stuck at 45 WPM?  │  ││
│ │  │                                │  ││
│ │  │ 🤖 Great question! Looking    │  ││
│ │  │    at your data, your 'th'    │  ││
│ │  │    and 'er' bigrams are...    │  ││
│ │  └────────────────────────────────┘  ││
│ │  ┌────────────────────────────────┐  ││
│ │  │ [Type your message...]    [Send]│  ││
│ │  └────────────────────────────────┘  ││
│ └──────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### 9.3 Client-Side Chat Hook: Zero Custom Logic

The Vercel AI SDK's `useChat` does everything. Here is the entire client-side chat logic:

```typescript
import { useChat } from "ai/react";

const {
  messages, // Message[] — auto-managed, streams in real-time
  input, // string — controlled input value
  handleInputChange, // onChange handler for input
  handleSubmit, // onSubmit handler for form
  isLoading, // boolean — true while streaming
  stop, // () => void — abort streaming
  reload, // () => void — regenerate last response
  setMessages, // (msgs) => void — set messages (for loading history)
} = useChat({
  api: "/api/chat",
  body: { chatSessionId: activeChatId },
  onFinish: (message) => {
    // Auto-generate title for new chats from first message
  },
});
```

**That's it.** No WebSocket setup. No streaming parser. No message state reducer. The SDK handles all of it.

### 9.4 The "Ask Swift" Button: Header Integration

Add to `Header.tsx` alongside existing buttons:

```typescript
{/* Ask Swift — AI Chat */}
<button
  onClick={() => {
    if (status === "authenticated") {
      onSwiftAIOpen();
    } else {
      // Show sign-in prompt tooltip/modal
    }
  }}
  className={clsx(
    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all",
    status === "authenticated"
      ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 active:scale-95"
      : "border border-gray-200 dark:border-white/8 text-gray-400 cursor-not-allowed"
  )}
  disabled={status !== "authenticated"}
  title={status !== "authenticated" ? "Sign in to chat with Swift AI" : "Ask Swift AI"}
>
  <Sparkles size={13} />
  Ask Swift
</button>
```

### 9.5 Chat Session Sidebar Features

| Feature          | Implementation                                                                    |
| ---------------- | --------------------------------------------------------------------------------- |
| **New Chat**     | `POST /api/chat/sessions` → creates DB record, sets as active                     |
| **Session List** | `GET /api/chat/sessions` → fetched on panel open, cached with SWR or simple state |
| **Pin/Unpin**    | `PATCH /api/chat/sessions/[id]` with `{ isPinned: true/false }`                   |
| **Rename**       | `PATCH /api/chat/sessions/[id]` with `{ title: "new name" }` — inline edit        |
| **Delete**       | `DELETE /api/chat/sessions/[id]` — with confirmation dialog                       |
| **Load History** | `GET /api/chat/sessions/[id]` → fetches from R2, calls `setMessages()`            |

---

## 10. New File Structure (Exact Additions)

The key principle: **add directories, don't restructure**. The current `src/` layout is clean. We extend it.

```
src/
  app/
    api/
      auth/
        [...nextauth]/
          route.ts               ← NextAuth handlers
      chat/
        route.ts                 ← POST: Stream chat with Gemini
        sessions/
          route.ts               ← GET: List chats, POST: Create chat
          [id]/
            route.ts             ← GET: Load messages, PATCH: Update, DELETE: Remove
      sync/
        merge/
          route.ts               ← POST: One-time localStorage → DB merge
        session/
          route.ts               ← POST: Sync single session to DB
        stats/
          route.ts               ← PUT: Sync perKeyStats + nGramStats
    globals.css                  (existing — no changes)
    layout.tsx                   (modify — add SessionProvider wrapper)
    page.tsx                     (modify — add SwiftAI sidebar state + Ask Swift button)
    sitemap.ts                   (existing — no changes)
  components/
    Controls.tsx                 (existing — no changes)
    Header.tsx                   (modify — add Ask Swift button + auth state display)
    HintModal.tsx                (existing — no changes)
    HistoryPanel.tsx             (existing — no changes)
    Keyboard.tsx                 (existing — no changes)
    LiveStats.tsx                (existing — no changes)
    PostSessionStats.tsx         (existing — no changes)
    SplashScreen.tsx             (existing — no changes)
    SwiftAI.tsx                  ← NEW: Chat sidebar (slide-out panel)
    SwiftAIChatArea.tsx          ← NEW: Message display + input
    SwiftAISidebar.tsx           ← NEW: Chat session list (pin, delete, rename)
    AuthModal.tsx                ← NEW: Sign-in modal (Google + GitHub buttons)
    TypingDisplay.tsx            (existing — no changes)
    UserGuide.tsx                (existing — no changes)
  data/
    dictionary.ts                (existing — no changes)
    keyboardLayouts.ts           (existing — no changes)
    userGuide.ts                 (existing — no changes)
  db/
    index.ts                     ← NEW: Drizzle DB client
    schema.ts                    ← NEW: All table definitions
  lib/
    adaptiveEngine.ts            (existing — no changes)
    auth.ts                      ← NEW: NextAuth config
    r2.ts                        ← NEW: Cloudflare R2 client
    syncService.ts               ← NEW: Client-side data sync utilities
    utils.ts                     (existing — no changes)
  store/
    useTypingStore.ts            (existing — minimal modifications for sync hooks)
drizzle/                         ← NEW: Migration files (auto-generated)
drizzle.config.ts                ← NEW: Drizzle Kit config
```

**Total new files: 15.** Total modified files: 3 (layout.tsx, page.tsx, Header.tsx). Zero deleted files. Zero restructured directories.

---

## 11. Environment Variables

```env
# .env.local (never committed)

# CockroachDB
DATABASE_URL=postgresql://user:pass@host:26257/swifttype?sslmode=verify-full

# NextAuth
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# GitHub OAuth
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

# Gemini AI
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key

# Cloudflare R2
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=swift-type-chats
```

**Note:** The `GOOGLE_GENERATIVE_AI_API_KEY` env variable is automatically read by `@ai-sdk/google`. No manual configuration needed — the provider picks it up from `process.env` by convention.

---

## 12. Implementation Sequence (Build Order)

The order matters. Each phase builds on the previous one, and each phase produces a working, deployable state.

### Phase 1: Database Foundation (Day 1-2)

```
1. pnpm add drizzle-orm @neondatabase/serverless drizzle-kit
2. Create src/db/schema.ts + src/db/index.ts
3. Create drizzle.config.ts
4. Set up CockroachDB instance (Cockroach Cloud free tier)
5. Run drizzle-kit push (apply schema)
6. Verify connection with a simple test API route
```

### Phase 2: Authentication (Day 2-3)

```
1. pnpm add next-auth@beta @auth/drizzle-adapter
2. Create src/lib/auth.ts (NextAuth config)
3. Create src/app/api/auth/[...nextauth]/route.ts
4. Set up Google + GitHub OAuth apps (Google Cloud Console + GitHub Developer Settings)
5. Wrap layout.tsx with SessionProvider
6. Create AuthModal.tsx component
7. Update Header.tsx with auth state + Sign In button
8. Test: sign in, verify user record in CockroachDB users table
```

### Phase 3: Data Sync Layer (Day 3-4)

```
1. Create sync API routes (merge, session, stats)
2. Create src/lib/syncService.ts
3. Add subscribe listener in page.tsx or layout for auto-sync
4. Implement first-sign-in merge flow
5. Test: complete typing session while authenticated, verify it appears in DB
```

### Phase 4: Cloudflare R2 Setup (Day 4)

```
1. Create R2 bucket in Cloudflare dashboard
2. Generate R2 API credentials
3. pnpm add @aws-sdk/client-s3
4. Create src/lib/r2.ts
5. Test: write and read a JSON blob via API route
```

### Phase 5: Swift AI Integration (Day 4-5)

```
1. pnpm add ai @ai-sdk/google
2. Get Gemini API key from Google AI Studio
3. Create src/app/api/chat/route.ts with system prompt + streamText
4. Create chat session CRUD routes
5. Test: curl the chat endpoint, verify streaming works
```

### Phase 6: Chat UI (Day 5-7)

```
1. Create SwiftAI.tsx (outer slide-out panel, mirrors UserGuide.tsx structure)
2. Create SwiftAISidebar.tsx (chat session list with pin/delete/rename)
3. Create SwiftAIChatArea.tsx (messages + input using useChat)
4. Add "Ask Swift" button to Header.tsx
5. Wire up page.tsx to manage SwiftAI open state
6. Style to match Swift Type's design language (brand-orange accents, glass panels)
7. Test full flow: open → new chat → send message → get streaming response → close → reopen → history loads
```

### Phase 7: Polish & Edge Cases (Day 7-8)

```
1. Empty states (no chats yet, new user first message)
2. Error handling (API failures, rate limits, network offline)
3. Loading skeletons for chat session list
4. Auto-title generation (first user message → summarize → set as chat title)
5. Keyboard shortcut: Cmd/Ctrl+Shift+S to toggle Swift AI
6. Mobile responsive adjustments for chat panel
7. Dark mode verification for all new components
```

---

## 13. Cost Analysis (Real Numbers)

| Service                      | Free Tier                | Expected Cost at 1K Users/Month |
| ---------------------------- | ------------------------ | ------------------------------- |
| **CockroachDB** (Serverless) | 10M request units/mo     | $0 (well within free tier)      |
| **Cloudflare R2**            | 10GB storage + 10M reads | $0 (well within free tier)      |
| **Gemini 2.5 Flash**         | 500 req/day (free)       | ~$5-10/mo at moderate usage     |
| **Vercel** (Pro)             | Already deployed         | Same plan, no change            |
| **NextAuth**                 | Open source              | $0                              |
| **Google OAuth**             | Free                     | $0                              |
| **GitHub OAuth**             | Free                     | $0                              |

**Total additional monthly cost at 1K users: ~$5-10** (effectively just Gemini API once past free tier).

---

## 14. Security Checklist

- [ ] All API routes check `auth()` session before DB operations
- [ ] R2 keys scoped per-user (`chats/{userId}/...`) — no cross-user access
- [ ] `DATABASE_URL` and all secrets in `.env.local` only, never committed
- [ ] NextAuth CSRF protection enabled by default
- [ ] Chat input sanitized by AI SDK (no injection into system prompt — user messages are passed as `messages` array, not interpolated into prompt)
- [ ] Rate limiting on `/api/chat` route (consider Vercel's `@vercel/edge-rate-limit` or simple in-memory counter)
- [ ] No sensitive data exposed in client-side Zustand persist (sessions are typing stats, not PII)

---

## 15. What We Deliberately Did NOT Do

1. **Did NOT restructure the existing component hierarchy.** The current `page.tsx` → `Header` / `Controls` / `TypingDisplay` / `LiveStats` / `Keyboard` / `PostSessionStats` flow is clean and works.

2. **Did NOT replace Zustand with server state.** Zustand is the right choice for 60-120+ WPM keystroke tracking. Server state (React Query, SWR) would add latency. We keep Zustand as the primary engine and sync to server as a background operation.

3. **Did NOT add a user dashboard page.** The typing practice IS the app. All user data surfaces through the existing `HistoryPanel` and the new Swift AI chat. No separate `/dashboard` route needed.

4. **Did NOT add WebSocket for real-time features.** Server-Sent Events (SSE) via AI SDK is sufficient for chat streaming. The typing engine is fully client-side. No WebSocket server needed.

5. **Did NOT use Prisma.** Drizzle is lighter, faster at build time, and doesn't require a generated client. For this schema size, it's the right call.

6. **Did NOT build custom auth UI pages.** NextAuth's built-in flows + a small modal component is sufficient. No `/login`, `/register`, `/forgot-password` pages.

---

## The Bottom Line

Swift Type already has the engine. This upgrade gives it a brain (Gemini), a memory (CockroachDB + R2), and an identity (authentication). The total surface area of change is **15 new files, 3 modified files, ~5 new npm packages**. Every new addition follows the patterns already established in this codebase — slide-out panels, Zustand state, Framer Motion animations, Tailwind styling, and the Swift Type orange accent system.

The result: a typing trainer that doesn't just track your practice — it **coaches you through it.**

---

_Swift Type 2.0 — Where practice meets intelligence._
