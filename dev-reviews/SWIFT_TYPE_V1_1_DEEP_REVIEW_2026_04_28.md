# Swift Type V1.1 Deep Review

Date: 2026-04-28

This review covers the concrete issues raised for the V1.1 rollout, plus nearby UX, performance, product-surface, and documentation risks that are directly supported by the current codebase. The findings below are intentionally limited to issues that could be verified from the repository and editor diagnostics.

## Executive Summary

Swift Type already has a credible product core. The typing engine, rewards system, PWA baseline, Swift AI chat persistence, and polished panel architecture are all present. The current V1.1 blockers are not about missing ambition; they are about a handful of control-flow and product-state decisions that break the intended experience at the exact points users notice most: opening Swift AI, finishing a session and asking Swift for advice, seeing reward cards appear at the wrong moment, and reading review dates that collapse into Unix epoch output.

The highest-risk implementation problems are concentrated in five places. Swift AI currently behaves like a blocking overlay instead of a cooperative side workspace. Swift AI context is cached for sixty seconds without being invalidated when a new session lands, which explains the stale post-session coaching. The reward modal opens for any queued reward instead of goal-completion rewards only. The review pipeline trusts nullable timestamps in both sorting and rendering. The review-nudge logic inside Swift AI has no notion of whether the current user has already reviewed, so it cannot deliver the targeted behavior requested for V1.1.

## Implementation Update (Fix Pass Completed: Issues 1 to 4)

Update Date: 2026-04-28

Status: Issues 1 to 4 from this review are now implemented and validated in code, with diagnostics cleaned for the touched files.

