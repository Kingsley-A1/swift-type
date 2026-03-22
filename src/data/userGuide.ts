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
          {
            label: "Average professional WPM",
            value: "65–80",
            desc: "Touch typing",
          },
          { label: "Elite typists", value: "100+", desc: "With 98%+ accuracy" },
          {
            label: "Time to touch type",
            value: "3–6 weeks",
            desc: "Daily 15 min practice",
          },
        ],
      },
    ],
  },

  {
    id: "first-session",
    title: "Your First Typing Session",
    emoji: "🚀",
    level: "beginner",
    tags: [
      "start",
      "first time",
      "beginner",
      "how to",
      "session",
      "getting started",
    ],
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
          {
            key: "Enter",
            desc: "Start a new typing session from the idle state",
          },
          { key: "Tab", desc: "Instantly reset and get a fresh set of words" },
          {
            key: "Esc",
            desc: "Stop the current session early and see results",
          },
          {
            key: "Backspace",
            desc: "Delete the last character you typed (during session)",
          },
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
    tags: [
      "level",
      "difficulty",
      "beginner",
      "intermediate",
      "advanced",
      "word list",
    ],
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
    tags: [
      "adaptive",
      "AI",
      "bigram",
      "weak keys",
      "n-gram",
      "learning",
      "smart",
    ],
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
          {
            label: "95–100%",
            value: "Excellent",
            desc: "Slow down only if WPM < target",
          },
          {
            label: "90–94%",
            value: "Good",
            desc: "Acceptable for learning phase",
          },
          {
            label: "80–89%",
            value: "Fair",
            desc: "Prioritize accuracy over speed",
          },
          {
            label: "< 80%",
            value: "Needs work",
            desc: "Significantly slow down",
          },
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
    tags: [
      "history",
      "stats panel",
      "sessions",
      "progress",
      "track",
      "average",
    ],
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
    tags: [
      "fingers",
      "hand position",
      "posture",
      "home row",
      "technique",
      "placement",
    ],
    content: [
      {
        type: "paragraph",
        text: "The on-screen keyboard in Swift Type uses color coding to show which finger should press each key. This is the most important thing to get right as a beginner.",
      },
      {
        type: "keys",
        items: [
          {
            key: "🟢 Green (Pinky)",
            desc: "A, Q, Z, Tab, Caps, Shift (left) and P, ;, /, ', Enter, Backspace (right)",
          },
          {
            key: "🟡 Yellow (Ring)",
            desc: "S, W, X (left) and O, L, . (right)",
          },
          {
            key: "🟠 Orange (Middle)",
            desc: "D, E, C (left) and I, K, , (right)",
          },
          {
            key: "🔴 Red (Index)",
            desc: "F, G, R, T, V, B (left) and J, H, U, Y, M, N (right)",
          },
          {
            key: "🟣 Purple (Thumbs)",
            desc: "Spacebar — both thumbs, whichever is natural",
          },
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
    tags: [
      "speed",
      "WPM",
      "plateau",
      "faster typing",
      "improve",
      "intermediate",
    ],
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
          {
            label: "60–80 WPM",
            value: "Proficient",
            desc: "Standard professional level",
          },
          { label: "80–100 WPM", value: "Fast", desc: "Top 10% of typists" },
          { label: "100–120 WPM", value: "Elite", desc: "Top 1%" },
          {
            label: "120+ WPM",
            value: "Exceptional",
            desc: "Competitive typist territory",
          },
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

  // ─── SWIFT AI COACH ────────────────────────────────────────────────────────
  {
    id: "swift-ai",
    title: "Swift AI Coach",
    emoji: "🤖",
    level: "all",
    tags: [
      "ai",
      "coach",
      "swift ai",
      "chat",
      "artificial intelligence",
      "help",
      "advice",
    ],
    content: [
      {
        type: "paragraph",
        text: "Swift AI is your personal typing coach — powered by Gemini 2.5 Flash. It understands your session history, current skill level, and weak spots, then gives you personalised advice, drills, and answers in real time. Think of it as a world-class typing instructor who is always available and never judges your WPM.",
      },
      {
        type: "heading",
        text: "What Swift AI can do",
      },
      {
        type: "steps",
        items: [
          "Analyse your recent WPM and accuracy trends and explain what is holding you back.",
          "Suggest targeted finger drills for your slowest keys and most error-prone bigrams.",
          "Explain proper hand posture, finger placement, and ergonomic setup.",
          "Answer any question about the app, settings, or typing technique in plain language.",
          "Generate custom word lists or practice sentences for specific problem keys.",
          "Motivate and pace you through a training plan suited to your improvement goals.",
        ],
      },
      {
        type: "tip",
        text: "Click the 'Ask Swift' button in the header (or the Docs panel) to open the Swift AI chat. Sign-in is required — your session data is used to personalise responses.",
      },
      {
        type: "heading",
        text: "How to get the most out of Swift AI",
      },
      {
        type: "steps",
        items: [
          "Complete at least 3–5 sessions so Swift AI has enough data to make meaningful observations.",
          "Be specific: instead of 'help me type faster', try 'my accuracy drops on the right hand — why?'",
          "Ask for drills: 'Give me a 30-second drill focusing on P, semicolon, and apostrophe.'",
          "Ask for explanations: 'What is a bigram and why does it matter?'",
          "Use the conversation history — Swift AI remembers your previous messages in the session.",
        ],
      },
      {
        type: "warning",
        text: "Swift AI requires an account. Sign in with email and password or continue with GitHub to unlock full AI coaching. Google sign-in is being prepared for a later rollout. Your chat conversations are private and never shared publicly.",
      },
      {
        type: "stats",
        items: [
          {
            label: "AI model",
            value: "Gemini 2.5",
            desc: "Flash — fast & accurate",
          },
          { label: "Response time", value: "<2s", desc: "Real-time streaming" },
          {
            label: "Context window",
            value: "Session + history",
            desc: "Personalised advice",
          },
          { label: "Privacy", value: "GDPR ready", desc: "No data sold" },
        ],
      },
    ],
  },

  // ─── ACCOUNT & CLOUD SYNC ──────────────────────────────────────────────────
  {
    id: "account",
    title: "Account & Cloud Sync",
    emoji: "☁️",
    level: "beginner",
    tags: [
      "account",
      "cloud",
      "sync",
      "save",
      "history",
      "data",
      "profile",
      "sign in",
    ],
    content: [
      {
        type: "paragraph",
        text: "Creating a free Swift Type account unlocks cloud session sync, full history tracking, Swift AI coaching, and a persistent profile that follows you across devices. You can create an account with email and password or sign in with GitHub.",
      },
      {
        type: "heading",
        text: "Account benefits at a glance",
      },
      {
        type: "stats",
        items: [
          {
            label: "Session history",
            value: "All sessions",
            desc: "Stored in the cloud",
          },
          {
            label: "Swift AI",
            value: "Full access",
            desc: "AI coaching included",
          },
          {
            label: "Cross-device",
            value: "Any browser",
            desc: "Your data follows you",
          },
          { label: "Cost", value: "Free", desc: "Always" },
        ],
      },
      {
        type: "heading",
        text: "Signing in",
      },
      {
        type: "steps",
        items: [
          "Click 'Sign In' in the top-right header.",
          "Choose email and password for the simple native sign-in flow, or continue with GitHub.",
          "If you are new, switch to 'Create Account' and complete email plus password in the same modal.",
          "After sign-in, Swift Type restores your account features immediately.",
          "Your previous guest sessions are automatically promoted to your account.",
        ],
      },
      {
        type: "tip",
        text: "You can practice without an account — sessions are stored locally in your browser. Sign in any time and your local history is automatically synced to the cloud.",
      },
      {
        type: "heading",
        text: "Your profile",
      },
      {
        type: "paragraph",
        text: "Click your avatar in the top-right corner to open your profile panel. It shows your best WPM, average WPM, and accuracy across all sessions — and lets you jump straight to Swift AI coaching or your full stats history.",
      },
    ],
  },

  // ─── PRIVACY & DATA ────────────────────────────────────────────────────────
  {
    id: "privacy",
    title: "Privacy & Data",
    emoji: "🔒",
    level: "all",
    tags: [
      "privacy",
      "data",
      "security",
      "gdpr",
      "ccpa",
      "policy",
      "storage",
      "delete",
    ],
    content: [
      {
        type: "paragraph",
        text: "Swift Type is built with privacy-first principles. Your data is used only to improve your typing experience — it is never sold, rented, or shared with advertisers.",
      },
      {
        type: "heading",
        text: "What we collect",
      },
      {
        type: "steps",
        items: [
          "Typing session data: WPM, accuracy, keystroke timing, and character error maps.",
          "Account information such as email address and profile details from the sign-in method you use, including GitHub when selected.",
          "Chat messages sent to Swift AI (processed by Google Gemini, not stored permanently).",
          "Browser theme preference (stored locally, never sent to the server).",
        ],
      },
      {
        type: "heading",
        text: "What we do NOT collect",
      },
      {
        type: "steps",
        items: [
          "The actual text you type during practice sessions.",
          "Plain-text passwords — passwords from the native sign-in flow should be stored only as secure hashes.",
          "Third-party tracking cookies or ad network identifiers.",
          "Any data from users who are not signed in.",
        ],
      },
      {
        type: "tip",
        text: "View the full Privacy Policy anytime — click the shield icon (🛡) in the header, or ask Swift AI: 'What is your privacy policy?'",
      },
      {
        type: "heading",
        text: "Your rights",
      },
      {
        type: "paragraph",
        text: "You may request a copy of all data we hold, request deletion of your account and all associated data, or opt out of AI-enhanced processing at any time. Send requests to privacy@swifttype.app.",
      },
    ],
  },

  // ─── GOALS & STREAKS ───────────────────────────────────────────────────────
  {
    id: "goals-and-streaks",
    title: "Goals & Streaks",
    emoji: "🎯",
    level: "all",
    tags: [
      "goals",
      "streaks",
      "rewards",
      "target",
      "progress",
      "daily",
      "weekly",
      "habit",
    ],
    content: [
      {
        type: "paragraph",
        text: "Goals give your practice a clear direction. Swift Type lets you set daily and weekly targets, tracks every session automatically, and shows exactly how close you are to hitting them.",
      },
      {
        type: "heading",
        text: "Creating a Goal",
      },
      {
        type: "steps",
        items: [
          "Click the Target icon (🎯) in the left sidebar to open the Goals panel.",
          "Choose Daily or Weekly using the toggle at the top of the Create Goal section.",
          "Click a template that matches your focus — speed, accuracy, consistency, or time.",
          "Customise the goal name, target value, and required sessions in the inline form.",
          "Click Create Goal. Your progress starts tracking immediately.",
        ],
      },
      {
        type: "heading",
        text: "Goal Types",
      },
      {
        type: "keys",
        items: [
          {
            key: "Sessions",
            desc: "Complete a fixed number of typing sessions. Best for building a daily habit.",
          },
          {
            key: "Accuracy",
            desc: "Maintain a target accuracy percentage across a set number of sessions (e.g. 95% over 3 runs).",
          },
          {
            key: "Time",
            desc: "Accumulate a total amount of practice time during the period (e.g. 15 minutes this week).",
          },
          {
            key: "Speed",
            desc: "Hit or exceed a specific WPM target (e.g. 45 WPM) in at least one qualifying session.",
          },
        ],
      },
      {
        type: "tip",
        text: "Required Sessions sets the minimum number of sessions that must run before the goal can be counted as complete. Raising it ensures the result is consistent, not a one-off fluke.",
      },
      {
        type: "heading",
        text: "Tracking Progress",
      },
      {
        type: "paragraph",
        text: "Each time you finish a session, Swift Type checks all active goals and updates them automatically. The Goals panel shows a live progress bar, how far you've come, and when the goal window closes.",
      },
      {
        type: "paragraph",
        text: "A compact progress indicator is also visible in the sidebar next to the Goals icon. On mobile, the GoalProgressChip beneath the controls shows the same at a glance.",
      },
      {
        type: "heading",
        text: "Streaks",
      },
      {
        type: "paragraph",
        text: "Every time you complete a goal, your streak grows by one. If a day ends without a completed daily goal, the streak resets. Your best-ever streak is always preserved as a personal record.",
      },
      {
        type: "tip",
        text: "Your active streak count is shown in the top header as a flame pill so it stays visible during every session. You can view current and best streak in the Goals panel.",
      },
      {
        type: "heading",
        text: "Rewards",
      },
      {
        type: "paragraph",
        text: "Completing goals and reaching milestones unlocks reward badges. Streak milestones, WPM records, and consistency goals each award different badges. Open the Rewards panel from the sidebar to browse your full collection.",
      },
      {
        type: "tip",
        text: "Swift AI has full visibility into your active goals. Ask it things like 'Am I on track for my weekly goal?' or 'What should I practise to hit 60 WPM this week?' for personalised recommendations.",
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
      if (block.type === "keys")
        return block.items.map((k) => k.desc).join(" ");
      if (block.type === "stats")
        return block.items.map((s) => s.label + " " + s.desc).join(" ");
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
      searchText:
        `${section.title} ${section.tags.join(" ")} ${textBlocks}`.toLowerCase(),
    },
  ];
});
