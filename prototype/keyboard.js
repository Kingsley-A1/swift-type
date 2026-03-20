// ==========================================
// 1. SETUP & SELECTION
// ==========================================
const displayScreen = document.getElementById("display-screen");
const keys = document.querySelectorAll(".key");
const themeToggleBtn = document.getElementById("theme-toggle");
const capsLockBtn = document.getElementById("caps-lock");
// New UI elements for sessions and stats
const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const resetBtn = document.getElementById("reset-btn");
const sessionTypeSelect = document.getElementById("session-type");
const sessionDurationInput = document.getElementById("session-duration");
const levelSelector = document.getElementById("level-selector");
const timerDisplay = document.getElementById("timer");
const wpmDisplay = document.getElementById("wpm");
const accuracyDisplay = document.getElementById("accuracy");
const errorsDisplay = document.getElementById("errors");
const targetDisplay = document.getElementById("target-display");
const adaptiveToggle = document.getElementById("adaptive-toggle");
const heatmapToggle = document.getElementById("heatmap-toggle");
const deviceToggle = document.getElementById("device-toggle");

// 2. STATE VARIABLES
let isCapsLock = false;
// (removed logo animation) no animation timeout required

// ====== Session & Stats state ======
let SessionManager = null;
let StatsCollector = null;

// ==========================================
// 3. AUDIO SYSTEM (The "Premium" Click)
// ==========================================

// We create a new Audio object.
// Note: I have used a Base64 string here so you don't need an external file.
// This is a short "mechanical click" sound.
const clickSound = new Audio(
  "data:audio/wav;base64,UklGRiMAAABXQVZFZm10IBAAAAABAAAREAAAAREAAAEAAgAAZGF0YQcAAAAA//8BAAAAAAAAAA0AIgAeAAQAAgAAAAEA//8AAAIACAAGAAgACAAEAAAAAQAAAAAA//8AAP//AAAAAAQABwACAAIAAAAAAAIAAAAAAAAAAAAAAA=="
);
// (Note: In a real production app, you would point this to a .mp3 file url)

function playSound() {
  // CRITICAL FOR FAST TYPING:
  // By default, if a sound is playing, JS waits for it to finish before playing again.
  // We force the sound back to time "0" (the start) so it fires instantly on every rapid click.
  clickSound.currentTime = 0;
  clickSound.play();
}

// ==========================================
// 4. ANIMATION SYSTEM (The "Mature" Pulse)
// ==========================================

// Logo animation removed per user preference.

// ==========================================
// Session & Stats Manager (Basic Implementation)
// ==========================================
// Creates a lightweight session manager and stats collector,
// used to start/stop a typing session, track typed characters
// and calculate WPM and accuracy in real-time.

// Small word list for generating practice text (expandable)
const WORDS = [
  "the",
  "quick",
  "brown",
  "fox",
  "jumps",
  "over",
  "lazy",
  "dog",
  "type",
  "practice",
  "keyboard",
  "good",
  "deal",
  "smart",
  "code",
  "learn",
  "fast",
  "practice",
  "speed",
  "accuracy",
];