1. Issue 1 fixed: Swift AI now supports a non-blocking docked split behavior instead of a full-screen blocking overlay.
Evidence:
[src/components/SwiftAI.tsx](src/components/SwiftAI.tsx#L148) now renders a right-docked panel without the full-screen backdrop.
[src/app/page.tsx](src/app/page.tsx#L311) applies responsive right padding while Swift AI is open.
[src/app/page.tsx](src/app/page.tsx#L97) no longer auto-closes Swift AI when AI starts a session.

2. Issue 2 fixed: Swift AI context cache is now shared and invalidated from session sync paths.
Evidence:
[src/lib/swiftAIContextCache.ts](src/lib/swiftAIContextCache.ts) centralizes cache get/set/invalidate.
[src/app/api/sync/session/route.ts](src/app/api/sync/session/route.ts#L8) and [src/app/api/sync/session/route.ts](src/app/api/sync/session/route.ts#L75) invalidate context during session persistence flow.
[src/app/api/sync/merge/route.ts](src/app/api/sync/merge/route.ts#L8) and [src/app/api/sync/merge/route.ts](src/app/api/sync/merge/route.ts#L151) invalidate context after merge updates.
[src/app/api/chat/route.ts](src/app/api/chat/route.ts#L16) now consumes the shared cache utility.

3. Issue 3 fixed: Goal-complete modal gating is now restricted to goal completion rewards only.
Evidence:
[src/app/page.tsx](src/app/page.tsx#L144) now selects `primaryReward` only from `goal_completion` events.
[src/app/page.tsx](src/app/page.tsx#L291) opens `GoalCompleteModal` only when a goal-completion reward exists.

4. Issue 4 fixed: Review date handling is hardened and normalized at the API boundary with safer UI rendering.
Evidence:
[src/app/api/reviews/route.ts](src/app/api/reviews/route.ts#L7) adds safe parsing/normalization for timestamps.
[src/app/api/reviews/route.ts](src/app/api/reviews/route.ts#L58) sorts using normalized safe dates.
[src/components/ReviewsPanel.tsx](src/components/ReviewsPanel.tsx#L38) renders full dates with fallback text for invalid values.

Remaining from this review:
Issue 5 (targeted review nudges by reviewer state) remains open.
Issue 6 (/download page plus desktop packaging strategy) remains open.
Issue 7 (separate SwiftAIChatArea polish diagnostics) remains outside the issues-1-to-4 fix scope.

## Verified Findings

### 1. Critical: Swift AI still behaves like a blocking overlay, not a persistent 30/70 split workspace

The current implementation explicitly closes Swift AI before starting a session in [src/app/page.tsx](src/app/page.tsx#L102). The Swift AI surface itself is rendered as a fixed right-side overlay with a full-screen backdrop in [src/components/SwiftAI.tsx](src/components/SwiftAI.tsx#L148), [src/components/SwiftAI.tsx](src/components/SwiftAI.tsx#L154), [src/components/SwiftAI.tsx](src/components/SwiftAI.tsx#L164), and it reserves a hard-coded 50% width instead of the requested 30% in [src/components/SwiftAI.tsx](src/components/SwiftAI.tsx#L166). The result is a modal-style takeover: the main typing UI does not coexist with Swift AI, and AI-triggered practice intentionally closes the assistant before the session starts.

This is the root mismatch behind the V1.1 requirement that Swift AI remain open while the main Swift Type workspace stays usable in the remaining width. The current design is not a tuning issue. It is the wrong ownership model for the panel.

### 2. High: Swift AI session context can remain stale for up to 60 seconds after a completed typing session

Swift AI caches user context in memory with a sixty-second TTL in [src/app/api/chat/route.ts](src/app/api/chat/route.ts#L27) and [src/app/api/chat/route.ts](src/app/api/chat/route.ts#L31). That cache is refreshed per user in [src/app/api/chat/route.ts](src/app/api/chat/route.ts#L44) and is only explicitly invalidated for goal creation in [src/app/api/chat/route.ts](src/app/api/chat/route.ts#L418). A newly completed typing session is written through the sync endpoint in [src/app/api/sync/session/route.ts](src/app/api/sync/session/route.ts#L29), but that path has no mechanism to invalidate the Swift AI cache.

This explains the reported behavior where a user finishes a session, returns to Swift AI, and receives advice based on stale state until a refresh or cache expiry. The defect is architectural, not cosmetic. Swift AI is reading old server context after the source data changes.

### 3. High: RewardCard modal opens for any queued reward, not only goal-completion rewards

The page-level selection logic falls back from a goal-completion reward to the first queued reward in [src/app/page.tsx](src/app/page.tsx#L146) and [src/app/page.tsx](src/app/page.tsx#L147). The modal is then opened whenever the queue has any item at all in [src/app/page.tsx](src/app/page.tsx#L282). Because [src/components/GoalCompleteModal.tsx](src/components/GoalCompleteModal.tsx#L38) always renders a full reward-card experience for the chosen primary reward, streak, rank, and milestone rewards can surface through a goal-complete presentation even when no goal was completed.

This matches the reported symptom that RewardCard appears when it is not supposed to. The current queue contract is too loose for the modal that consumes it.

### 4. High: Review date handling is unsafe and can collapse to 1970 for null or legacy timestamps

The review table schema defines created and updated timestamps with defaults but without a not-null guarantee in [src/db/schema.ts](src/db/schema.ts#L303), [src/db/schema.ts](src/db/schema.ts#L317), and [src/db/schema.ts](src/db/schema.ts#L318). The review API sorts reviews by forcing raw values through `new Date(createdAt)` in [src/app/api/reviews/route.ts](src/app/api/reviews/route.ts#L23). The reviews panel renders the display date the same way in [src/components/ReviewsPanel.tsx](src/components/ReviewsPanel.tsx#L114).

If a row carries a null or malformed legacy value, both code paths degrade to epoch semantics. Even when the timestamp is valid, the UI currently shows only month and year, not the fuller date requested for the rollout. This is a real product bug with a second formatting gap layered on top of it.

### 5. Medium: Swift AI cannot target review nudges to non-reviewers because it has no per-user review-state context

The chat context model only carries aggregate review data in [src/app/api/chat/route.ts](src/app/api/chat/route.ts#L63) and [src/app/api/chat/route.ts](src/app/api/chat/route.ts#L64). The context builder only injects community review count and excerpts in [src/app/api/chat/route.ts](src/app/api/chat/route.ts#L167), [src/app/api/chat/route.ts](src/app/api/chat/route.ts#L169), and [src/app/api/chat/route.ts](src/app/api/chat/route.ts#L170). The prompt then tells Swift AI to invite reviews only occasionally and never pushily in [src/app/api/chat/route.ts](src/app/api/chat/route.ts#L269).

The reviews panel itself already knows whether the current user has reviewed through [src/components/ReviewsPanel.tsx](src/components/ReviewsPanel.tsx#L222), [src/components/ReviewsPanel.tsx](src/components/ReviewsPanel.tsx#L231), and [src/components/ReviewsPanel.tsx](src/components/ReviewsPanel.tsx#L308), but that state never reaches Swift AI. As a result, Swift AI cannot do what V1.1 needs: strongly encourage users who have not reviewed yet, avoid nagging users who already reviewed, and present the review action with confidence.

### 6. Medium: The current repo supports installable PWA usage, but desktop executable distribution and a /download page are not implemented yet

The project already has a PWA baseline through next-pwa in [next.config.js](next.config.js#L1) and [next.config.js](next.config.js#L43), plus manifest metadata in [src/app/layout.tsx](src/app/layout.tsx#L125) and [public/manifest.json](public/manifest.json). The user guide markets installability and offline usage in [src/data/userGuide.ts](src/data/userGuide.ts#L525), [src/data/userGuide.ts](src/data/userGuide.ts#L532), and [src/data/userGuide.ts](src/data/userGuide.ts#L562). The public-facing repo documentation still describes web deployment on Vercel only in [README.md](README.md#L131) and [README.md](README.md#L133).

The requested Windows and macOS executable download flow is therefore additive new scope, not an incomplete hidden feature. The codebase currently supports installable web-app behavior, but not packaged `.exe` or macOS desktop artifacts, and there is no dedicated download route in the app tree.

### 7. Low: SwiftAIChatArea already has editor diagnostics that should be cleaned up before the V1.1 polish pass ships

The editor reports avoidable issues in [src/components/SwiftAIChatArea.tsx](src/components/SwiftAIChatArea.tsx#L233), [src/components/SwiftAIChatArea.tsx](src/components/SwiftAIChatArea.tsx#L393), and multiple button elements without explicit type attributes, including [src/components/SwiftAIChatArea.tsx](src/components/SwiftAIChatArea.tsx#L378), [src/components/SwiftAIChatArea.tsx](src/components/SwiftAIChatArea.tsx#L709), [src/components/SwiftAIChatArea.tsx](src/components/SwiftAIChatArea.tsx#L722), and [src/components/SwiftAIChatArea.tsx](src/components/SwiftAIChatArea.tsx#L735).

These are not the primary product failures, but they are part of the quality bar for a polish release and are cheap to remove while touching Swift AI anyway.

## Verified Non-Issues

The custom link-rendering requirement is already largely solved inside Swift AI. Markdown links are sanitized and rendered with a custom external-link chip treatment in [src/components/SwiftAIChatArea.tsx](src/components/SwiftAIChatArea.tsx#L564), [src/components/SwiftAIChatArea.tsx](src/components/SwiftAIChatArea.tsx#L936), and [src/components/SwiftAIChatArea.tsx](src/components/SwiftAIChatArea.tsx#L954). This surface should be preserved during the V1.1 pass rather than replaced.

The repo also already has a credible offline and installable web baseline. The immediate need is not to invent offline support from zero. It is to tighten which features degrade offline, document the boundary clearly, and decide whether desktop executables are wrappers around the existing PWA or a separate desktop runtime.

## Areas I Could Not Prove From Static Review Alone

The complaint that Swift AI always chooses the same timed session configuration on every start-session request was not provable as a code defect from static inspection. The client start-session path in [src/app/page.tsx](src/app/page.tsx#L95) does vary by requested config, and the text generator is not obviously hard-coded to a single word sequence. This may still be a prompt-behavior issue, but it needs an interaction trace or smoke run before it should be treated as a verified bug.

The request for stronger King Tech Foundation awareness, partnership messaging, and more polished recommendation content is directionally valid, but the codebase shows only partial current support rather than a single broken implementation. There is a footer mention in [src/app/page.tsx](src/app/page.tsx#L342), and Swift AI already carries King Tech Foundation knowledge in [src/app/api/chat/route.ts](src/app/api/chat/route.ts#L238). The missing work is broader product content design, not one isolated defect.

## V1.1 Implementation Order

Start with the layout and state model. Swift AI should move from a modal overlay into a true docked workspace with a persistent session-aware split layout. That change should happen alongside removal of the forced `closePanel()` call on AI-started sessions, because the product behavior requested for V1.1 depends on both changes landing together.

Resolve the stale-context defect next. The safest path is to invalidate or version Swift AI context when session sync completes, then re-fetch or rebuild context on the next assistant turn. That change has direct UX payoff and removes a trust-breaking coaching bug.

Standardize rewards after that. Goal-complete presentation should be reserved for goal-complete events, while streak, rank, and milestone rewards should use either a lighter toast, a feed item, or a separate unlock surface. The queue contract needs to express reward intent explicitly instead of relying on array order.

Fix the review system in one pass: harden createdAt handling, render the full review date, surface whether the signed-in user already has a review, and extend Swift AI context so the assistant can deliberately open the Reviews panel for non-reviewers. The navigate tool path already exists, so the missing piece is decision data, not UI plumbing.

Close the release with product-surface work. That includes a dedicated download page, a decision on desktop packaging strategy for Windows and macOS, updated README and in-app guide content, and stronger but context-aware King Tech Foundation messaging that feels built into the product rather than appended to it.

## Release Readiness Assessment

Swift Type is close enough to ship a stronger V1.1, but not with the current interaction model around Swift AI, rewards, and reviews. Those three areas currently undermine the polish story more than visual styling does. Fixing them will do more for perceived quality than a pure design pass.

The good news is that the repo already contains most of the building blocks needed for the rollout. The remaining work is mostly about correcting control flow, enriching assistant context, and tightening product surfaces so the behavior matches the ambition.