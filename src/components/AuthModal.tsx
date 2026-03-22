"use client";

import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to register");
        }
      }

      const response = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (response?.error) {
        throw new Error("Invalid email or password");
      }

      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-60 bg-[rgba(9,11,18,0.58)] backdrop-blur-2xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-0 z-61 flex items-center justify-center p-4"
          >
            <div
              className="relative w-full max-w-md overflow-y-auto rounded-3xl"
              style={{
                maxHeight: "calc(100dvh - 2rem)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(250,250,252,0.94))",
                border: "1px solid rgba(255,255,255,0.78)",
                backdropFilter: "blur(28px) saturate(180%)",
                boxShadow:
                  "0 30px 80px rgba(15, 23, 42, 0.16), 0 10px 24px rgba(15, 23, 42, 0.08)",
              }}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-24"
                style={{
                  background:
                    "radial-gradient(circle at top, rgba(255,107,53,0.16), transparent 68%)",
                }}
              />
              <div className="pointer-events-none absolute -right-10 top-10 h-28 w-28 rounded-full bg-brand-orange/10 blur-3xl" />
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/80" />

              <div className="relative p-5 sm:p-6">
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Close authentication modal"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>

                <div className="mb-4 flex items-start justify-between gap-4 pr-10">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/90 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.08)]">
                      <Image
                        src="/logo-192.png"
                        alt="SwiftType"
                        width={38}
                        height={38}
                      />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-orange/80">
                        Swift Type Account
                      </p>
                      <h2 className="mt-1 text-[24px] font-semibold tracking-tight text-gray-900">
                        {mode === "signin"
                          ? "Welcome back"
                          : "Create your account"}
                      </h2>
                      <p className="mt-1 max-w-72 text-[13px] leading-relaxed text-gray-500">
                        Save progress, unlock Swift AI, and keep your training
                        synced across sessions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl border border-gray-200/80 bg-white/70 p-2 text-[11px] font-semibold text-gray-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <div className="rounded-xl bg-gray-50 px-3 py-2 text-center text-gray-700">
                    Cloud Sync
                  </div>
                  <div className="rounded-xl bg-gray-50 px-3 py-2 text-center text-gray-700">
                    Swift AI
                  </div>
                  <div className="rounded-xl bg-gray-50 px-3 py-2 text-center text-gray-700">
                    Rewards
                  </div>
                </div>

                <div className="mb-4 rounded-2xl border border-gray-200/80 bg-white/72 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signin");
                        setError(null);
                      }}
                      className={[
                        "rounded-xl px-3 py-2 text-sm font-semibold transition-all",
                        mode === "signin"
                          ? "bg-gray-900 text-white shadow-sm"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                      ].join(" ")}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signup");
                        setError(null);
                      }}
                      className={[
                        "rounded-xl px-3 py-2 text-sm font-semibold transition-all",
                        mode === "signup"
                          ? "bg-gray-900 text-white shadow-sm"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                      ].join(" ")}
                    >
                      Create Account
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  {error && (
                    <div className="rounded-2xl border border-red-500/15 bg-red-50/90 px-3 py-2.5 text-center text-[13px] font-medium text-red-600">
                      {error}
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full rounded-2xl border border-gray-200/90 bg-white px-3.5 py-3 text-[14px] text-gray-900 shadow-sm placeholder:text-gray-400 transition-all focus:border-brand-orange focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/15"
                      required
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        mode === "signin" ? "Password" : "Create password"
                      }
                      className="w-full rounded-2xl border border-gray-200/90 bg-white px-3.5 py-3 text-[14px] text-gray-900 shadow-sm placeholder:text-gray-400 transition-all focus:border-brand-orange focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/15"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(17,24,39,0.18)] transition-all hover:bg-gray-800 active:scale-[0.99] disabled:opacity-70"
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin opacity-70" />
                    ) : mode === "signin" ? (
                      "Sign In"
                    ) : (
                      "Create Account"
                    )}
                  </button>

                  <div className="flex items-center justify-between gap-3 px-1 text-[12px] font-medium text-gray-500">
                    <span>
                      {mode === "signin"
                        ? "Use your email and password to access saved progress."
                        : "Create an account in one step, then you are signed in automatically."}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMode(mode === "signin" ? "signup" : "signin");
                        setError(null);
                      }}
                      className="shrink-0 font-semibold text-gray-900 transition-colors hover:text-brand-orange focus:outline-none"
                    >
                      {mode === "signin"
                        ? "Need an account?"
                        : "Have one already?"}
                    </button>
                  </div>
                </form>

                <div className="relative my-4 flex items-center justify-center">
                  <div className="w-full border-t border-gray-200" />
                  <div className="absolute bg-[#fbfbfc] px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                    or continue with
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  <button
                    disabled
                    type="button"
                    className="relative flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[13px] font-semibold text-gray-400 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                    <span className="absolute right-2.5 rounded-md bg-gray-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-500">
                      Soon
                    </span>
                  </button>

                  <button
                    onClick={() => signIn("github", { callbackUrl: "/" })}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[13px] font-semibold text-gray-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:bg-gray-50 active:scale-[0.98]"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    GitHub
                  </button>
                </div>

                <div className="mt-4 px-1 text-center text-[11px] leading-relaxed text-gray-400">
                  Guest practice works without an account. Signing in enables
                  history sync, Swift AI, rewards, and your saved profile.
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}