function generateTargetText(
  wordCount = 40,
  levelName = "beginner",
  sessionType = "timed"
) {
  // Level-specific character sets
  const level = LEVELS[levelName] || LEVELS["beginner"];
  if (adaptiveToggle && adaptiveToggle.checked) {
    // Update adaptive weights from current perKey stats if available
    adaptiveEngine.updateFromPerKey(
      StatsCollector ? StatsCollector.perKey : {}
    );
  }
  if (sessionType === "words") {
    // Filter words to those comprised of allowed characters
    const allowedChars = new Set(level.allowedChars);
    const filteredWords = WORDS.filter((w) => {
      for (const ch of w) if (!allowedChars.has(ch)) return false;
      return true;
    });
    const out = [];
    for (let i = 0; i < wordCount; i++) {
      if (adaptiveToggle && adaptiveToggle.checked) {
        // generate small word via adaptive sampling
        const len = 2 + Math.floor(Math.random() * 5);
        let w = "";
        for (let c = 0; c < len; c++) {
          const ch =
            adaptiveEngine.sampleChar() ||
            level.allowedChars[
              Math.floor(Math.random() * level.allowedChars.length)
            ];
          w += ch;
        }
        out.push(w);
      } else {
        out.push(
          filteredWords[Math.floor(Math.random() * filteredWords.length)] ||
            WORDS[Math.floor(Math.random() * WORDS.length)]
        );
      }
    }
    return out.join(" ");
  }
  // timed or char-based: generate words built from allowed characters
  const out = [];
  const chars = level.allowedChars;
  for (let i = 0; i < wordCount; i++) {
    // make short words between 1 and 7 chars
    const len =
      2 + Math.floor(Math.random() * Math.min(6, Math.max(2, chars.length)));
    let word = "";
    for (let j = 0; j < len; j++) {
      if (adaptiveToggle && adaptiveToggle.checked) {
        const sampled =
          adaptiveEngine.sampleChar() ||
          chars[Math.floor(Math.random() * chars.length)];
        word += sampled;
      } else {
        word += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    out.push(word);
  }
  return out.join(" ");
}

// StatsCollector keeps a history of typed chars for the session
class Stats {
  constructor() {
    this.reset();
  }
  reset() {
    this.typedHistory = []; // {char, expectedChar, isCorrect, timestamp}
    this.typedCount = 0;
    this.correctCount = 0;
    this.errorCount = 0;
    this.startTime = null;
    this.perKey = {}; // per-key attempts and errors
  }
  start() {
    this.reset();
    this.startTime = Date.now();
  }
  record(char, expectedChar, index) {
    const timestamp = Date.now();
    const isCorrect =
      expectedChar !== undefined && expectedChar !== null
        ? char.toLowerCase() === String(expectedChar).toLowerCase()
        : true; // case-insensitive compare if expected is provided
    this.typedHistory.push({ char, expectedChar, index, isCorrect, timestamp });
    this.typedCount++;
    if (isCorrect) this.correctCount++;
    else this.errorCount++;
    // Update per-key stats
    const key = String(expectedChar || char).toLowerCase();
    if (!this.perKey[key]) this.perKey[key] = { attempts: 0, errors: 0 };
    this.perKey[key].attempts++;
    if (!isCorrect) this.perKey[key].errors++;
    // Update adaptive engine from perKey if available
    if (typeof adaptiveEngine !== "undefined")
      adaptiveEngine.updateFromPerKey(this.perKey);
    this.updateDOM();
    return isCorrect;
  }
  backspace() {
    const last = this.typedHistory.pop();
    if (!last) return;
    const idx = typeof last.index !== "undefined" ? last.index : null;
    this.typedCount = Math.max(0, this.typedCount - 1);
    if (last.isCorrect) this.correctCount = Math.max(0, this.correctCount - 1);
    else this.errorCount = Math.max(0, this.errorCount - 1);
    // adjust perKey if possible
    const key = String(last.expectedChar || last.char).toLowerCase();
    if (this.perKey[key]) {
      this.perKey[key].attempts = Math.max(0, this.perKey[key].attempts - 1);
      if (!last.isCorrect)
        this.perKey[key].errors = Math.max(0, this.perKey[key].errors - 1);
      if (this.perKey[key].attempts === 0) delete this.perKey[key];
    }
    this.updateDOM();
    return idx;
  }
  elapsedSeconds() {
    if (!this.startTime) return 0;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
  wpm() {
    const minutes = this.elapsedSeconds() / 60 || 1 / 60; // avoid div by 0
    // WPM uses characters / 5
    return Math.round(this.typedCount /* raw */ / 5 / minutes);
  }
  accuracyPct() {
    if (this.typedCount === 0) return 100;
    return Math.round((this.correctCount / this.typedCount) * 100);
  }
  updateDOM() {
    // Safe updates to DOM elements
    if (wpmDisplay) wpmDisplay.textContent = this.wpm();
    if (accuracyDisplay) accuracyDisplay.textContent = `${this.accuracyPct()}%`;
    if (errorsDisplay) errorsDisplay.textContent = this.errorCount;
    // Render heatmap if enabled
    if (heatmapToggle && heatmapToggle.checked) {
      renderHeatmap(this.perKey);
    }
  }
}

// =====================
// Level definitions
// =====================
const LEVELS = {
  beginner: {
    name: "Beginner",
    allowedChars: "asdfghjkl", // home row + g
    targetWpm: 20,
    targetAccuracy: 90,
  },
  intermediate: {
    name: "Intermediate",
    allowedChars: "asdfghjklqwertyuiop", // home + top rows
    targetWpm: 35,
    targetAccuracy: 92,
  },
  advanced: {
    name: "Advanced",
    allowedChars: "abcdefghijklmnopqrstuvwxyz0123456789",
    targetWpm: 55,
    targetAccuracy: 95,
  },
  custom: {
    name: "Custom",
    allowedChars: "abcdefghijklmnopqrstuvwxyz",
    targetWpm: 999,
    targetAccuracy: 0,
  },
};

function evaluateLevelProgress(sessionStats, levelName = "beginner") {
  const level = LEVELS[levelName] || LEVELS["beginner"];
  const passed =
    sessionStats.wpm >= level.targetWpm &&
    sessionStats.accuracy >= level.targetAccuracy;
  return {
    passed,
    required: { wpm: level.targetWpm, accuracy: level.targetAccuracy },
    actual: sessionStats,
  };
}

// ==========================
// Adaptive Engine (Basic Keybr-like)
// ==========================
class AdaptiveEngine {
  constructor(alpha = 0.25) {
    this.alpha = alpha;
    this.emaAccuracy = {}; // key -> ema accuracy (0..1)
    this.weights = {}; // key -> normalized weight (sum = 1)
  }
  ensureKey(key) {
    if (!this.emaAccuracy[key]) this.emaAccuracy[key] = 1.0;
    if (!this.weights[key]) this.weights[key] = 0.01;
  }
  updateFromPerKey(perKey) {
    for (const [k, v] of Object.entries(perKey || {})) {
      this.ensureKey(k);
      const accuracy = v.attempts > 0 ? 1 - v.errors / v.attempts : 1.0;
      this.emaAccuracy[k] =
        (1 - this.alpha) * this.emaAccuracy[k] + this.alpha * accuracy;
      // difficulty = 1 - ema
      const difficulty = Math.max(0.01, 1 - this.emaAccuracy[k]);
      this.weights[k] = 0.02 + difficulty * 1.2;
    }
    // Normalize
    const total = Object.values(this.weights).reduce((a, b) => a + b, 0) || 1;
    for (const k of Object.keys(this.weights)) this.weights[k] /= total;
  }
  sampleChar() {
    const entries = Object.entries(this.weights);
    if (entries.length === 0) return null;
    let r = Math.random();
    for (const [k, w] of entries) {
      if (r <= w) return k;
      r -= w;
    }
    return entries[entries.length - 1][0];
  }
}
const adaptiveEngine = new AdaptiveEngine(0.25);

class Session {
  constructor() {
    this.isActive = false;
    this.sessionType = "timed";
    this.durationSec = 60;
    this.timerInterval = null;
    this.timeoutHandle = null;
    this.stats = new Stats();
    this.targetText = "";
    this.typedIndex = 0; // position within the target text
  }
  start(sessionType, durationSec, levelName = "beginner") {
    if (this.isActive) return;
    this.sessionType = sessionType || this.sessionType;
    this.durationSec = durationSec || this.durationSec;
    this.levelName = levelName || "beginner";
    this.targetText = generateTargetText(
      Math.max(20, Math.floor(this.durationSec / 2)),
      this.levelName,
      this.sessionType
    );
    renderTargetText(this.targetText);
    showSessionMessage("");
    this.typedIndex = 0;
    this.stats.start();
    this.isActive = true;
    this._startTimer();
    displayScreen.value = ""; // clear typed area
    displayScreen.focus();
    setSessionUIState(true);
  }
  stop() {
    if (!this.isActive) return;
    this.isActive = false;
    this._stopTimer();
    this.stats.updateDOM();
    // Evaluate level progress (if level selected)
    const evalResult = evaluateLevelProgress(
      {
        wpm: this.stats.wpm(),
        accuracy: this.stats.accuracyPct(),
        errors: this.stats.errorCount,
      },
      this.levelName
    );
    // If the user did not type anything, show a specific message and skip the rest
    if (this.stats.typedCount === 0) {
      showSessionMessage(
        "You didn't type any characters — try a short session to get started!",
        "warn"
      );
      // Still save the session if you want; for now, we don't block save.
    } else if (evalResult.passed) {
      showSessionMessage(
        `WRDONE! your score is WPM: ${this.stats.wpm()}, Accuracy: ${this.stats.accuracyPct()}%`,
        "success"
      );
    } else {
      if (this.stats.wpm() >= LEVELS[this.levelName].targetWpm) {
        showSessionMessage(
          `Nice speed — WPM: ${this.stats.wpm()}, Acc: ${this.stats.accuracyPct()}%`,
          "warn"
        );
      } else if (
        this.stats.accuracyPct() >= LEVELS[this.levelName].targetAccuracy
      ) {
        showSessionMessage(
          `Great accuracy — WPM: ${this.stats.wpm()}, Acc: ${this.stats.accuracyPct()}%`,
          "warn"
        );
      } else {
        showSessionMessage(
          `Keep practicing! WPM: ${this.stats.wpm()}, Acc: ${this.stats.accuracyPct()}%, Errors: ${
            this.stats.errorCount
          }`,
          "fail"
        );
      }
    }
    // Save session to localStorage
    try {
      const sessionObj = {
        sessionId: `sess_${Date.now()}`,
        type: this.sessionType,
        level: this.levelName,
        startTime: this.stats.startTime,
        endTime: Date.now(),
        durationMs: Date.now() - this.stats.startTime,
        typedCount: this.stats.typedCount,
        correctCount: this.stats.correctCount,
        errors: this.stats.errorCount,
        wpm: this.stats.wpm(),
        accuracy: this.stats.accuracyPct(),
        perKey: this.stats.perKey,
      };
      saveSessionToStorage(sessionObj);
    } catch (e) {
      console.warn("Failed to persist session", e);
    }
  }
  reset() {
    this.stop();
    this.stats.reset();
    targetDisplay.innerHTML = "";
    displayScreen.value = "";
    timerDisplay.textContent = "00:00";
    wpmDisplay.textContent = "0";
    accuracyDisplay.textContent = "0%";
    errorsDisplay.textContent = "0";
  }
  _startTimer() {
    // set start time (already set by stats) and update UI every second
    this._stopTimer();
    this.timerInterval = setInterval(() => {
      const elapsed = this.stats.elapsedSeconds();
      const remaining = Math.max(0, this.durationSec - elapsed);
      const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
      const ss = String(remaining % 60).padStart(2, "0");
      timerDisplay.textContent = `${mm}:${ss}`;
      if (this.sessionType === "timed" && remaining <= 0) {
        this.stop();
        // disable stop button
        stopBtn.disabled = true;
        startBtn.disabled = false;
      }
    }, 250);
    // Also set a final timeout to stop session when duration is reached
    if (this.sessionType === "timed" && this.durationSec > 0) {
      this.timeoutHandle = setTimeout(
        () => this.stop(),
        this.durationSec * 1000
      );
    }
    startBtn.disabled = true;
    stopBtn.disabled = false;
  }
  _stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
    startBtn.disabled = false;
    stopBtn.disabled = true;
    // re-enable controls
    setSessionUIState(false);
  }
}

// Initialize managers
SessionManager = new Session();
StatsCollector = SessionManager.stats;

// Attach UI controls to session actions
if (startBtn) {
  startBtn.addEventListener("click", () => {
    const type = sessionTypeSelect ? sessionTypeSelect.value : "timed";
    const duration = sessionDurationInput
      ? Math.max(10, parseInt(sessionDurationInput.value, 10) || 60)
      : 60;
    const levelName = levelSelector ? levelSelector.value : "beginner";
    SessionManager.start(type, duration, levelName);
  });
}
if (stopBtn) {
  stopBtn.addEventListener("click", () => {
    SessionManager.stop();
  });
}
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    SessionManager.reset();
  });
}

