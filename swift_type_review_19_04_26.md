# Swift Type — Full Codebase Audit
> Reviewed by Antigravity · April 2026 · Kingsley Maduabuchi

---

## 🟢 What's Already Great

Before the issues — here's what's solid:

- **Architecture is clean.** Zustand + Drizzle ORM + Next.js App Router is a good, coherent stack.
- **Adaptive Engine exists.** Per-key stats, N-gram bigram tracking, and struggle-score weighting are genuinely smart.
- **AI context is rich.** The system prompt fed to Gemini pulls real user data — WPM, accuracy, weakest keys, bigrams, streak state, goals. That's impressive.
- **Offline resilience** is handled. LocalStorage is treated as source of truth. Silent fallbacks on all sync paths.
- **DB schema is well normalized.** Separate tables for sessions, stats, goals, streaks, rewards, and chat — no fat monolith.
- **SEO, OG, Twitter metadata** are properly defined in layout.tsx.
- **PWA manifest** is referenced — `next-pwa` is installed.

---

## 🔴 Critical Issues

### 1. `typeChar` in the Store Spreads State Objects on Every Keystroke
**File:** `src/store/useTypingStore.ts` — lines 297–305

```ts
// BAD — creates a new object for EVERY keystroke
newNGramStats = {
  ...state.nGramStats,
  [bigram]: { ... },
};
```

And also for `perKeyStats`:
```ts
perKeyStats: {
  ...state.perKeyStats,
  [targetChar]: { ... },
}
```

**The problem:** Every single key press clones the entire `perKeyStats` and `nGramStats` dictionaries. After hundreds of sessions these can be thousands of entries deep. This causes GC pressure and will noticeably lag on long sessions (especially 120s on slow devices).

**Fix:** Use `immer` middleware or mutate a ref outside the store during active sessions, and flush to store only on `endSession`.

---

### 2. The WPM History Array Grows Unboundedly During a Session
**File:** `src/store/useTypingStore.ts` — lines 413–420 (`tick`)

```ts
const newWpmHistory = [
  ...state.wpmHistory,
  { second: currentElapsedSeconds, wpm: netWPM, raw: Math.round(rawWPM) },
];
```

On a 120-second session this array gets 120 new entries created via spread — 120 array allocations. On slower devices this adds up.

**Fix:** Pre-allocate with a fixed-size circular buffer or cap at 120 items and mutate in place.

---

### 3. `playSound` Is Attached to `window` Every Render
**File:** `src/components/Controls.tsx` — lines 135–137

```ts
if (typeof window !== "undefined") {
  (window as any).__swiftTypePlaySound = playSound;
}
```

This is executed at the **component body level** — meaning it re-runs on every render. This is a global side-effect with no cleanup and creates a tight coupling between a UI component and an audio API through `window`. If Controls unmounts (e.g., panel navigation), the reference becomes stale.

**Fix:** Move this into a `useEffect`, pass a ref callback, or better — expose `playSound` through the Zustand store or a React context.

---

### 4. `updateObj: any` Type Erasure in `typeChar`
**File:** `src/store/useTypingStore.ts` — line 311

```ts
const updateObj: any = { ... };
```

Using `any` throws away all TypeScript safety. If you accidentally set a wrong key, no error will be caught.

**Fix:**
```ts
const updateObj: Partial<TypeState> = { ... };
```

---

### 5. `mergeLocalGoalsToServer` Calls `fetchGoalsFromServer` Twice
**File:** `src/lib/syncService.ts` — lines 195–233

```ts
const remoteSnapshot = await fetchGoalsFromServer(); // call 1
// ...
await fetchGoalsFromServer(); // call 2 at line 232
```

This double-calls the same API endpoint serially on every login. Wastes latency and server compute.

**Fix:** Remove the redundant final call. The snapshot returned from `patchGoalOnServer` already reflects the new state.

---

## 🟠 Performance Improvements

### 6. `TypingDisplay` Re-renders Every Character in the Full `chars` Array
**File:** `src/components/TypingDisplay.tsx` — lines 89, 113–126

```ts
const chars = targetText.split(""); // Done every render

{chars.map((char, i) => (
  <CharSpan key={i} char={char} typed={typedText[i]} isCaret={...} />
))}
```

`CharSpan` is `memo`'d, which is great. But when `typedText` changes, **every** `CharSpan` after the cursor still re-renders because `isCaret` and `typed` props change for adjacent characters.

**Fix:** Use a virtualized approach (only render visible chars in a window), or track the "changed range" and pass stable props. For very long texts (100+ words) this matters a lot.

---

### 7. `Controls.tsx` Regenerates Text on Every Config Change
**File:** `src/components/Controls.tsx` — line 160

```ts
useEffect(() => {
  // ...
  useTypingStore.setState({ targetText: text, ... });
}, [mode, level, duration, wordCount, curriculumStage]);
```

This runs `getRandomWords()` or `generateCurriculumText()` on every config pill click — including when the user is just browsing options. This is fine for now, but `getRandomWords` runs on every option change, which means it generates text the user will never use.

