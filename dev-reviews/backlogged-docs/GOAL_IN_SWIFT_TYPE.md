# Goal System In Swift Type

This document defines the exact recommendation for building a goal system in Swift Type from zero to a polished, production-ready release.

The intent is not to add shallow gamification. The intent is to build a retention system that makes Swift Type feel like a guided training product instead of a passive typing tool.

## Product Position

Swift Type already has the right foundation:

- session history
- authenticated users
- adaptive learning stats
- Swift AI with user-aware context
- right-side slideout architecture for focused tools

What is missing is a commitment loop.

The goal system should create this loop:

1. User sets a daily or weekly goal.
2. User practices and sees progress immediately.
3. Swift AI becomes aware of the goal and coaches against it.
4. User unlocks a clean reward when the goal is completed.
5. User downloads or shares a branded progress card.
6. User returns the next day to keep the streak alive.

That loop should increase retention, AI usage, auth conversion, and the emotional value of progress.

## Core Recommendation

Build this in 3 phases.

- Phase 1: commitment and tracking core
- Phase 2: motivation and shareability
- Phase 3: polish, navigation cleanup, and left sidebar

The system must remain lean.

Do not start with:

- public leaderboards
- points economy
- dozens of badge types
- complex goal builders
- social challenges

Start with a small number of powerful goal types and one clean feedback loop.

## Goal Types For MVP

Support only these initial goal types:

- `sessions_completed`
- `minutes_practiced`
- `average_accuracy`
- `target_wpm`

Support only these goal windows:

- `daily`
- `weekly`

Recommended starter templates:

- Complete 3 sessions today
- Practice 15 minutes this week
- Reach 95% accuracy in 3 sessions
- Hit 45 WPM this week

These templates are enough to prove value without bloating setup.

## Storage Strategy

Use hybrid persistence.

### Guests

- Save goal state locally with Zustand persist.
- Save streak snapshot locally.
- Save reward unlocks locally.

### Authenticated Users

- Save goals, progress, streaks, and rewards in Postgres.
- Keep local optimistic UI for instant feedback.
- Sync local guest state into DB after sign-in if a guest already started a goal.

Why this model:

- guest users keep zero-friction onboarding
- signed-in users get durable progress across devices
- Swift AI can read the DB-backed goal state reliably

## Data Model

Add the following tables.

### 1. `user_goals`

Purpose: stores the active and historical goals for each user.

Suggested fields:

- `id`
- `userId`
- `periodType` -> `daily | weekly`
- `goalType` -> `sessions_completed | minutes_practiced | average_accuracy | target_wpm`
- `targetValue`
- `currentValue`
- `status` -> `active | completed | expired | cancelled`
- `title`
- `startedAt`
- `endsAt`
- `completedAt`
- `createdAt`
- `updatedAt`

### 2. `user_streaks`

Purpose: stores the commitment streak without recalculating the full history every time.

Suggested fields:

- `userId`
- `currentStreak`
- `bestStreak`
- `lastQualifiedAt`
- `updatedAt`

### 3. `user_rewards`

Purpose: stores unlocked rewards and cards.

Suggested fields:

- `id`
- `userId`
- `rewardType` -> `goal_completion | streak | milestone | rank`
- `rewardKey`
- `title`
- `description`
- `metadata` jsonb
- `earnedAt`

### 4. Optional extension to `user_preferences`

Purpose: small preference flags for goals.

Suggested fields:

- `goalReminderEnabled`
- `preferredGoalPeriod`
- `preferredGoalTemplate`
- `sidebarDismissedAt`

## Goal Evaluation Rules

Evaluate progress only when a typing session completes.

This keeps the logic cheap, deterministic, and easy to debug.

### Sessions completed

- Increment by 1 per completed session.

### Minutes practiced

- Add completed session duration in seconds or rounded minutes.
- Recommendation: store in seconds internally and display rounded minutes.

### Average accuracy

- Evaluate against sessions within the active goal window only.
- Recommendation: require a minimum session count for this type so users cannot game the goal with one very short run.

### Target WPM

- Treat as achieved if the user hits the threshold at least once inside the window.
- Later version can support average WPM goals, but do not start there.

## Swift AI Awareness

Swift AI should know the user's active goal state.

Extend the chat context builder to include:

- active daily goal
- active weekly goal
- progress for each goal
- current streak
- best streak
- latest unlocked reward
- whether the user is on track, behind, or complete

Swift AI should then coach against the goal, not only against raw stats.

Examples:

- "You are 2 of 3 sessions into today's goal. One short timed session completes it."
- "Your weekly goal is accuracy-based, so slow down slightly and keep mistakes under control."
- "You completed your weekly goal early. Want to increase next week's target by 10%?"

This is a major product multiplier because the AI becomes a real coach with memory of declared intent.

## Reward System Recommendation

Keep rewards symbolic, branded, and meaningful.

Do not build coins.
Do not build a shop.
Do not build fake loot.

Start with:

- streak milestones
- goal completion badges
- training rank titles
- shareable progress cards

### Recommended rank ladder

- Starter
- Consistent
- Focused
- Fluent
- Velocity
- Elite

Ranks should be unlocked from meaningful effort thresholds, not random actions.

### Initial reward triggers

- complete first daily goal
- complete first weekly goal
- 3-day streak
- 7-day streak
- first 50 WPM goal hit
- first 95% accuracy weekly completion

## Reward Card Recommendation

When a user completes a goal, generate a branded card that can be downloaded or shared.

### Card content

- user name or initials
- goal completed
- period label
- streak count
- key stat highlight
- date or week range
- Swift Type branding
- short Swift AI praise line

### Actions

- Download PNG
- Copy image
- Share if browser supports it

### Technical recommendation

Phase 2 should implement client-side image generation first.

Suggested approach:

- render a hidden reward card component
- capture it with `html-to-image` or `dom-to-image-more`
- export as PNG

This is the fastest path.

Server-side card rendering can come later if needed for richer OG/social workflows.

## UX Rules

The goal system must feel integrated, not bolted on.

Design principles:

- goals should be visible but not noisy
- progress should feel immediate
- rewards should feel premium, not childish
- reminders should be subtle and useful
- all goal actions should work without interrupting practice flow

## Phase 1: Most Important

This phase is the shipping core. If only one phase is completed, it must still create real value.

### Objectives

- allow users to set and track goals
- persist goals locally and in DB
- show progress in the main app
- make Swift AI aware of goals

### Build scope

#### Backend / Data

- Add `user_goals` table
- Add `user_streaks` table
- Add migration for both
- Add minimal goal service helpers:
  - `createGoal`
  - `getActiveGoals`
  - `updateGoalProgressFromSession`
  - `completeGoal`
  - `expireGoal`
  - `updateStreak`

#### API

- Add `GET /api/goals`
- Add `POST /api/goals`
- Add `PATCH /api/goals/:id`
- Add internal server logic to update goal progress when a session is saved

#### Local state

- Add local goal state to Zustand for guests
- Add sync logic on sign-in to merge guest goal progress into DB when safe

#### UI

- Add a compact `GoalPanel` slideout from the right side, matching current slideout language
- Goal panel should support:
  - choose daily or weekly
  - select one of the recommended templates
  - see active goal progress
  - see streak summary

#### Main screen surfacing

- Add a small goal progress chip on the main UI, not a huge card
- Example:
  - `Today's Goal: 2/3 sessions`
  - `Weekly Goal: 11/15 min`

#### Swift AI

- Extend chat prompt context with active goal and streak information
- Allow AI to mention goal status naturally

### Files likely involved

- `src/db/schema.ts`
- `src/app/api/chat/route.ts`
- new goal API routes under `src/app/api/goals/`
- `src/store/useTypingStore.ts`
- new component `src/components/GoalPanel.tsx`
- `src/components/Header.tsx`
- `src/app/page.tsx`

### Success criteria

- user can create a daily or weekly goal in under 10 seconds
- progress updates automatically after session completion
- active goal survives reload and sign-in state
- Swift AI references the active goal accurately

## Phase 2: Medium Priority

This phase turns the system from useful into motivating.

### Objectives

- make progress emotionally rewarding
- improve habit formation
- add clean shareable output

### Build scope

#### Rewards

- Add `user_rewards` table
- Unlock reward records when:
  - a goal is completed
  - a streak threshold is reached
  - a major milestone is hit

#### Reward modal

- Build a `GoalCompleteModal`
- Show:
  - completed goal title
  - streak count
  - unlocked rank or badge if any
  - CTA to download/share card

#### Share card

- Build `RewardCard.tsx`
- Add export actions:
  - download PNG
  - copy to clipboard
  - native share when supported

#### Reminder system

- Add subtle in-app reminder states:
  - if user has no goal
  - if user is behind today
  - if a streak is at risk

Do not add push notifications in this phase.
Only in-product reminders.

#### History integration

