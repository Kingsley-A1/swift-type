export interface GuideSection {
  id: string;
  title: string;
  emoji: string;
  level: "beginner" | "intermediate" | "advanced" | "all";
  tags: string[];
  content: GuideBlock[];
}

export type GuideBlock =
  | { type: "paragraph"; text: string }
  | { type: "tip"; text: string }
  | { type: "warning"; text: string }
  | { type: "steps"; items: string[] }
  | { type: "keys"; items: { key: string; desc: string }[] }
  | { type: "stats"; items: { label: string; value: string; desc: string }[] }
  | { type: "heading"; text: string };

export const GUIDE_SECTIONS: GuideSection[] = [
  // ─── GETTING STARTED ───────────────────────────────────────────────────────
  {
    id: "welcome",
    title: "Welcome to Swift Type",
    emoji: "⚡",
    level: "all",
    tags: ["intro", "welcome", "overview", "about"],
    content: [
      {
        type: "paragraph",
        text: "Swift Type is a fast, adaptive typing trainer designed to help everyone — from total beginners to professional developers — type faster, more accurately, and with total confidence. No looking at the keys. No hunting and pecking. Just clean, effortless touch typing.",
      },
      {
        type: "paragraph",
        text: "The app learns your weak spots. Every keystroke you make (correct or wrong) feeds into an AI adaptive engine that identifies your slowest keys and most error-prone letter combinations (bigrams). Over time, your practice drills become hyper-focused on exactly what you need.",
      },
      {
        type: "stats",
        items: [
          { label: "Average beginner WPM", value: "20–35", desc: "Keys only" },
          { label: "Average professional WPM", value: "65–80", desc: "Touch typing" },
          { label: "Elite typists", value: "100+", desc: "With 98%+ accuracy" },
          { label: "Time to touch type", value: "3–6 weeks", desc: "Daily 15 min practice" },
        ],
      },
    ],
  },

  {
    id: "first-session",
    title: "Your First Typing Session",
    emoji: "🚀",
    level: "beginner",
    tags: ["start", "first time", "beginner", "how to", "session", "getting started"],
    content: [
      {
        type: "heading",
        text: "Starting a session in 3 steps",
      },
      {
        type: "steps",
        items: [
          "Open Swift Type — the keyboard and typing area are front and center.",
          "Press Enter on your keyboard (or click the ▶ Play button) to begin.",
          "Start typing the words you see. Don't look at your hands!",
        ],
      },
      {
        type: "tip",
        text: "Look at the orange glow on the keyboard — it shows you exactly which key to press next. Trust it. Don't look down at your physical keyboard.",
      },
      {
        type: "paragraph",
        text: "When you finish (either the timer runs out or you complete all words), your results appear: speed in WPM, accuracy percentage, total keystrokes, and a live chart showing your WPM over time. Every session is saved automatically to your history.",
      },
      {
        type: "warning",
        text: "Resist the urge to look down! Looking at your fingers might feel faster at first, but it prevents your brain from building the muscle memory that makes real speed possible.",
      },
    ],
  },

  // ─── KEYBOARD SHORTCUTS ─────────────────────────────────────────────────────
  {
    id: "shortcuts",
    title: "Keyboard Shortcuts",
    emoji: "⌨️",
    level: "all",
    tags: ["shortcuts", "keyboard", "keys", "hotkeys", "tab", "esc", "enter"],
    content: [
      {
        type: "paragraph",
        text: "Swift Type is designed to be fully controllable without touching the mouse. Learn these shortcuts and you'll move through sessions like a pro.",
      },
      {
        type: "keys",
        items: [
          { key: "Enter", desc: "Start a new typing session from the idle state" },
          { key: "Tab", desc: "Instantly reset and get a fresh set of words" },
          { key: "Esc", desc: "Stop the current session early and see results" },
          { key: "Backspace", desc: "Delete the last character you typed (during session)" },
        ],
      },
      {
        type: "tip",
        text: "Tab → Enter is the fastest way to restart a drill. Get a bad result? Tab to reset, Enter to go again. No mouse needed.",
      },
    ],
  },

  // ─── MODES ──────────────────────────────────────────────────────────────────
  {
    id: "modes",
    title: "Typing Modes Explained",
    emoji: "🎯",
    level: "all",
    tags: ["mode", "timed", "words", "curriculum", "practice modes"],
    content: [
      {
        type: "heading",
        text: "Timed Mode",
      },
      {
        type: "paragraph",
        text: "A countdown timer runs (15s, 30s, 60s, or 120s). Type as many words as you can before it hits zero. WPM is calculated at the end. Best for measuring raw speed and setting personal bests. This is the industry-standard mode used by keybr.com and monkeytype.",
      },
      {
        type: "heading",
        text: "Words Mode",
      },
      {
        type: "paragraph",
        text: "You get 30 words and need to type all of them. No timer pressure. The progress bar at the top shows how far along you are. Best for beginners who feel rushed by the timer or those practicing specific vocabulary.",
      },
      {
        type: "heading",
        text: "Curriculum Mode",
      },
      {
        type: "paragraph",
        text: "A structured lesson path that introduces the keyboard in logical stages. Starts with the Home Row (ASDF JKL;), then Top Row, then Bottom Row. Perfect for total beginners who have never touch-typed before.",
      },
      {
        type: "tip",
        text: "Use Curriculum Mode first if you're a beginner. Once you can complete Stage 1 without looking, switch to Words Mode, then graduate to Timed Mode.",
      },
    ],
  },

  // ─── LEVELS ─────────────────────────────────────────────────────────────────
  {
    id: "levels",
    title: "Difficulty Levels",
    emoji: "📊",
    level: "all",
    tags: ["level", "difficulty", "beginner", "intermediate", "advanced", "word list"],
    content: [
      {
        type: "paragraph",
        text: "Swift Type uses three word-list tiers. You can switch between them any time from the Level selector in the controls bar.",
      },
      {
        type: "steps",
        items: [
          "Beginner — Short, common 3–5 letter words. High frequency. Ideal for building basic rhythm and home-row positioning.",
          "Intermediate — Longer words, more variety. Mix of common and technical vocabulary. Great for most daily users.",
          "Advanced — Complex, multi-syllable words. Covers rare letter combos and programming-adjacent vocabulary. For typists chasing 80+ WPM.",
        ],
      },
      {
        type: "tip",
        text: "Don't rush levelling up. Master Beginner at 99% accuracy before moving to Intermediate. Clean technique at 30 WPM beats sloppy technique at 60 WPM.",
      },
    ],
  },

  // ─── ADAPTIVE AI ────────────────────────────────────────────────────────────
  {
    id: "adaptive",
    title: "The AI Adaptive Engine",
    emoji: "🧠",
    level: "intermediate",
    tags: ["adaptive", "AI", "bigram", "weak keys", "n-gram", "learning", "smart"],
    content: [
      {
        type: "paragraph",
        text: "Toggle the AI button in the controls bar to enable Adaptive Mode. When active, Swift Type doesn't give you random words — it generates a custom drill targeting your personal weak spots.",
      },
      {
        type: "heading",
        text: "How it works",
      },
      {
        type: "steps",
        items: [
          "Every keystroke you make is tracked: time taken, correct or wrong, which character it was.",
          "The engine calculates a 'struggle score' per key — weighting both your error rate (70%) and your reaction time (30%).",
          "It also tracks bigrams (2-letter pairs) like 'th', 'er', 'in'. Slow bigrams hurt your WPM more than slow single keys.",
          "Adaptive Mode then filters the word dictionary to prioritize words that contain your weakest keys and bigrams.",
        ],
      },
      {
        type: "tip",
        text: "Run at least 5 regular sessions before turning on Adaptive Mode. The engine needs enough data (3+ hits per key) to calculate meaningful scores.",
      },
      {
        type: "warning",
        text: "Adaptive Mode is disabled in Curriculum Mode. The curriculum has its own structured progression and the adaptive engine would work against it.",
      },
    ],
  },

  // ─── READING YOUR STATS ─────────────────────────────────────────────────────
  {
    id: "stats",
    title: "Understanding Your Stats",
    emoji: "📈",
    level: "beginner",
    tags: ["stats", "WPM", "accuracy", "errors", "speed", "score", "results"],
    content: [
      {
        type: "heading",
        text: "Words Per Minute (WPM)",
      },
      {
        type: "paragraph",
        text: "WPM is calculated as: (Total Keystrokes ÷ 5) ÷ Time in Minutes. Dividing by 5 converts keystrokes into 'words' (the standard is one word = 5 characters). Swift Type shows you both Raw WPM (every keystroke) and Net WPM (Raw minus an error penalty).",
      },
      {
        type: "heading",
        text: "Accuracy",
      },
      {
        type: "paragraph",
        text: "Accuracy = (Correct Keystrokes ÷ Total Keystrokes) × 100. At 95%+ you're in great shape. Below 90% means you're going too fast for your current skill level — slow down and focus on clean strokes.",
      },
      {
        type: "stats",
        items: [
          { label: "95–100%", value: "Excellent", desc: "Slow down only if WPM < target" },
          { label: "90–94%", value: "Good", desc: "Acceptable for learning phase" },
          { label: "80–89%", value: "Fair", desc: "Prioritize accuracy over speed" },
          { label: "< 80%", value: "Needs work", desc: "Significantly slow down" },
        ],
      },
      {
        type: "heading",
        text: "The WPM Chart",
      },
      {
        type: "paragraph",
        text: "After each session, a line chart shows your WPM second-by-second. The solid orange line is Net WPM, the dashed grey is Raw WPM. A big gap between them means lots of errors. A flat line means consistent pace — good! A climbing line at the end means you warmed up — expected.",
      },
    ],
  },

  // ─── PERFORMANCE HISTORY ────────────────────────────────────────────────────
  {
    id: "history",
    title: "Performance History & Stats Panel",
    emoji: "🗂️",
    level: "all",
    tags: ["history", "stats panel", "sessions", "progress", "track", "average"],
    content: [
      {
        type: "paragraph",
        text: "Click Stats in the top-right header to open the Performance Metrics panel. It slides in from the right and shows your lifetime averages alongside every session you've completed.",
      },
      {
        type: "steps",
        items: [
          "Lifetime Average WPM and Accuracy — calculated across all saved sessions.",
          "Session list — each card shows date, mode used, duration, WPM, and accuracy.",
          "Up to 200 sessions are stored locally in your browser (localStorage).",
          "Use Clear All History to reset and start fresh.",
        ],
      },
      {
        type: "tip",
        text: "Don't clear your history too often. The adaptive engine uses your per-key and bigram stats to improve its drills — clearing history wipes that learning data too.",
      },
    ],
  },

  // ─── FINGER PLACEMENT ───────────────────────────────────────────────────────
  {
    id: "finger-placement",
    title: "Proper Finger Placement",
    emoji: "🖐️",
    level: "beginner",
    tags: ["fingers", "hand position", "posture", "home row", "technique", "placement"],
    content: [
      {
        type: "paragraph",
        text: "The on-screen keyboard in Swift Type uses color coding to show which finger should press each key. This is the most important thing to get right as a beginner.",
      },
      {
        type: "keys",
        items: [
          { key: "🟢 Green (Pinky)", desc: "A, Q, Z, Tab, Caps, Shift (left) and P, ;, /, ', Enter, Backspace (right)" },
          { key: "🟡 Yellow (Ring)", desc: "S, W, X (left) and O, L, . (right)" },
          { key: "🟠 Orange (Middle)", desc: "D, E, C (left) and I, K, , (right)" },
          { key: "🔴 Red (Index)", desc: "F, G, R, T, V, B (left) and J, H, U, Y, M, N (right)" },
          { key: "🟣 Purple (Thumbs)", desc: "Spacebar — both thumbs, whichever is natural" },
        ],
      },
      {
        type: "heading",
        text: "Home Row Position",
      },
      {
        type: "paragraph",
        text: "Rest your fingers on ASDF (left hand) and JKL; (right hand). Feel the small bumps on F and J — those are your anchors. Every key you press, your fingers return to these home row positions. This is the foundation of touch typing.",
      },
      {
        type: "tip",
        text: "When practicing, watch the orange-highlighted key on Swift Type's on-screen keyboard. It shows exactly which finger to use. Don't think — just match finger to color.",
      },
    ],
  },

  // ─── INTERMEDIATE: IMPROVING SPEED ─────────────────────────────────────────
  {
    id: "improving-speed",
    title: "Breaking Through Speed Plateaus",
    emoji: "🏎️",
    level: "intermediate",
    tags: ["speed", "WPM", "plateau", "faster typing", "improve", "intermediate"],
    content: [
      {
        type: "paragraph",
        text: "You've reached 40–60 WPM and feel stuck? This is the most common plateau. Here's why it happens and exactly how to break through it.",
      },
      {
        type: "heading",
        text: "Why Plateaus Happen",
      },
      {
        type: "paragraph",
        text: "At this stage, your brain is still thinking letter-by-letter (or word-by-word). Advanced typists think in rhythm patterns and muscle memory clusters. The jump to 70+ WPM comes when you stop consciously thinking about individual keys.",
      },
      {
        type: "steps",
        items: [
          "Enable Adaptive AI Mode — it will drill your 3 weakest keys until they become automatic.",
          "Slow down to 80% of your max speed and type at 100% accuracy for 10 sessions. Accuracy training wires motor habits correctly.",
          "Focus on specific weak bigrams. Common ones: 'qu', 'ck', 'th', 'wh', 'br'. Use Words Mode and pay attention to your error pattern.",
          "Increase session length. Switch from 30s to 60s or 120s — endurance exposes weak spots that short sessions hide.",
          "Practice daily. Even 10 minutes a day beats 2 hours once a week.",
        ],
      },
      {
        type: "tip",
        text: "Look at your post-session chart. If your WPM dips in the middle and recovers at the end, you're losing focus mid-session — prime candidate for longer sessions.",
      },
    ],
  },

  // ─── ADVANCED: MASTERY ──────────────────────────────────────────────────────
  {
    id: "mastery",
    title: "Reaching 100+ WPM",
    emoji: "🏆",
    level: "advanced",
    tags: ["advanced", "100 WPM", "mastery", "expert", "elite", "top speed"],
    content: [
      {
        type: "paragraph",
        text: "At 80+ WPM with 96%+ accuracy, you're already faster than 99% of people. Pushing into triple digits is about eliminating outliers — the rare keys and combos that break your rhythm.",
      },
      {
        type: "heading",
        text: "The 100 WPM Mindset",
      },
      {
        type: "paragraph",
        text: "At this level, speed is no longer the bottleneck — rhythm is. Elite typists move in smooth, even streams. There are no fast letters and slow letters. Every keystroke takes the same time.",
      },
      {
        type: "steps",
        items: [
          "Use Adaptive AI Mode exclusively. Your weak keys are tiny — the engine will find them.",
          "Switch to Advanced level to introduce complex vocabulary and coding-adjacent words.",
          "Run 120-second Timed sessions. Endurance at this level matters — fatigue causes rhythm breaks.",
          "Examine bigrams in your history panel. Look for any stats where keys take >400ms on average.",
          "Consider switching to a mechanical keyboard if typing on a membrane — the tactile feedback measurably improves speed for competitive typists.",
        ],
      },
      {
        type: "stats",
        items: [
          { label: "60–80 WPM", value: "Proficient", desc: "Standard professional level" },
          { label: "80–100 WPM", value: "Fast", desc: "Top 10% of typists" },
          { label: "100–120 WPM", value: "Elite", desc: "Top 1%" },
          { label: "120+ WPM", value: "Exceptional", desc: "Competitive typist territory" },
        ],
      },
      {
        type: "tip",
        text: "Don't chase raw WPM. Chase net WPM. A 110 WPM / 94% accuracy typist types slower in real work than a 90 WPM / 99% accuracy typist — errors require deletion and correction.",
      },
    ],
  },

  // ─── DARK MODE ──────────────────────────────────────────────────────────────
  {
    id: "dark-mode",
    title: "Dark Mode & Themes",
    emoji: "🌙",
    level: "all",
    tags: ["dark mode", "theme", "light mode", "appearance"],
    content: [
      {
        type: "paragraph",
        text: "Click the Dark / Light button in the top-right corner of the header to toggle between themes. Your preference is saved automatically and will persist the next time you open Swift Type — even after a page refresh.",
      },
      {
        type: "tip",
        text: "Many typists prefer dark mode for extended practice sessions. It significantly reduces eye strain during long drills.",
      },
    ],
  },

  // ─── PWA ────────────────────────────────────────────────────────────────────
  {
    id: "pwa",
    title: "Install Swift Type as an App",
    emoji: "📲",
    level: "all",
    tags: ["install", "PWA", "app", "offline", "desktop", "shortcut"],
    content: [
      {
        type: "paragraph",
        text: "Swift Type is a Progressive Web App (PWA). This means you can install it directly on your device and open it like a native app — no App Store needed.",
      },
      {
        type: "heading",
        text: "How to Install (Chrome / Edge)",
      },
      {
        type: "steps",
        items: [
          "Open Swift Type in Chrome or Edge browser.",
          "Look for the ⊕ install icon in the address bar (right side) — click it.",
          "Click 'Install' in the prompt that appears.",
          "Swift Type will now appear on your taskbar / desktop as a standalone app.",
        ],
      },
      {
        type: "heading",
        text: "How to Install (iPhone / iPad Safari)",
      },
      {
        type: "steps",
        items: [
          "Open Swift Type in Safari.",
          "Tap the Share button (box with arrow pointing up).",
          "Scroll down and tap 'Add to Home Screen'.",
          "Tap Add — the app appears on your home screen.",
        ],
      },
      {
        type: "tip",
        text: "Once installed, Swift Type caches its assets for offline use. Practice even without internet!",
      },
    ],
  },

  // ─── TIPS & BEST PRACTICE ───────────────────────────────────────────────────
  {
    id: "tips",
    title: "Top Tips for Faster Progress",
    emoji: "💡",
    level: "all",
    tags: ["tips", "advice", "tricks", "best practice", "habits"],
    content: [
      {
        type: "steps",
        items: [
          "Practice daily — 15 minutes every day beats 2 hours on weekends. Muscle memory builds through repetition, not marathon sessions.",
          "Never look down. Even when you make a mistake. Glancing at your hands resets the training benefit.",
          "Type at 90–95% of your max speed to build accuracy. Speed will come naturally as accuracy becomes automatic.",
          "Use Curriculum Mode to fix specific weaknesses. If your 'P' or 'Z' key is always an error, go back to structured drills.",
          "Warm up with easier words first. Start at Beginner level, do 1–2 sessions, then switch to your target level.",
          "Rest. Fingers and forearms get fatigued. If you notice accuracy dropping sharply, take a 10-minute break.",
          "Check your WPM chart after every session. A consistent downward trend in the second half means fatigue. Shorten sessions.",
        ],
      },
    ],
  },
];

// Flat searchable index for the search feature
export const SEARCH_INDEX = GUIDE_SECTIONS.flatMap((section) => {
  const textBlocks = section.content
    .map((block) => {
      if (block.type === "paragraph") return block.text;
      if (block.type === "tip") return block.text;
      if (block.type === "warning") return block.text;
      if (block.type === "heading") return block.text;
      if (block.type === "steps") return block.items.join(" ");
      if (block.type === "keys") return block.items.map((k) => k.desc).join(" ");
      if (block.type === "stats") return block.items.map((s) => s.label + " " + s.desc).join(" ");
      return "";
    })
    .join(" ");

  return [
    {
      sectionId: section.id,
      title: section.title,
      emoji: section.emoji,
      level: section.level,
      body: textBlocks,
      tags: section.tags.join(" "),
      searchText: `${section.title} ${section.tags.join(" ")} ${textBlocks}`.toLowerCase(),
    },
  ];
});