**Fix:** Debounce this by ~200ms so rapid pill switching doesn't spam text regeneration.

---

### 8. Zustand `persist` Persists N-gram Stats Which Can Grow Very Large
**File:** `src/store/useTypingStore.ts` — lines 591–601

```ts
partialize: (state) => ({
  savedSessions: state.savedSessions,
  perKeyStats: state.perKeyStats,
  nGramStats: state.nGramStats || {},
  // ...
})
```

`nGramStats` can contain hundreds of bigrams accumulated across all sessions (26×26 = 676 possible alphabetic bigrams). Serializing and deserializing this on every Zustand persist write adds up — localStorage writes are synchronous and block the main thread on some browsers.

**Fix:** Throttle persist writes (Zustand supports this via options), or move per-key and n-gram stats out of localStorage entirely since they're already synced to the server.

---

### 9. Chat History Is Fetched With Plain `fetch` — No Loading State or Caching
**File:** `src/components/SwiftAIChatArea.tsx` — lines 99–120

```ts
useEffect(() => {
  fetch(`/api/chat/sessions/${chatId}`)
    .then(r => r.json())
    .then(data => { ... });
}, [chatId]);
```

Every time `chatId` changes, a raw fetch fires with no loading spinner, no caching, and no request deduplication. If the user switches chats quickly, multiple inflight requests race.

**Fix:** Add a loading state. Use `AbortController` to cancel previous requests on chatId change. Or use SWR/React Query for caching.

---

## 🤖 AI / SwiftAI Improvements

### 10. No Tool Calling — Swift AI Can't Take Actions
The AI is a pure Q&A chat. It sees the user's data but can't:
- Start a new adaptive drill
- Set a goal on behalf of the user
- Switch the mode or level

**Improvement:** Use the AI SDK's `tools` feature to expose 2–3 typed actions:
```ts
tools: {
  startAdaptiveDrill: tool({ ... }),
  setGoal: tool({ ... }),
}
```
This turns Swift AI from a passive coach into an active training partner.

---

### 11. System Prompt Is Rebuilt on Every Request
**File:** `src/app/api/chat/route.ts` — line 279

```ts
const systemPrompt = buildSystemPrompt(userName, typingContext);
```

The system prompt is a large string (~3KB) assembled from scratch on every message. The user data (sessions, stats, goals) is also fetched fresh every message — 4 parallel DB queries per chat turn.

**Improvement:** Cache the typing context (Redis, Vercel KV, or even a 30-second in-memory cache keyed by `userId`) so rapidly back-to-back messages don't each trigger 4 DB reads.

---

### 12. AI Temperature Is Hardcoded to 0
**File:** `src/app/api/chat/route.ts` — line 285

```ts
temperature: 0,
```

Temperature 0 makes the AI deterministic and "cold." For a **coaching** personality that's supposed to be warm and encouraging, this is counterproductive — it will produce identical phrasing every time.

**Fix:** Use `temperature: 0.4` for better conversational variety while staying on-topic.

---

### 13. `MessageContent` Custom Markdown Renderer Is Very Limited
**File:** `src/components/SwiftAIChatArea.tsx` — lines 562–626

