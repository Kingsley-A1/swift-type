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
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to register");
      }

      // Log the user in natively via standard credentials abstraction
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        throw new Error("Invalid email or password");
      }
      
      onClose(); // Modal successfully closes!
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
              className="relative w-full max-w-md overflow-hidden rounded-[30px]"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(248,249,252,0.92))",
                border: "1px solid rgba(255,255,255,0.65)",
                backdropFilter: "blur(32px) saturate(180%)",
                boxShadow:
                  "0 40px 100px rgba(15, 23, 42, 0.24), 0 8px 24px rgba(15, 23, 42, 0.12)",
              }}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-28"
                style={{
                  background:
                    "radial-gradient(circle at top, rgba(255,107,53,0.18), transparent 70%)",
                }}
              />
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/80" />

              <div className="relative p-7 sm:p-8">
                {/* Close */}
                <button
                  onClick={onClose}
                  className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/5 bg-white/70 text-gray-400 transition-colors hover:text-gray-700 hover:bg-white"
                >
                  <X size={15} />
                </button>

                {/* Header */}
                <div className="mb-8 flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl overflow-hidden"
                    style={{
                      boxShadow: "0 10px 30px rgba(255,107,53,0.28)",
                    }}
                  >
                    <Image src="/logo-192.png" alt="SwiftType" width={48} height={48} />
                  </div>
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400">
                      Swift Type Account
                    </p>
                    <h2 className="text-[28px] font-semibold leading-[1.05] text-gray-900">
                      Continue to Swift
                      <span className="text-brand-orange">Type</span>
                    </h2>
                    <p className="mt-2 max-w-xs text-[13px] leading-6 text-gray-500">
                      Sync your progress, unlock Swift AI coaching, and keep
                      every session backed up across devices.
                    </p>
                  </div>
                </div>

                {/* Native Email & Password Form */}
                <form onSubmit={handleSubmit} className="mb-6 space-y-3 relative z-10">
                  {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-50/50 p-3 text-[13px] font-medium text-red-600">
                      {error}
                    </div>
                  )}
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full rounded-2xl border border-gray-200 bg-white/60 px-4 py-3.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-brand-orange/40 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-orange/5 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full rounded-2xl border border-gray-200 bg-white/60 px-4 py-3.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-brand-orange/40 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-orange/5 transition-all"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-[14px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                    style={{ background: "linear-gradient(135deg, #ff6b35, #ff8c5a)", boxShadow: "0 8px 20px rgba(255,107,53,0.25)" }}
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin opacity-70" /> : mode === "signin" ? "Sign In" : "Create Account"}
                  </button>
                  <p className="text-center text-[12px] font-medium text-gray-500 mt-3 flex items-center justify-center gap-1.5 pt-1">
                    {mode === "signin" ? "Don't have an account?" : "Already properly registered?"}
                    <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }} className="font-bold text-brand-orange hover:underline focus:outline-none">
                      {mode === "signin" ? "Sign up" : "Sign in"}
                    </button>
                  </p>
                </form>

                <div className="relative my-6 z-0">
                  <div className="absolute inset-0 flex items-center opacity-70"><div className="w-full border-t border-gray-200" /></div>
                  <div className="relative flex justify-center text-[11px] uppercase tracking-widest text-gray-400 font-bold bg-white/70 backdrop-blur-md px-3 w-max mx-auto rounded-full">
                    OR
                  </div>
                </div>

                {/* OAuth Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    className="group flex w-full items-center gap-3 rounded-2xl border border-white/80 bg-white/85 px-4 py-4 text-left text-sm font-semibold text-gray-800 transition-all hover:-translate-y-0.5 hover:border-gray-200 hover:bg-white"
                    style={{ boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)" }}
                  >
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      className="shrink-0"
                    >
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
                    <div className="flex-1">
                      <div>Continue with Google</div>
                      <div className="mt-0.5 text-[12px] font-medium text-gray-400">
                        Fast sign-in with your Google account
                      </div>
                    </div>
                    <span className="text-gray-300 transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </button>

                  <button
                    onClick={() => signIn("github", { callbackUrl: "/" })}
                    className="group flex w-full items-center gap-3 rounded-2xl border border-white/80 bg-white/85 px-4 py-4 text-left text-sm font-semibold text-gray-800 transition-all hover:-translate-y-0.5 hover:border-gray-200 hover:bg-white"
                    style={{ boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)" }}
                  >
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="shrink-0 text-gray-800 dark:text-white"
                    >
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    <div className="flex-1">
                      <div>Continue with GitHub</div>
                      <div className="mt-0.5 text-[12px] font-medium text-gray-400">
                        Ideal if your workflow already lives in GitHub
                      </div>
                    </div>
                    <span className="text-gray-300 transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </button>
                </div>

                <div className="mt-6 rounded-2xl border border-black/5 bg-black/[0.02] px-4 py-3 text-[12px] leading-5 text-gray-500 text-center">
                  By continuing, you agree to our zero-friction terms. Swift
                  Type safely handles all data securely.
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