// History control elements
const openHistoryBtn = document.getElementById("open-history");
const historyPanel = document.getElementById("history-panel");
const historyOverlay = document.getElementById("history-overlay");
const closeHistoryBtn = document.getElementById("close-history");
const clearHistoryBtn = document.getElementById("clear-history");
const historyList = document.getElementById("history-list");
const historyChartCanvas = document.getElementById("history-chart");
let historyChart = null;
const exportHistoryBtn = document.getElementById("export-history");
const importHistoryInput = document.getElementById("import-history");

// Ensure panel/overlay are hidden by default on page load
window.addEventListener("DOMContentLoaded", () => {
  if (historyPanel) {
    historyPanel.classList.add("hidden");
    historyPanel.setAttribute("aria-hidden", "true");
    historyPanel.setAttribute("tabindex", "-1");
    // remove any inline transform that might override CSS
    historyPanel.style.transform = null;
  }
  if (historyOverlay) {
    historyOverlay.classList.add("hidden");
    historyOverlay.style.opacity = "0";
    historyOverlay.setAttribute("aria-hidden", "true");
    historyOverlay.setAttribute("tabindex", "-1");
  }
});

if (openHistoryBtn) {
  openHistoryBtn.addEventListener("click", () => {
    if (!historyPanel) return;
    historyPanel.classList.remove("hidden");
    historyPanel.setAttribute("aria-hidden", "false");
    if (historyOverlay) {
      historyOverlay.classList.remove("hidden");
      historyOverlay.setAttribute("aria-hidden", "false");
    }
    if (closeHistoryBtn) closeHistoryBtn.focus();
    renderHistory();
  });
}
// (close and overlay handlers implemented below with ARIA/focus)

