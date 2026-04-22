# Swift Type

Swift Type is a premium typing trainer built with Next.js, React, Tailwind CSS, Zustand, Drizzle ORM, and NextAuth.

It combines focused practice, live performance feedback, cloud sync, rewards, goals, and an AI coach in a single full-screen typing workspace.

## What It Includes

- Timed, word-count, and curriculum-based typing sessions
- Live WPM, accuracy, timer, and error tracking
- Windows and Mac keyboard layouts with guided key feedback
- Goal tracking, streaks, rewards, and completion cards
- Local-first practice with authenticated cloud sync
- Swift AI coaching with persistent chat sessions and message feedback
- Profile, history, rewards, privacy, and user guide panels
- Light and dark theme support

## Authentication

Swift Type currently supports:

- Email and password sign up / sign in
- GitHub sign in
- Google sign in UI placeholder for a later rollout

Guest mode still works for practice. When a user signs in, local session and goal data can be merged into their cloud account.

## Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Zustand
- Framer Motion
- NextAuth v5 beta
- Drizzle ORM with PostgreSQL
- Cloudflare R2 for Swift AI chat persistence
- Vercel AI SDK

## Local Development

### 1. Install dependencies

```bash
pnpm install
```

If you do not use pnpm, `npm install` also works, but this repo ships with a `pnpm-lock.yaml`.

### 2. Create your environment file

Copy `.env.example` to `.env.local` and add the required secrets.

Typical variables used by the app:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_OG_IMAGE_VERSION=2026-04-22
DATABASE_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
```

### 3. Run the app

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Database Notes

The project uses Drizzle schema definitions from `src/db/schema.ts`.

Available commands in the repo today:

```bash
pnpm exec drizzle-kit push
node scripts/drizzle-push.cjs
```

The custom script exists as a fallback path for schema application in environments where a plain Drizzle push is unreliable.

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
```

## Project Structure

```text
src/app                App Router pages and API routes
src/components         UI components and modal/panel surfaces
src/data               Static content, keyboard layouts, and user guide data
src/db                 Drizzle database client and schema
src/lib                Auth, AI, sync, storage, and utility logic
src/store              Zustand typing store
public                 App assets and icons
prototype              Legacy prototype files kept for reference
```

## Key Product Areas

### Practice Engine

The main workspace includes controls, the typing display, live stats, the on-screen keyboard, and post-session analytics.

### Goals, Rewards, and History

Users can track progress over time, keep streaks alive, complete goals, and export clean reward cards.

### Swift AI

Authenticated users can open Swift AI for contextual coaching, typing advice, and targeted drill ideas. Chat sessions are stored per user, and message-level feedback is persisted.

## Prototype Folder

The `prototype/` folder contains the earlier static implementation of the typing experience. The production app lives in `src/` and should be treated as the primary codebase.

## Deployment

The app is structured for deployment on Vercel with a managed Postgres-compatible database and R2-compatible object storage.

## Status

This repository is an active product codebase, not the original static prototype described by the previous README.
