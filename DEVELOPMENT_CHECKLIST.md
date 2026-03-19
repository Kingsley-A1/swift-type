# Development Checklist: GOODEALS Typing Practice

This checklist contains the prioritized plan for converting the current typing demo into a full-featured, adaptive keyboard practice app with per-key statistics, timed/level sessions, device-specific keyboards (Windows vs Apple), heatmaps, history persistence, and a clean UI.

---

## Overview

- Purpose: Build a lightweight, powerful, and beautiful typing practice web app.
- Base files: `keyboard.html`, `keyboard.css`, `keyboard.js`
- Focus: Real-time metrics (WPM, accuracy), sessions, levels, adaptive engine, per-key statistics & heatmap, local persistence, device-specific keyboard display.

---

## High-Priority Checklist (Ordered by priority)

1. Add Session Controls & Real-Time Metrics (WPM & Accuracy) ✅

   - [x] Add controls to `keyboard.html` under header: `#controls` container with `#start-btn`, `#stop-btn`, `#reset-btn`, `#session-type` (timed/words), and `#session-duration` input.
   - [x] Add live `#timer` and `#stats-panel` ( `#wpm`, `#accuracy`, `#errors` ) elements.
   - [x] Implement `SessionManager` in `keyboard.js` with `startSession()`, `stopSession()`, `resetSession()`.
   - [x] Implement `StatsCollector.recordKey({key, expected, isCorrect, timestamp})` and compute live WPM and accuracy.
   - [x] UI acceptance criteria: Timer runs; WPM & accuracy update as keystrokes happen; start/stop works and session summary displays.
   - Files: `keyboard.html`, `keyboard.css`, `keyboard.js`

2. Timed Practice Mode & Level Selector ✅

   - [x] Add `#level-selector` UI to `keyboard.html` (Beginner, Intermediate, Advanced, Custom)
   - [x] Add `levels` definitions to `keyboard.js` with base targets (keys, WPM goals, accuracy goals)
   - [x] Add timed session handling in `SessionManager` (reads `#session-duration`), and `evaluateLevelProgress(sessionStats)`.
   - [x] UI acceptance criteria: User picks level & duration; session uses level-targeted character sets.
   - Files: `keyboard.html`, `keyboard.js`, `keyboard.css`

3. Implement Adaptive Engine (Keybr-like) ✅

   - [x] Implement `AdaptiveEngine` in `keyboard.js` to track per-key accuracy and compute weights.
   - [x] Implement sampling method to produce practice sequences or words that focus on difficult keys.
   - [x] Use EMA for per-key accuracy updates; expose `#adaptive-toggle` in UI.
   - [x] UI acceptance criteria: Adaptive sequences run; per-key accuracy updates change frequency of keys in practice.
   - Files: `keyboard.js`, `keyboard.html`

4. Per-Key Tracking & Heatmap ✅

   - [x] Add `perKeyStats` to `StatsCollector` storing attempts, misses, and accuracy per key.
   - [x] Build a heatmap overlay that colors keys by error rate or frequency (set CSS classes `key-heat-0..5` for gradient effect).
   - [x] Add `#heatmap-toggle` to `keyboard.html` to enable/disable view.
   - [x] UI acceptance criteria: Heatmap updates in real-time; keys color change reflects actual performance.
   - Files: `keyboard.js`, `keyboard.css`, `keyboard.html`

5. Session History & Persistence ✅

   - [x] Add `Persistence` module to `keyboard.js` (use `localStorage` or `localForage`).
   - [x] Implement `saveSession(sessionObj)` and `getSessions()`.
   - [x] Add `#history-panel` to `keyboard.html` to view past sessions with graphs.
   - [x] UI acceptance criteria: Sessions persist across reloads; history panel lists session summaries; export/import JSON available.
   - Files: `keyboard.js`, `keyboard.html`, `keyboard.css`

6. Key Heatmap Analytics & Charts ✅

   - [x] Integrate a lightweight charting lib (Chart.js) to display WPM & accuracy trend lines.
   - [x] Add `#history-graph` canvas to `keyboard.html`.
   - [x] Provide quick stats: best WPM, average WPM, best accuracy.
   - [x] UI acceptance criteria: Graph loads and renders sessions; chart updates when new sessions saved.
   - Files: `keyboard.html`, `keyboard.js`, `keyboard.css`