// Improve accessibility: set ARIA attributes and return focus on close
if (closeHistoryBtn) {
  closeHistoryBtn.addEventListener("click", () => {
    if (historyPanel) {
      historyPanel.classList.add("hidden");
      historyPanel.setAttribute("aria-hidden", "true");
    }
    if (historyOverlay) historyOverlay.classList.add("hidden");
    if (historyOverlay) historyOverlay.setAttribute("aria-hidden", "true");
    if (openHistoryBtn) openHistoryBtn.focus();
  });
}
if (historyOverlay) {
  historyOverlay.addEventListener("click", () => {
    if (historyPanel) {
      historyPanel.classList.add("hidden");
      historyPanel.setAttribute("aria-hidden", "true");
    }
    if (historyOverlay) historyOverlay.classList.add("hidden");
    if (historyOverlay) historyOverlay.setAttribute("aria-hidden", "true");
    if (openHistoryBtn) openHistoryBtn.focus();
  });
}
if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener("click", () => {
    localStorage.removeItem("goodeals_sessions");
    localStorage.removeItem("goodeals_aggregate");
    renderHistory();
  });
}

if (exportHistoryBtn) {
  exportHistoryBtn.addEventListener("click", () => {
    const sessions = getSessions();
    const blob = new Blob([JSON.stringify(sessions, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `goodeals_sessions_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}
if (importHistoryInput) {
  importHistoryInput.addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const sessions = JSON.parse(ev.target.result);
        if (Array.isArray(sessions)) {
          localStorage.setItem("goodeals_sessions", JSON.stringify(sessions));
          // Aggregate
          localStorage.removeItem("goodeals_aggregate");
          sessions.forEach((s) => updateAggregate(s));
          renderHistory();
        }
      } catch (err) {
        console.warn("Invalid import file", err);
      }
    };
    reader.readAsText(f);
  });
}

// Persistence functions
function getSessions() {
  try {
    return JSON.parse(localStorage.getItem("goodeals_sessions") || "[]");
  } catch (e) {
    return [];
  }
}
function saveSessionToStorage(sessionObj) {
  const arr = getSessions();
  arr.unshift(sessionObj);
  // limit to 200 sessions
  while (arr.length > 200) arr.pop();
  localStorage.setItem("goodeals_sessions", JSON.stringify(arr));
  // update aggregates
  updateAggregate(sessionObj);
  // if history panel open, re-render
  if (historyPanel && !historyPanel.classList.contains("hidden"))
    renderHistory();
}
function updateAggregate(sessionObj) {
  try {
    const agg = JSON.parse(localStorage.getItem("goodeals_aggregate") || "{}");
    const perKey = sessionObj.perKey || {};
    for (const [k, v] of Object.entries(perKey)) {
      if (!agg[k]) agg[k] = { attempts: 0, errors: 0 };
      agg[k].attempts += v.attempts || 0;
      agg[k].errors += v.errors || 0;
    }
    localStorage.setItem("goodeals_aggregate", JSON.stringify(agg));
  } catch (e) {
    console.warn("Could not update aggregate", e);
  }
}
function getAggregate() {
  try {
    return JSON.parse(localStorage.getItem("goodeals_aggregate") || "{}");
  } catch (e) {
    return {};
  }
}

// Render history UI and Chart
function renderHistory() {
  const sessions = getSessions();
  // render list
  if (historyList) {
    historyList.innerHTML = "";
    sessions.slice(0, 50).forEach((s) => {
      const li = document.createElement("li");
      li.textContent = `${new Date(s.startTime).toLocaleString()} — ${
        s.level || "N/A"
      } — WPM: ${s.wpm} — Acc: ${s.accuracy}% — ${s.typedCount} chars`;
      historyList.appendChild(li);
    });
  }
  // render chart
  if (historyChartCanvas) {
    const labels = sessions
      .slice(0, 30)
      .map((s) => new Date(s.startTime).toLocaleDateString());
    const dataWpm = sessions.slice(0, 30).map((s) => s.wpm);
    const dataAccuracy = sessions.slice(0, 30).map((s) => s.accuracy);
    if (historyChart) {
      historyChart.data.labels = labels;
      historyChart.data.datasets[0].data = dataWpm;
      historyChart.data.datasets[1].data = dataAccuracy;
      historyChart.update();
    } else {
      // create chart
      if (typeof Chart !== "undefined") {
        historyChart = new Chart(historyChartCanvas.getContext("2d"), {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: "WPM",
                data: dataWpm,
                borderColor: "rgba(59,130,246,1)",
                tension: 0.3,
                yAxisID: "y",
              },
              {
                label: "Accuracy",
                data: dataAccuracy,
                borderColor: "rgba(16,185,129,1)",
                tension: 0.3,
                yAxisID: "y1",
              },
            ],
          },
          options: {
            scales: {
              y: {
                type: "linear",
                position: "left",
                title: { display: true, text: "WPM" },
              },
              y1: {
                type: "linear",
                position: "right",
                min: 0,
                max: 100,
                title: { display: true, text: "Accuracy (%)" },
                grid: { drawOnChartArea: false },
              },
            },
          },
        });
      }
    }
  }
  // summary stats
  const avgWpmEl = document.getElementById("summary-avgWpm");
  const bestWpmEl = document.getElementById("summary-bestWpm");
  const avgAccEl = document.getElementById("summary-avgAcc");
  if (avgWpmEl || bestWpmEl || avgAccEl) {
    const wpmVals = sessions.map((s) => s.wpm || 0);
    const accVals = sessions.map((s) => s.accuracy || 0);
    const avgWpm = wpmVals.length
      ? Math.round(wpmVals.reduce((a, b) => a + b, 0) / wpmVals.length)
      : 0;
    const bestWpm = wpmVals.length ? Math.max(...wpmVals) : 0;
    const avgAcc = accVals.length
      ? Math.round(accVals.reduce((a, b) => a + b, 0) / accVals.length)
      : 0;
    if (avgWpmEl) avgWpmEl.textContent = avgWpm;
    if (bestWpmEl) bestWpmEl.textContent = bestWpm;
    if (avgAccEl) avgAccEl.textContent = `${avgAcc}%`;
  }
}

// Control UI during active sessions: disable/enable controls except Stop
function setSessionUIState(isRunning) {
  if (!startBtn || !stopBtn) return;
  startBtn.disabled = isRunning;
  stopBtn.disabled = !isRunning;
  if (resetBtn) resetBtn.disabled = isRunning;
  if (openHistoryBtn) openHistoryBtn.disabled = isRunning;
  // disable inputs that shouldn't change during session
  if (sessionTypeSelect) sessionTypeSelect.disabled = isRunning;
  if (sessionDurationInput) sessionDurationInput.disabled = isRunning;
  if (levelSelector) levelSelector.disabled = isRunning;
  if (deviceToggle) deviceToggle.disabled = isRunning;
  if (adaptiveToggle) adaptiveToggle.disabled = isRunning;
  if (heatmapToggle) heatmapToggle.disabled = isRunning;
  // visually indicate
  const controlsEl = document.getElementById("controls");
  if (controlsEl) controlsEl.classList.toggle("disabled", isRunning);
}

// Render target string into spans per word and char for per-character feedback
function renderTargetText(target) {
  if (!targetDisplay) return;
  targetDisplay.innerHTML = "";
  let idx = 0;
  const fragment = document.createDocumentFragment();
  const words = target.split(/(\s+)/); // preserve spaces
  let wordIndex = 0;
  words.forEach((w) => {
    if (/^\s+$/.test(w)) {
      const space = document.createElement("span");
      space.className = "target-space";
      space.textContent = w;
      space.dataset.index = idx;
      fragment.appendChild(space);
      idx += w.length; // spaces count
      return;
    }
    const wordEl = document.createElement("span");
    wordEl.className = "target-displayed-word";
    wordEl.dataset.wordIndex = wordIndex;
    for (let i = 0; i < w.length; i++) {
      const ch = w[i];
      const span = document.createElement("span");
      span.className = "target-displayed-char";
      span.dataset.index = idx;
      span.dataset.wordIndex = wordIndex;
      span.textContent = ch;
      wordEl.appendChild(span);
      idx++;
    }
    fragment.appendChild(wordEl);
    wordIndex++;
  });
  targetDisplay.appendChild(fragment);
}

// Utility to mark a character at index as correct/incorrect
function markChar(index, isCorrect) {
  const sel = targetDisplay.querySelector(
    `.target-displayed-char[data-index="${index}"]`
  );
  if (!sel) return;
  sel.classList.remove("correct", "incorrect");
  sel.classList.add(isCorrect ? "correct" : "incorrect");
  // mark word
  const word = sel.parentElement;
  if (word && word.classList.contains("target-displayed-word")) {
    const hasIncorrect = word.querySelector(".target-displayed-char.incorrect");
    if (hasIncorrect) word.classList.add("incorrect");
    else word.classList.remove("incorrect");
  }
}

// Utility to clear char mark when backspacing
function clearChar(index) {
  const sel = targetDisplay.querySelector(
    `.target-displayed-char[data-index="${index}"]`
  );
  if (!sel) return;
  sel.classList.remove("correct", "incorrect");
  const word = sel.parentElement;
  if (word && word.classList.contains("target-displayed-word")) {
    const hasIncorrect = word.querySelector(".target-displayed-char.incorrect");
    if (!hasIncorrect) word.classList.remove("incorrect");
  }
}

// Session message helper
const sessionMessageEl = document.getElementById("session-message");
function showSessionMessage(msg, type = "") {
  if (!sessionMessageEl) return;
  sessionMessageEl.textContent = msg;
  sessionMessageEl.classList.remove("success", "warn", "fail");
  if (type) sessionMessageEl.classList.add(type);
}

// ==========================================
// 5. CORE FUNCTIONS
// ==========================================

function toggleCapsLock() {
  playSound(); // Add sound here
  isCapsLock = !isCapsLock;
  capsLockBtn.classList.toggle("active");

  keys.forEach((key) => {
    if (key.innerText.length === 1) {
      const letter = key.innerText;
      key.innerText = isCapsLock ? letter.toUpperCase() : letter.toLowerCase();
    }
  });
}

function addCharacter(character) {
  // Apply caps lock
  const actualChar = isCapsLock
    ? character.toUpperCase()
    : character.toLowerCase();
  // If session active, record and compute expected correctness
  if (SessionManager && SessionManager.isActive) {
    const idx = SessionManager.typedIndex;
    const expected = SessionManager.targetText
      ? SessionManager.targetText[idx]
      : undefined;
    // record char and mark DOM
    const isCorrect = StatsCollector.record(actualChar, expected, idx);
    markChar(idx, isCorrect);
    // advance index
    SessionManager.typedIndex = Math.min(
      SessionManager.targetText.length,
      SessionManager.typedIndex + 1
    );
  }
  // Add to textarea
  displayScreen.value += actualChar;
  // Trigger audio (no logo animation)
  playSound();
}

// ==========================================
// 6. EVENT LISTENERS (Virtual & Physical)
// ==========================================

keys.forEach((key) => {
  key.addEventListener("click", () => {
    const dataKey = key.getAttribute("data-key");
    const dataChar = key.getAttribute("data-char");

    if (!dataKey && !dataChar) return;

    // Add a subtle physical ripple logic here if desired
    if (key.id === "caps-lock") {
      toggleCapsLock();
    } else if (dataKey === "Backspace") {
      playSound(); // Backspace needs sound too!
      // If session active, update stats/backspace history
      if (SessionManager && SessionManager.isActive) {
        const removedIdx = StatsCollector.backspace();
        if (typeof removedIdx === "number") clearChar(removedIdx);
        SessionManager.typedIndex = Math.max(0, SessionManager.typedIndex - 1);
      }
      displayScreen.value = displayScreen.value.slice(0, -1);
    } else {
      // if key has a printable char use it; otherwise fallback to key code
      const charToInsert = dataChar ? dataChar : dataKey;
      if (charToInsert === " " || charToInsert === "Space") {
        addCharacter(" ");
      } else if (dataKey === "Tab") {
        // Insert tab as 4 spaces
        addCharacter("\t");
      } else if (dataKey === "Enter") {
        addCharacter("\n");
      } else {
        addCharacter(charToInsert);
      }
    }
  });
});

document.addEventListener("keydown", (event) => {
  const pressedKeyRaw = event.key;
  const pressedKey = pressedKeyRaw.toLowerCase();
  const pressedCode = event.code;
  // Attempt to find a matching virtual key by code, full name, or lowercase
  let virtualKey =
    document.querySelector(`.key[data-key="${pressedCode}"]`) ||
    document.querySelector(`.key[data-key="${pressedKeyRaw}"]`) ||
    document.querySelector(`.key[data-key="${pressedKey}"]`);

  if (virtualKey) {
    // Visuals
    virtualKey.classList.add("active");
    setTimeout(() => virtualKey.classList.remove("active"), 100);
    // Audio only (no logo animation)
    playSound();

    // Session recording: if active, record keystrokes into StatsCollector
    if (SessionManager && SessionManager.isActive) {
      if (pressedKeyRaw === "Backspace") {
        const removedIdx = StatsCollector.backspace();
        if (typeof removedIdx === "number") clearChar(removedIdx);
        SessionManager.typedIndex = Math.max(0, SessionManager.typedIndex - 1);
        event.preventDefault();
        displayScreen.value = displayScreen.value.slice(0, -1);
      } else if (pressedKeyRaw.length === 1) {
        // Normalize the char according to caps
        const actualChar = isCapsLock
          ? pressedKeyRaw.toUpperCase()
          : pressedKeyRaw;
        event.preventDefault();
        const idx = SessionManager.typedIndex;
        const expected = SessionManager.targetText
          ? SessionManager.targetText[idx]
          : undefined;
        const isCorrect = StatsCollector.record(actualChar, expected, idx);
        markChar(idx, isCorrect);
        SessionManager.typedIndex = Math.min(
          SessionManager.targetText.length,
          SessionManager.typedIndex + 1
        );
        displayScreen.value += actualChar;
      }
    }

    displayScreen.focus();
  }
});

themeToggleBtn.addEventListener("click", () => {
  playSound(); // Even the toggle button should feel tactile
  document.body.classList.toggle("dark-mode");
});

// Key label renderer: update key labels for device type
function renderKeyLabels(device = "auto") {
  const resolved =
    device === "auto"
      ? navigator.platform && navigator.platform.toLowerCase().includes("mac")
        ? "mac"
        : "windows"
      : device;
  const keysEl = document.querySelectorAll(".key");
  keysEl.forEach((k) => {
    const win = k.getAttribute("data-label-windows");
    const mac = k.getAttribute("data-label-mac");
    if (resolved === "mac") {
      if (mac) k.innerText = mac;
    } else {
      if (win) k.innerText = win;
    }
  });
}

// Heatmap rendering: set classes based on perKey stats
function renderHeatmap(perKeyStats) {
  const allKeys = document.querySelectorAll(".key");
  allKeys.forEach((k) => {
    const dataChar = k.getAttribute("data-char");
    const dataKey = k.getAttribute("data-key");
    const keyInner = String(k.innerText || "").trim();
    const candidates = [];
    if (dataChar) candidates.push(String(dataChar).toLowerCase());
    if (dataKey) candidates.push(String(dataKey).toLowerCase());
    if (keyInner) candidates.push(String(keyInner).toLowerCase());
    let stats = undefined;
    for (const cand of candidates) {
      if (perKeyStats && perKeyStats[cand]) {
        stats = perKeyStats[cand];
        break;
      }
    }
    let ratio = 0;
    if (stats && stats.attempts > 0) ratio = stats.errors / stats.attempts;
    let cls = "key-heat-0";
    if (ratio >= 0.35) cls = "key-heat-5";
    else if (ratio >= 0.25) cls = "key-heat-4";
    else if (ratio >= 0.15) cls = "key-heat-3";
    else if (ratio >= 0.07) cls = "key-heat-2";
    else if (ratio >= 0.02) cls = "key-heat-1";
    k.classList.remove(
      "key-heat-0",
      "key-heat-1",
      "key-heat-2",
      "key-heat-3",
      "key-heat-4",
      "key-heat-5"
    );
    k.classList.add(cls);
  });
}

// Initialize device labels on load
if (deviceToggle) {
  const stored = localStorage.getItem("goodeals_deviceType") || "auto";
  deviceToggle.value = stored;
  renderKeyLabels(stored);
  deviceToggle.addEventListener("change", (e) => {
    const val = e.target.value || "auto";
    renderKeyLabels(val);
    localStorage.setItem("goodeals_deviceType", val);
  });
}

// Heatmap toggle
if (heatmapToggle) {
  heatmapToggle.addEventListener("change", () => {
    if (heatmapToggle.checked) renderHeatmap(StatsCollector.perKey);
    else
      document
        .querySelectorAll(".key")
        .forEach((k) =>
          k.classList.remove(
            "key-heat-0",
            "key-heat-1",
            "key-heat-2",
            "key-heat-3",
            "key-heat-4",
            "key-heat-5"
          )
        );
  });
}

// Start with heatmap off
if (heatmapToggle && !heatmapToggle.checked) {
  document
    .querySelectorAll(".key")
    .forEach((k) =>
      k.classList.remove(
        "key-heat-0",
        "key-heat-1",
        "key-heat-2",
        "key-heat-3",
        "key-heat-4",
        "key-heat-5"
      )
    );
}

// Render initial history on load
renderHistory();