- Extend the history area to include:
  - recent goal completions
  - streak history summary

### Swift AI enhancement

- AI should celebrate completions and suggest the next logical goal
- AI should recommend smaller goals after missed streaks rather than pushing harder

### Success criteria

- users feel a moment of completion when goals are hit
- reward cards are exportable in one click
- streaks and completions are visible without cluttering practice flow

## Phase 3: Polish And Navigation Cleanup

This phase introduces better information architecture and makes room for the growing toolset.

### Objectives

- reduce header crowding
- create a persistent, lightweight navigation rail
- make switching between tools faster while preserving the right-side slideout system

### Left Sidebar Recommendation

Build a lightweight left sidebar for the main Swift Type UI.

The reason is now structural, not cosmetic:

- the header should keep only the highest-priority actions
- lower-frequency utility items should move into a clean navigation rail
- users should be able to keep the sidebar open while also opening Docs, Swift AI, Privacy Policy, History, and Goals on the right

### Sidebar behavior

- fixed on the left side
- narrow width, approximately `72px` collapsed and `220px` expanded at most
- glassmorphism styling
- soft border and blur
- clear spacing between items
- always lighter in visual weight than the main typing stage
- must never feel like a second main panel

### Sidebar content recommendation

Keep in header:

- Start / core practice CTA if needed
- theme toggle
- primary Swift AI trigger
- profile/avatar

Move to left sidebar:

- Goals
- Streaks
- History / Stats
- Docs
- Privacy
- Rewards / Progress cards
- future utility items that do not deserve permanent header space

### Goal indicator in the sidebar

The sidebar should visibly remind users there is an active goal without shouting.

Recommended treatments:

- a small glowing orange dot on the Goals item when a goal is active
- a progress ring or thin bar beside the Goals item
- a streak flame icon with a count when relevant
- optional compact text in expanded mode: `2/3 today`

This reminder is important. It makes the sidebar feel alive and makes the goal system discoverable every time the user enters the app.

### Sidebar interaction rules

- collapsed by default on smaller desktop widths if needed
- expandable on click or hover intent
- should not cover the typing area aggressively
- should coexist with all right-side slideouts
- right slideouts should continue to anchor from the right edge independently
- sidebar should not trigger layout jumps in the typing area beyond a small reserved left gutter

### Visual direction

- clean glass panel
- narrow radius
- generous spacing
- subtle orange active states
- no heavy shadows
- no crowded labels
- icons first, text second

### Technical recommendation

Build a dedicated component:

- `src/components/AppSidebar.tsx`

Potential support components:

- `SidebarNavItem.tsx`
- `GoalStatusDot.tsx`
- `SidebarProgressMini.tsx`

### Additional phase 3 polish

- allow opening Goal panel from sidebar while Swift AI or Docs remains open
- add tiny motion polish for sidebar expansion and active indicator
- add empty states for goals and rewards that guide the user to the next action
- improve mobile strategy later with a bottom sheet or drawer, but do not over-rotate on mobile in this phase

### Success criteria

- header is simpler and more premium
- users can switch between Goal, Streak, History, Docs, Privacy, and AI faster
- sidebar coexists cleanly with right-side windows
- active goals remain visible through a small indicator even when the sidebar is collapsed

## Recommended Order Of Delivery

### Sprint order

1. goal data model and evaluation logic
2. goal creation and progress UI
3. Swift AI awareness
4. streak tracking
5. reward unlocks
6. reward card export
7. left sidebar and header simplification
8. final visual polish

## Risks To Avoid

- making the goal setup too configurable too early
- turning rewards into noisy gamification
- cluttering the header further
- hiding goals too deeply in navigation before users understand them
- evaluating goals in too many places instead of one clean session-complete flow
- adding social features before single-user habit retention is proven

## Definition Of Success

This project succeeds if Swift Type moves from passive stat tracking to active habit coaching.

The strongest signs of success will be:

- more users set at least one goal
- more users return the next day
- more signed-in users keep multi-day streaks
- more Swift AI conversations reference goals
- reward cards get downloaded and shared

## Final Recommendation

Ship the smallest serious version first.

That means:

- daily and weekly goals only
- four goal types only
- DB-backed for signed-in users and local for guests
- Swift AI aware from phase 1
- reward cards in phase 2
- left sidebar in phase 3 to keep the product clean as more tools arrive

This is the right scope because it improves retention, strengthens Swift AI, creates a reason to sign in, and gives Swift Type a stronger product identity without adding unnecessary complexity.