7. Device-Type Keyboard Display (Windows vs Apple) - Outstanding Feature ✅

   - [x] Add `#device-toggle` UI (Apple / Windows / Auto-detect) to `keyboard.html` (top controls). Store selection in `localStorage` as `deviceType`.
   - [x] Render key labels dynamically from `keyboard.js` using data-label-windows and data-label-mac attributes (for keys that are available in layout).
   - [x] Provide data-key attributes and data labels for common modifiers and function keys (Ctrl/Meta/Alt/Tab/Enter/Shift). More keys can be added later.
   - [x] Physical key mapping: keydown handler now attempts to match by `event.code` first (e.g., ControlLeft/ShiftLeft) and falls back to `event.key` mappings. This improves cross-platform mapping.
   - [x] UI acceptance criteria: Selecting device type switches keyboard display labels; the virtual keyboard maps correctly to physical keys for supported keys; user preference persists.
   - Files: `keyboard.html`, `keyboard.css`, `keyboard.js`

8. Accessibility & UX Polishing ✅

   - [ ] Add ARIA roles and `tabindex` to `.key` elements.
   - [ ] Add focus styling and ensure `Space`, `Tab`, `Enter` work properly with `displayScreen`.
   - [ ] Add settings: `#sound-toggle`, `#night-mode`, `#large-keys` for accessibility.
   - [ ] UI acceptance criteria: App usable with keyboard navigation; screen readers handle the session summary.
   - Files: `keyboard.html`, `keyboard.css`, `keyboard.js`

9. Export / Import & Share ✅

   - [ ] Add JSON export/import for history and settings in `#settings-panel`.
   - [ ] Add shareable links or a simple JSON blob that user can save and re-import.
   - [ ] UI acceptance criteria: Export JSON contains sessions, per-key stats, and settings; Import reconstructs state.
   - Files: `keyboard.html`, `keyboard.js`

10. Testing & Documentation ✅

- [ ] Write tests for stats & adaptive engine (manual unit test harness or simple test functions in `test.js`).
- [ ] Update README with usage notes and developer instructions.
- [ ] Provide a `Try It` guide and recommended session flow for users.
- [ ] UI acceptance criteria: Documented steps for devs to run; basic test harness exists.
- Files: `README.md`, `test.js` (optional), `keyboard.js`

---

## Device-Type (Apple vs Windows) Feature Details

- Device selection implies both visual and semantic mapping changes:
  - Visual: Key label differences (⌘ vs Win, Option vs Alt, Ctrl same) and small layout differences (Mac small Fn row, Windows has dedicated PrintScrn or different arrow cluster).
  - Functional: Map event.key values to their platform equivalents so pressing the physical key triggers the correct virtual key label and correct StatsCollector recording.
  - UI: Offer a persistent toggle in `#controls` (Auto-detect option checks `navigator.platform` or `navigator.userAgent`).
- Implementation details:
  - Structure HTML keyboard as a single `#keyboard` container with `.key[data-key="..."]` for the logical key. Each key should also include data attributes for platform-specific labels, e.g., `data-label-windows="Ctrl" data-label-mac="⌘"` and JS sets the innerText depending on `deviceType`.
  - Actions/Modifiers: Provide a mapping table in `keyboard.js`:
    ```js
    const keyLabelMap = {
      ctrl: { windows: "Ctrl", mac: "Control" },
      meta: { windows: "Win", mac: "⌘" },
    };
    ```
  - Add keyboard layout renderer to re-label and reflow keys when selection changes (and use a CSS class if necessary to change grouping).
  - Local persistence: store user selection under `localStorage['goodeals_deviceType']`.

---

## Acceptance Criteria for Project Completion

- Session controls and stats show correct behaviour; WPM/accuracy computed using standard formula (WPM = (characters / 5) / minutes).
- Timed sessions and levels function as expected; session summary persists and history shows at least 10 previous sessions.
- Adaptive engine updates perKey weights and those weights influence the next practice sequence in the session.
- Heatmap updates in real-time to reflect error rate / frequency; device toggle visually switches keyboard labels and layout.
- High-fidelity UI & accessibility: all interactive controls have keyboard focus, ARIA attributes, and are navigable via keyboard.

---

## File-by-File Implementation Map (Short)

