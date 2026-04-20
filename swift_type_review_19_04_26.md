# Swift Type — Current Review and 3-Session Checklist

> Updated April 20, 2026

This review replaces the earlier broad audit with a current working checklist. The items below focus on what is still worth doing after the recent fixes already landed.

## Recently Completed

- Swift AI now has real tool actions for goal creation, navigation, and starting sessions.
- The AI input bar was simplified and polished.
- Regenerate no longer duplicates the last user prompt.
- Keyboard input is blocked correctly while panels are open.
- CapsLock now behaves correctly in the typing flow.
- Enter and other key shortcuts work again with the hidden typing input.
- The AI loading state now shows rotating contextual copy instead of generic bouncing dots.
- Streaks now advance from completed practice days instead of only daily goal completions.
- The chat renderer already supports richer markdown output.
- The earlier store and sync issues around heavy object spreads and redundant goal fetches were already resolved.

## Session 1 — Release Hardening

Completed on April 20, 2026.

1. Chat history switches in Swift AI now cancel stale requests and show dedicated loading and retry states.
2. Tool-result rendering now routes through guarded parsing so malformed or partial payloads degrade into safe inline error badges instead of runtime failures.
3. A lightweight smoke script now covers the three action paths: create goal, open panel, and start session.

## Session 2 — Training Engine Quality

1. Replace curriculum-mode random character words with curated real-word sets per stage.
2. Extract duplicated WPM and accuracy calculations into a shared utility.
3. Revisit TypingDisplay rendering for long texts if performance drops on lower-end devices.

## Session 3 — Platform Hardening

1. Add client and server validation for AuthModal inputs with zod.
2. Add database indexes for the main user-linked tables in the Drizzle schema.
3. Cache Swift AI context assembly briefly so rapid back-to-back messages do not repeat the same database work.

## Recommended Order

Session 1 should happen before broader user testing.

Session 2 is the best product-quality upgrade after the current bug-fix pass.

Session 3 is the right follow-up for reliability, scale, and cleaner backend behavior.
