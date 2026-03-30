import { FileText, UserCheck, Activity, CreditCard, Scale, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

function TermsSection({
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

function TermsP({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
      {children}
    </p>
  );
}

function TermsBullet({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5 items-start">
      <ArrowRight size={12} className="text-brand-orange shrink-0 mt-1.5" />
      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
        {children}
      </p>
    </div>
  );
}

export function TermsOfService() {
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
            <FileText size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white leading-none">
              Terms of Service
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
        <TermsSection icon={UserCheck} title="Service Provided">
          <TermsP>
            Welcome to Swift Type. By accessing or using our platform, you agree to these Terms of Service. Swift Type provides typing practice software, analytical tools, and an AI-powered coach.
          </TermsP>
          <TermsBullet>
            We grant you a personal, non-exclusive, non-transferable, and revocable license to use our Service.
          </TermsBullet>
          <TermsBullet>
            You must be at least 13 years old to create an account.
          </TermsBullet>
          <TermsBullet>
            We reserve the right to modify or discontinue the Service at any time without prior notice.
          </TermsBullet>
        </TermsSection>

        <TermsSection icon={Activity} title="User Responsibilities">
          <TermsP>
            As a user of Swift Type, you agree to interact with the platform and others responsibly.
          </TermsP>
          <TermsBullet>
            You will not use automated scripts, bots, or any method to artificially inflate your typing scores or manipulate the leaderboards.
          </TermsBullet>
          <TermsBullet>
            You are responsible for maintaining the security of your account and password.
          </TermsBullet>
          <TermsBullet>
            When interacting with the AI coach, you agree not to submit abusive, illegal, or harmful content. We reserve the right to suspend accounts that abuse the AI integration.
          </TermsBullet>
        </TermsSection>

        <TermsSection icon={Scale} title="Intellectual Property">
          <TermsP>
            All original content on Swift Type is protected by intellectual property laws.
          </TermsP>
          <TermsBullet>
            The software, UI/UX design, logos, and proprietary algorithms are owned by Swift Type and our licensors.
          </TermsBullet>
          <TermsBullet>
            You retain ownership of any feedback, suggestions, or data you generate, but grant us a license to use this data to improve the Service (subject to our Privacy Policy).
          </TermsBullet>
          <TermsBullet>
            Do not copy, reverse engineer, or distribute our source code or assets without explicit permission.
          </TermsBullet>
        </TermsSection>

        <TermsSection icon={CreditCard} title="Accounts and Termination">
          <TermsBullet>
            You may terminate your account at any time by contacting us. Upon termination, your right to use the Service will immediately cease.
          </TermsBullet>
          <TermsBullet>
            We may terminate or suspend your account immediately, without prior notice or liability, for any breach of these Terms.
          </TermsBullet>
          <TermsBullet>
            In the event of termination, any stored progress or statistics may be permanently deleted.
          </TermsBullet>
        </TermsSection>

        <div className="pt-4 pb-2 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">
            Last updated <strong>March 2026</strong>. For questions or concerns:{" "}
            <span className="text-brand-orange font-medium">
              legal@swifttype.app
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