- `keyboard.html`: Add controls: `#controls`, `#level-selector`, `#session-type`, `#session-duration`, `#device-toggle`, `#history-panel`, `#heatmap-toggle`, `#stats-panel`.
- `keyboard.css`: Add responsive layout for controls; heatmap color classes `.key-heat-0..5`; accessibility focus states.
- `keyboard.js`: Add `SessionManager`, `StatsCollector`, `AdaptiveEngine`, `Persistence` modules, small `KeyLabelRenderer` for platform-specific label updates, and wire up UI events.

---

## Time Estimates (approx.)

- Step 1 (Session controls): 3–5 hours
- Step 2 (Timed & Levels): 3–6 hours
- Step 3 (Adaptive Engine): 4–8 hours
- Step 4 (Heatmap & Charts): 3–6 hours
- Step 5 (Persistence & History): 2–4 hours
- Step 6 (Device-type keyboard & UI reflow): 2–4 hours
- Polishing & Accessibility: 3–6 hours

---

## Next Steps / Priority Actions (Immediate)

- Add the top `#controls` bar to `keyboard.html` with the Start/Stop and device toggle.
- Add a minimal `SessionManager` and `StatsCollector` to `keyboard.js` to begin recording keystrokes with WPM / accuracy calculations.
- Implement the device-type toggle in `keyboard.js` and re-render labels using data attributes for keys.

---

## How to Test Step 1 (Quick Manual Tests)

1. Open `keyboard.html` in a browser.
2. Ensure the controls bar appears: Start, Stop, Reset, Mode selector, Duration input, Device select.
3. Click Start (default timed 60 seconds): a target text should appear and timer should start counting down.
4. Type on the physical keyboard or click virtual keys: the characters should appear in the textarea and the WPM & Accuracy stats should update in real-time.
5. Use Backspace to correct; errors should update accordingly and the typed area should reflect changes.
6. Stop the session: timer stops and the statistics retain their final values.
7. Reset: session clears, timer reset to 00:00, and stats return to zeros.

If any behavior deviates, open the console and verify there are no JS errors and report the failing step.

---

## How to Test Step 2 (Level Selector & Timed Mode)

1. Open `keyboard.html` in a browser.
2. Choose a Level from the Level selector (Beginner/Intermediate/Advanced) and a duration.
3. Click Start: the target string should be generated using only the allowed characters for that level; for example Beginner should be smaller words/characters from the home row (a s d f g h j k l).
4. Type using your keyboard or the virtual keys: WPM and Accuracy should update as before.
5. When the session stops (timer expiry or Stop button), a short message should appear in the target display: either success (✅) if user met the level target WPM and accuracy, or a progress message indicating results.
6. Repeat by choosing another level to confirm generator and evaluation for each level.

If anything differs, check console for errors and ensure the level selector was passed into the Session manager.

---

## How to Test Step 3 & Step 4 (Adaptive Engine, Device Labels & Heatmap)

1. Open `keyboard.html` in a browser.
2. Toggle `Adaptive` in the controls; Start a session and type keys that you normally mistype more often. Observe whether the next generated practice text emphasizes those characters (hard keys should appear more frequently).
3. Toggle `Heatmap` in the controls; type incorrectly several times on a specific key and watch that key change color according to the error frequency (key-heat classes change color intensity).
4. Toggle `Device` to `Mac` or `Windows`. Watch the labels on the modifier keys (Ctrl/Win/Alt/⌘/Option) change according to your selection.
5. With `Device` set, press a modifier key and verify that the correct virtual key on the on-screen keyboard visually activates (e.g., pressing the Ctrl key should highlight the Ctrl key; pressing Command on a Mac should highlight Command/Meta key).
6. Confirm you can enable both Adaptive and Heatmap simultaneously; confirm that the heatmap adjusts as you practice and the adaptive sampling becomes more focused on difficult keys.

---

## Notes / Tips

- Prefer `localStorage` for initial implementation, then `localForage` for larger data or IndexedDB.
- Use `Chart.js` for quick data visualizations
- Start with `timed` mode only (e.g., 30/60/120 sec) and `Beginner` / `Intermediate` / `Advanced` key sets to simplify rollout.
- For adaptive sampling, use exponential moving average (EMA) to weigh recent errors more than historical accuracy.

---

## Developer Handoff

- Provide these tasks as PR small increments (start with a small PR adding the controls). Ensure each PR has a test plan for the acceptance criteria.
- Document where to find code: `keyboard.html` controls and `keyboard.js` `SessionManager`.

---

End of checklist
