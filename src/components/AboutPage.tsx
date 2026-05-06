"use client";

import { Info, Target, Zap, BookOpen, Clock, Code, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

function AboutSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.FC<{ size: number; className?: string }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="pb-6 border-b border-gray-100 dark:border-white/8 last:border-b-0">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-brand-orange/10 border border-brand-orange/20 shrink-0">
          <Icon size={13} className="text-brand-orange" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>
      <div className="space-y-2.5 pl-1">{children}</div>
    </div>
  );
}

function AboutP({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
      {children}
    </p>
  );
}

function AboutBullet({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5 items-start">
      <ArrowRight size={12} className="text-brand-orange shrink-0 mt-1.5" />
      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
        {children}
      </p>
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-brand-dark sm:rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-black/20">
        <div className="flex items-center gap-3 mt-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #fa4c0c, #ff8c5a)",
            }}
          >
            <Info size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white leading-none">
              About Swift Type
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Master Your Keyboard
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-brand-orange hover:bg-brand-orange/10 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to App</span>
        </Link>
      </div>

      {/* Body */}
      <div className="p-6 sm:p-8 space-y-8">
        <AboutSection icon={Zap} title="The Next-Gen Typing Platform">
          <AboutP>
            Swift Type is the next-gen platform for professionals and learners to achieve peak typing performance. We combine advanced analytics with a beautiful, distraction-free environment.
          </AboutP>
          <AboutP>
            <strong>Our Mission:</strong> To empower individuals to communicate at the speed of thought. By removing the friction between your mind and the screen, we unlock new levels of productivity and creativity for everyone.
          </AboutP>
          <AboutP>
            <strong>Our Vision:</strong> To build the definitive ecosystem for typing mastery—where adaptive learning, community competition through Swift Rank, and AI-driven coaching converge to create the ultimate training experience.
          </AboutP>
        </AboutSection>

        <AboutSection icon={Target} title="Goals and Streaks">
          <AboutP>
            Consistency is the key to mastery. Swift Type provides a built-in goal system to keep you motivated and accountable.
          </AboutP>
          <AboutBullet>
            <strong>Daily & Weekly Goals:</strong> Set a target duration (e.g., 15 minutes a day) and let us track your progress. Hitting your goals unlocks rewards and achievements.
          </AboutBullet>
          <AboutBullet>
            <strong>Streaks:</strong> Keep coming back every day to build your streak. A higher streak unlocks achievements and boosts your standing within the Swift Type community.
          </AboutBullet>
        </AboutSection>

        <AboutSection icon={Clock} title="History and Analytics">
          <AboutP>
            Understanding your typing patterns is crucial for improvement. We track every keystroke so you don't have to guess where you need work.
          </AboutP>
          <AboutBullet>
            <strong>Detailed History:</strong> View past sessions to see how your speed (WPM) and accuracy have improved over time, allowing you to celebrate your long-term progress.
          </AboutBullet>
          <AboutBullet>
            <strong>Adaptive Learning:</strong> The engine analyzes your historical weaknesses (slow keys, N-grams) and dynamically adjusts practice text to target those exact areas.
          </AboutBullet>
        </AboutSection>

        <AboutSection icon={BookOpen} title="Documentation">
          <AboutP>
            Swift Type is packed with advanced features. To get the most out of the platform, we recommend checking out our documentation.
          </AboutP>
          <AboutBullet>
            Learn about the <strong>Swift AI Coach</strong> and how it provides actionable, real-time feedback to correct bad habits.
          </AboutBullet>
          <AboutBullet>
            Understand the <strong>Swift Rank</strong> leaderboard algorithm, including our ELO-inspired rating system, and how to climb from Rookie to Platinum tier.
          </AboutBullet>
          <AboutBullet>
            Discover keyboard shortcuts to quickly restart, stop, or navigate between tests without your hands ever leaving the keyboard.
          </AboutBullet>
        </AboutSection>

        <AboutSection icon={Code} title="Built by King Tech Foundation">
          <AboutP>
            Swift Type is proudly developed and maintained by Kingsley and the King Tech Foundation. We are dedicated to building premium, high-performance software that elevates human potential.
          </AboutP>
          <div className="mt-4">
            <a
              href="https://kingtech.com.ng"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white text-sm font-semibold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
            >
              Visit King Tech Foundation <ArrowRight size={14} />
            </a>
          </div>
        </AboutSection>
      </div>
    </div>
  );
}
