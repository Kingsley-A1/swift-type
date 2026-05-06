# TESTING.md — Swift AI Testing Strategy

A comprehensive guide for testing the Swift AI integration end-to-end: from API routes to the chat UI. Designed for both CLI-based rapid iteration and browser-based GUI validation.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Validation](#2-environment-validation)
3. [CLI Testing (API Routes)](#3-cli-testing-api-routes)
4. [GUI Testing (Chat UI)](#4-gui-testing-chat-ui)
5. [Edge Cases & Error Paths](#5-edge-cases--error-paths)
6. [Smoke Test Checklist](#6-smoke-test-checklist)

---

## 1. Prerequisites

**Required environment variables** (in `.env.local`):

```env
DATABASE_URL=postgresql://...          # CockroachDB connection string
NEXTAUTH_SECRET=...                    # NextAuth session secret
NEXTAUTH_URL=http://localhost:3000     # NextAuth callback URL
GOOGLE_CLIENT_ID=...                   # Google OAuth client ID
GOOGLE_CLIENT_SECRET=...               # Google OAuth client secret
GITHUB_CLIENT_ID=...                   # GitHub OAuth client ID
GITHUB_CLIENT_SECRET=...               # GitHub OAuth client secret
GOOGLE_GENERATIVE_AI_API_KEY=...       # Gemini API key (auto-read by @ai-sdk/google)
R2_ENDPOINT=https://....r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=swift-type-chats
```

**Database ready:**

```bash
pnpm drizzle-kit push
```

**Dev server running:**

```bash
pnpm dev
```

---

## 2. Environment Validation

Before testing the AI layer, confirm each dependency is reachable.

### Database connectivity

```bash
# Should return an exit code 0 if the DB is reachable
node -e "
  const { neon } = require('@neondatabase/serverless');
  const sql = neon(process.env.DATABASE_URL);
  sql\`SELECT 1\`.then(() => console.log('✓ DB connected')).catch(e => console.error('✗ DB error:', e.message));
"
```

### Gemini API key

```bash
# Quick model probe — should return a response (not an auth error)
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GOOGLE_GENERATIVE_AI_API_KEY" | head -5
```

### R2 bucket access

```bash
# List objects (should not error with AccessDenied)
node -e "
  const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
  const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY }
  });
  s3.send(new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET_NAME, MaxKeys: 1 }))
    .then(() => console.log('✓ R2 connected'))
    .catch(e => console.error('✗ R2 error:', e.message));
"
```

---

## 3. CLI Testing (API Routes)

### 3.1 Get an auth session cookie

All API routes require authentication via NextAuth. You need a valid session cookie.

**Option A: Extract from browser**

1. Sign in at `http://localhost:3000`
2. Open DevTools → Application → Cookies
3. Copy the `next-auth.session-token` cookie value
4. Set it as an environment variable:

```bash
# PowerShell
$SESSION="your-session-token-value"

# Bash / macOS
export SESSION="your-session-token-value"
```

**Option B: Use a `.http` file (VS Code REST Client extension)**
Create a `test.http` file:

```http
@baseUrl = http://localhost:3000
@cookie = next-auth.session-token=YOUR_TOKEN_HERE
```

### 3.2 Chat Sessions CRUD

**Create a chat session:**

```bash
curl -s -X POST http://localhost:3000/api/chat/sessions \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION" \
  -d '{"title": "Test Chat"}'
```

Expected: `{"id":"<uuid>","title":"Test Chat"}`

**List all sessions:**

```bash
curl -s http://localhost:3000/api/chat/sessions \
  -H "Cookie: next-auth.session-token=$SESSION"
```

Expected: JSON array of session objects, ordered by `updatedAt` descending.

**Rename a session:**

```bash
curl -s -X PATCH http://localhost:3000/api/chat/sessions/<SESSION_ID> \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION" \
  -d '{"title": "Renamed Chat"}'
```

Expected: `{"ok":true}`

**Pin/unpin a session:**

```bash
curl -s -X PATCH http://localhost:3000/api/chat/sessions/<SESSION_ID> \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION" \
  -d '{"isPinned": true}'
```

Expected: `{"ok":true}`

**Load chat messages (from R2):**

```bash
curl -s http://localhost:3000/api/chat/sessions/<SESSION_ID> \
  -H "Cookie: next-auth.session-token=$SESSION"
```

Expected: JSON array of messages, or `[]` for a new session.

**Delete a session:**

```bash
curl -s -X DELETE http://localhost:3000/api/chat/sessions/<SESSION_ID> \
  -H "Cookie: next-auth.session-token=$SESSION"
```

Expected: `{"ok":true}`. Verify it no longer appears in listing.

### 3.3 Chat Streaming (Main AI Endpoint)

**Send a message and stream response:**

```bash
curl -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION" \
  -d '{
    "chatSessionId": "<SESSION_ID>",
    "messages": [
      {
        "id": "msg-1",
        "role": "user",
        "parts": [{"type": "text", "text": "What keys should I practice?"}],
        "createdAt": "2026-03-20T00:00:00.000Z"
      }
    ]
  }'
```

**What to verify:**

- Response streams back as Server-Sent Events (SSE) with `text/event-stream` content type
- AI references the user's actual typing data (WPM, accuracy, weak keys)
- Response stays on-topic (typing coaching)
- After stream completes, the messages are persisted in R2 (re-fetch the session to confirm)

**Test system prompt boundary (off-topic):**

```bash
curl -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION" \
  -d '{
    "chatSessionId": "<SESSION_ID>",
    "messages": [
      {
        "id": "msg-1",
        "role": "user",
        "parts": [{"type": "text", "text": "Write me a Python script to sort a list"}],
        "createdAt": "2026-03-20T00:00:00.000Z"
      }
    ]
  }'
```

Expected: Swift AI politely redirects to typing-related topics.

### 3.4 PowerShell-friendly commands

If using PowerShell, use `Invoke-RestMethod`:

```powershell
# Create session
$headers = @{ "Cookie" = "next-auth.session-token=$SESSION"; "Content-Type" = "application/json" }
Invoke-RestMethod -Uri "http://localhost:3000/api/chat/sessions" -Method POST -Headers $headers -Body '{"title":"PS Test"}'

# List sessions
Invoke-RestMethod -Uri "http://localhost:3000/api/chat/sessions" -Method GET -Headers $headers

# Stream chat (raw response)
Invoke-WebRequest -Uri "http://localhost:3000/api/chat" -Method POST -Headers $headers -Body (@{
  chatSessionId = "<SESSION_ID>"
  messages = @(@{
    id = "msg-1"
    role = "user"
    parts = @(@{ type = "text"; text = "How do I get faster at typing?" })
    createdAt = "2026-03-20T00:00:00.000Z"
  })
} | ConvertTo-Json -Depth 5) | Select-Object -ExpandProperty Content
```

---

## 4. GUI Testing (Chat UI)

### 4.1 Opening Swift AI

| Step | Action                              | Expected                                                   |
| ---- | ----------------------------------- | ---------------------------------------------------------- |
| 1    | Click **"Ask Swift"** in the header | Swift AI panel slides in from the right with backdrop blur |
| 2    | Press `Escape`                      | Panel closes                                               |
| 3    | Click the backdrop                  | Panel closes                                               |
| 4    | Re-open while signed out            | "Ask Swift" button should not be visible (auth required)   |

### 4.2 Session Management

| Step | Action                           | Expected                                       |
| ---- | -------------------------------- | ---------------------------------------------- |
| 1    | Open Swift AI (no sessions yet)  | Empty state with "Start a conversation" button |
| 2    | Click **"Start a conversation"** | New session created, chat area opens           |
| 3    | Click **"+"** in sidebar         | Additional session created                     |
| 4    | Click a different session        | Chat area switches, messages load              |
| 5    | Right-click a session            | Context menu: Rename, Pin, Delete              |
| 6    | Rename a session inline          | Title updates in sidebar and DB                |
| 7    | Pin a session                    | Session moves to "Pinned" section              |
| 8    | Delete a session                 | Session removed, R2 data cleaned up            |

### 4.3 Chat Interaction

| Step | Action                                | Expected                                           |
| ---- | ------------------------------------- | -------------------------------------------------- |
| 1    | Type a message and press Enter        | Message appears in chat, streaming response begins |
| 2    | Click a suggestion chip               | Sends that suggestion as a message                 |
| 3    | While streaming, click **Stop**       | Response stops mid-stream                          |
| 4    | Click **Regenerate** (↻)              | Last AI response is regenerated                    |
| 5    | Send multi-line message (Shift+Enter) | Line break in textarea, no premature send          |
| 6    | Send first message in new chat        | Auto-titles the session from user's message        |

### 4.4 Message Quality

| Check                     | Expected                                      |
| ------------------------- | --------------------------------------------- |
| AI references user's data | "Your average WPM is 65" (not generic advice) |
| Bold text renders         | `**text**` → **text**                         |
| Code renders              | `` `code` `` → `code` inline                  |
| Typing indicator          | Three bouncing purple dots while waiting      |
| Long response             | Scrolls to bottom automatically               |

### 4.5 Responsive & Dark Mode

| Check            | Expected                                      |
| ---------------- | --------------------------------------------- |
| Panel width      | 75% of viewport, max 4xl                      |
| Dark mode        | Purple-on-dark palette, no white flashes      |
| Sidebar collapse | Session list scrollable with custom scrollbar |
| Mobile view      | Panel covers full viewport width              |

---

## 5. Edge Cases & Error Paths

### 5.1 Authentication

| Scenario                                         | Expected           |
| ------------------------------------------------ | ------------------ |
| Call `/api/chat` without session cookie          | `401 Unauthorized` |
| Call `/api/chat/sessions` without session cookie | `401 Unauthorized` |
| Expired session token                            | `401 Unauthorized` |

### 5.2 Missing Environment Variables

| Missing Variable               | Expected Behavior                                               |
| ------------------------------ | --------------------------------------------------------------- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Chat returns 500, server logs API key error                     |
| `DATABASE_URL`                 | All routes return 500, DB connection error                      |
| `R2_ENDPOINT` / credentials    | Chat works for streaming but message persistence fails silently |

### 5.3 Network & Rate Limits

| Scenario                  | Expected                                                                |
| ------------------------- | ----------------------------------------------------------------------- |
| Gemini API rate limit hit | Error propagated; UI shows error state                                  |
| R2 write failure          | Chat streaming still works; messages aren't persisted (fire-and-forget) |
| Slow network              | Streaming still progressive, typing indicator shown                     |

### 5.4 Data Edge Cases

| Scenario                      | Expected                                        |
| ----------------------------- | ----------------------------------------------- |
| New user (no typing sessions) | System prompt says "New user — no sessions yet" |
| User with 0 WPM sessions      | Context built without averages                  |
| Delete session then access it | Empty messages returned from R2                 |
| Concurrent chat sessions      | Each session streams independently              |

---

## 6. Smoke Test Checklist

Run through this checklist before considering the feature complete:

```
□ Environment variables validated (DB, Gemini, R2)
□ Sign in with Google/GitHub works
□ "Ask Swift" button appears in header after sign-in
□ Panel opens/closes with animation
□ Can create a new chat session
□ Suggestion chips send messages
□ AI responds with streaming text
□ AI references user's actual typing data
□ Auto-title works on first message
□ Can stop mid-stream
□ Can regenerate last response
□ Sidebar shows pinned/recent sections
□ Can rename, pin, delete sessions
□ Messages persist after closing panel (reload to verify)
□ Dark mode displays correctly
□ Off-topic messages get redirected
□ Keyboard shortcuts still work when panel is closed
□ Keyboard shortcuts are disabled when panel is open
□ ESC closes the panel
□ Multiple back-to-back messages work correctly
□ TypeScript compiles with zero errors: `npx tsc --noEmit`
```