The custom renderer only handles `**bold**` and `` `code` ``. It does not handle:
- Ordered/unordered lists (`1.` / `-`)
- Headings (`##`)
- Block code (` ``` `)
- Tables

When Gemini returns a bulleted list of tips, it renders as raw `- item` text — ugly for a coaching app.

**Fix:** Replace the custom renderer with `react-markdown` (it's lightweight and tree-shakeable).

---

### 14. Curriculum Mode Has Only 3 Stages and Generates Nonsense "Words"
**File:** `src/lib/adaptiveEngine.ts` — lines 111–125

```ts
for (let j = 0; j < wordLength; j++) {
  word += keys[Math.floor(Math.random() * keys.length)];
}
```

The curriculum generates random character strings like `"flsk" "asdj" "jjka"` — not real words. This is disengaging for learners.

**Fix:** For each stage, maintain a curated word list that only uses that stage's keys (like the existing `stage.text` property already has). Use those real words instead of random generation.

Also — 3 stages is not nearly enough for a curriculum. Consider 8–10 stages (number row, punctuation, capitalization, common digraphs, etc.)

---

## 🟡 Code Quality & Architecture

### 15. Duplicate WPM Calculation Logic in 3 Places
The WPM calculation formula is copy-pasted in `typeChar`, `tick`, and `endSession`:

```ts
const timeElapsedStr = (now - (state.startTime || now)) / 1000 / 60;
const rawWPM = timeElapsedStr > 0 ? state.keystrokes / 5 / timeElapsedStr : 0;
const netWPM = timeElapsedStr > 0 ? Math.max(0, Math.round(...)) : 0;
```

If the formula changes (e.g., switching from characters/5 to actual word count), you need to update 3 places.

**Fix:** Extract into a pure utility function: `calculateWPM(keystrokes, mistakes, startTime, now)`.

---

### 16. `updateObj.mistakes` Is Used Before It's Defined
**File:** `src/store/useTypingStore.ts` — line 338

```ts
const netWPM = Math.max(0, Math.round(
  (updateObj.keystrokes - updateObj.mistakes) / 5 / timeElapsedStr
));
```

`updateObj.mistakes` is pulled from the `any`-typed object, which was populated at line 314. This works right now but is fragile — typed correctly, the compiler would have caught any ordering issues.

---

### 17. `setConfig` Spreads Entire State
**File:** `src/store/useTypingStore.ts` — line 235

```ts
setConfig: (config) => set((state) => ({ ...state, ...config })),
```

Zustand's `set` already does a shallow merge — you don't need to spread `state`. This is harmless but noisy.

**Fix:**
```ts
setConfig: (config) => set(config),
```

---

### 18. `AuthModal.tsx` Has No Input Validation
**File:** `src/components/AuthModal.tsx`

Email/password login is present (there's a `password` column in the schema), but the auth modal likely doesn't validate:
- Password minimum length
- Email format
- Empty field handling

This is a security/UX gap. Use `zod` for schema validation on both client and server.

---

### 19. DB Schema Has No Indexes on Foreign Keys
**File:** `src/db/schema.ts`

All the `userId` foreign key columns (`typing_sessions.user_id`, `user_goals.user_id`, `user_rewards.user_id`, etc.) have no explicit indexes in the schema definition. PostgreSQL does **not** auto-index foreign keys.

Every query like:
```ts
db.select().from(sessions).where(eq(sessions.userId, userId))
```
will do a full table scan as data grows.

**Fix:** Add indexes to all FK columns:
```ts
export const sessions = pgTable("typing_sessions", { ... }, (table) => [
  index("typing_sessions_user_id_idx").on(table.userId),
]);
```

---

### 20. `next.config.js` Uses Legacy Format
**File:** `next.config.js` — you're on Next.js 16 but likely using `module.exports` format. With the App Router, the preferred config format is `next.config.ts`. Not critical but worth migrating.

---

## 📋 Summary Table

| # | Area | Severity | Issue |
|---|------|----------|-------|
| 1 | Performance | 🔴 Critical | State object spread on every keystroke |
| 2 | Performance | 🔴 Critical | WPM history unbounded array spread in tick |
| 3 | Architecture | 🔴 Critical | `window.__swiftTypePlaySound` global side effect |
| 4 | Type Safety | 🟠 High | `updateObj: any` in typeChar |
| 5 | Network | 🟠 High | Double fetch on login sync |
| 6 | Performance | 🟠 High | Full char array re-render on every keystroke |
| 7 | UX | 🟡 Medium | Text regenerates on every config click (no debounce) |
| 8 | Performance | 🟡 Medium | nGramStats persisted to localStorage every write |
| 9 | UX | 🟡 Medium | Chat history fetch has no loading state or abort |
| 10 | AI | 🟠 High | No tool calling — AI can't take actions |
| 11 | AI | 🟡 Medium | System prompt rebuilt + 4 DB queries per message |
| 12 | AI | 🟡 Medium | Temperature 0 makes coaching feel robotic |
| 13 | AI/UX | 🟡 Medium | Markdown renderer missing lists, headings, code blocks |
| 14 | Product | 🟠 High | Curriculum generates nonsense strings, only 3 stages |
| 15 | Code Quality | 🟡 Medium | WPM formula duplicated in 3 places |
| 16 | Code Quality | 🟡 Medium | `updateObj.mistakes` relies on untyped object ordering |
| 17 | Code Quality | 🟢 Low | Unnecessary state spread in setConfig |
| 18 | Security | 🟠 High | No input validation on auth modal |
| 19 | Database | 🔴 Critical | No indexes on FK columns — full table scans as data grows |
| 20 | Config | 🟢 Low | Legacy next.config format |

---

## 🎯 Priority Roadmap

### Do First (Biggest Impact)
1. **Add DB indexes** — this will degrade silently as users grow (#19)
2. **Fix typeChar object spreading** — core performance path (#1, #2)
3. **Add AI tool calling** — biggest product differentiation (#10)
4. **Replace markdown renderer** with `react-markdown` (#13)

### Do Next
5. **Fix curriculum word generation** — use real curated words (#14)
6. **Cache AI context** per user (#11)
7. **Add AbortController** to chat fetch + loading state (#9)
8. **Extract WPM utility function** (#15)
9. **Fix `window.__swiftTypePlaySound`** side effect (#3)
10. **Set temperature to 0.4** for the AI (#12)

### Nice to Have
11. Debounce text regeneration on config change (#7)
12. Move nGramStats out of localStorage (#8)
13. Add zod validation to AuthModal (#18)
14. Clean up `setConfig` (#17)

---

*Total files reviewed: 18 | Total lines of code read: ~4,200*
