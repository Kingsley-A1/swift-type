import { Shield, Lock, Eye, Database, Server, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

function PolicySection({
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

function PolicyP({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
      {children}
    </p>
  );
}

function PolicyBullet({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5 items-start">
      <ArrowRight size={12} className="text-brand-orange shrink-0 mt-1.5" />
      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
        {children}
      </p>
    </div>
  );
}

export function PrivacyPolicy() {
  return (
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-brand-dark sm:rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-black/20">
        <div className="flex items-center gap-3 mt-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #ff6b35, #ff8c5a)",
            }}
          >
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white leading-none">
              Privacy Policy
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Effective March 2026
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
        <PolicySection icon={Lock} title="What We Collect">
          <PolicyP>
            Swift Type collects only the minimum data required to deliver
            the service. Here is exactly what we collect and why:
          </PolicyP>
          <PolicyBullet>
            <strong>Account identity</strong> — Your name and email
            address. If you sign in with GitHub, a profile image from
            GitHub may also be collected. Used to create and identify your
            account.
          </PolicyBullet>
          <PolicyBullet>
            <strong>Typing session data</strong> — WPM, accuracy,
            duration, mode, and keystroke-level statistics. Powers the
            adaptive engine and coaching insights.
          </PolicyBullet>
          <PolicyBullet>
            <strong>Swift AI conversations</strong> — Your chat messages
            with Swift AI are stored on Cloudflare R2 (encrypted object
            storage). Used for conversation history and coaching
            continuity.
          </PolicyBullet>
          <PolicyBullet>
            <strong>Technical metadata</strong> — Standard server logs
            (request timestamps, error traces). Not linked to your
            profile. Retained for 30 days maximum.
          </PolicyBullet>
        </PolicySection>

        <PolicySection icon={Eye} title="How Swift AI Uses Your Data">
          <PolicyP>
            When you send a message to Swift AI, here is exactly what
            happens:
          </PolicyP>
          <PolicyBullet>
            Your recent typing performance (WPM, accuracy, weak keys,
            session history) is packaged into the AI&apos;s context. This
            data never leaves our infrastructure independently.
          </PolicyBullet>
          <PolicyBullet>
            The full context (your typing stats + your message) is sent to
            the <strong>Google Gemini API</strong> under our API key.
            Google processes it to generate a coaching response. Data
            handling is governed by Google&apos;s Gemini API Data Usage
            Policies.
          </PolicyBullet>
          <PolicyBullet>
            The AI response is streamed back and stored in your chat
            transcript on Cloudflare R2. Only you (via authenticated
            session) can access your transcripts.
          </PolicyBullet>
          <PolicyBullet>
            We do <strong>not</strong> use your AI conversations to train
            any models. We do <strong>not</strong> share your
            conversations with other users or third parties.
          </PolicyBullet>
        </PolicySection>

        <PolicySection icon={Database} title="Data Storage & Security">
          <PolicyBullet>
            <strong>Database</strong> — Account data and session
            statistics stored in PostgreSQL on <strong>Neon</strong>{" "}
            (serverless Postgres). Encrypted at rest and in transit using
            TLS 1.3.
          </PolicyBullet>
          <PolicyBullet>
            <strong>AI chat transcripts</strong> — Stored on{" "}
            <strong>Cloudflare R2</strong>. Access requires a valid
            authenticated session token. No public URLs are generated.
          </PolicyBullet>
          <PolicyBullet>
            <strong>Session tokens</strong> — JWT tokens stored as
            HTTP-only, Secure, SameSite=Lax cookies. Cryptographically
            signed and expire after 30 days.
          </PolicyBullet>
          <PolicyBullet>
            <strong>Password security</strong> — If you sign in with email
            and password, your password is stored only as a bcrypt hash —
            plain-text passwords are never stored or transmitted. If you
            sign in with GitHub, we receive only an OAuth access token and
            basic profile info.
          </PolicyBullet>
        </PolicySection>

        <PolicySection icon={Server} title="Third-Party Services">
          <PolicyP>
            Swift Type uses the following third-party services to operate:
          </PolicyP>
          <PolicyBullet>
            <strong>Google Gemini AI</strong> — AI coaching responses.
            Subject to Google&apos;s Gemini API Data Usage Policies.
            (Google sign-in is coming soon.)
          </PolicyBullet>
          <PolicyBullet>
            <strong>GitHub OAuth</strong> — Identity verification for
            GitHub sign-in. Subject to GitHub&apos;s Privacy Policy.
          </PolicyBullet>
          <PolicyBullet>
            <strong>Neon</strong> — PostgreSQL hosting. EU/US data
            centers. SOC 2 Type II compliant.
          </PolicyBullet>
          <PolicyBullet>
            <strong>Cloudflare R2</strong> — Object storage for AI
            transcripts. Data is not scanned or indexed by Cloudflare for
            advertising.
          </PolicyBullet>
          <PolicyBullet>
            <strong>Vercel</strong> — Application hosting and CDN.
            Processes request metadata per their privacy policy.
          </PolicyBullet>
        </PolicySection>

        <PolicySection icon={Shield} title="Your Rights & Data Control">
          <PolicyBullet>
            <strong>Data deletion</strong> — You may request deletion of
            your account and all associated data (typing history, AI
            transcripts) at any time. We process requests within 30 days.
          </PolicyBullet>
          <PolicyBullet>
            <strong>Data export</strong> — You may request an export of
            your typing history and AI conversation transcripts in
            machine-readable format.
          </PolicyBullet>
          <PolicyBullet>
            <strong>Optional AI usage</strong> — Swift AI is entirely
            optional. Full typing practice is available without signing in
            or using the AI coach.
          </PolicyBullet>
          <PolicyBullet>
            <strong>GDPR / CCPA</strong> — EU and California residents
            have rights to access, rectify, erase, and restrict processing
            of their personal data.
          </PolicyBullet>
        </PolicySection>

        <div className="pt-4 pb-2 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">
            Last updated <strong>March 2026</strong>. Questions or data requests:{" "}
            <span className="text-brand-orange font-medium">
              privacy@swifttype.app
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
