# GOODEALS Typing Practice

This is a lightweight, web-based typing practice app.

How to use:

- Open `keyboard.html` in a browser (Chrome/Edge/Firefox recommended).
- Use the **Start** button to begin a session. Controls include Level, Mode (Timed/Words), Duration, Device (Windows/Mac), Adaptive, and Heatmap toggles.
- The app records WPM and Accuracy, persists session history in `localStorage`, and visualizes trends with Chart.js.

Notes:

- Chart.js is included via CDN in `keyboard.html`.
- Sessions are saved under `goodeals_sessions` in `localStorage` and per-key aggregates under `goodeals_aggregate`.

Development:

- Edit `keyboard.html`, `keyboard.css`, and `keyboard.js` to customize the UI or behavior.
- Follow the `DEVELOPMENT_CHECKLIST.md` for planned work and feature list.

If you want me to add server sync or export/import improvements, tell me what storage mechanism you'd prefer (e.g., Firebase, REST API).
