"use client";

import { getProviders, signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, LogIn, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthProviderIds, setOauthProviderIds] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    getProviders()
      .then((providers) => {
        if (!isMounted) return;
        setOauthProviderIds(new Set(Object.keys(providers ?? {})));
      })
      .catch(() => {
        if (!isMounted) return;
        setOauthProviderIds(new Set());
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const hasGitHubProvider = oauthProviderIds.has("github");
  const hasGoogleProvider = oauthProviderIds.has("google");
  const hasOAuthProviders = hasGitHubProvider || hasGoogleProvider;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (mode === "signup" && !name.trim())) return;

    setIsLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (next: "signin" | "signup") => {
    setMode(next);
    setError(null);
    setShowPassword(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Side panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.5 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col bg-white dark:bg-brand-dark sm:max-w-sm shadow-2xl border-l border-gray-200 dark:border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-black/20">
              <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
                <LogIn className="text-brand-orange w-5 h-5" />
                Swift Type Account
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 focus:outline-none transition-colors"
                aria-label="Close panel"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {/* Mode toggle */}
              <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 p-1">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className={[
                      "rounded-lg px-3 py-2 text-sm font-semibold transition-all",
                      mode === "signin"
                        ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300",
                    ].join(" ")}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className={[
                      "rounded-lg px-3 py-2 text-sm font-semibold transition-all",
                      mode === "signup"
                        ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300",
                    ].join(" ")}
                  >
                    Create Account
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-50 dark:bg-red-500/10 px-3 py-2.5 text-[13px] font-medium text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                {mode === "signup" && (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-transparent px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/15 shadow-sm"
                    required={mode === "signup"}
                  />
                )}

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-transparent px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/15 shadow-sm"
                  required
                />
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      mode === "signin" ? "Password" : "Create password"
                    }
                    className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-transparent px-3.5 py-2.5 pr-11 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/15 shadow-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-gray-900 transition-all hover:bg-gray-700 dark:hover:bg-gray-100 active:scale-[0.99] disabled:opacity-60 shadow-sm"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : mode === "signin" ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              {hasOAuthProviders && (
                <>
                  {/* Divider */}
                  <div className="relative flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-white/10" />
                    <span className="absolute left-1/2 -translate-x-1/2 bg-white dark:bg-brand-dark px-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                      or
                    </span>
                  </div>

                  {/* OAuth buttons */}
                  <div className="space-y-2.5">
                    {hasGitHubProvider && (
                      <button
                        onClick={() => signIn("github", { callbackUrl: "/" })}
                        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-all hover:bg-gray-50 dark:hover:bg-white/10 active:scale-[0.98]"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        Continue with GitHub
                      </button>
                    )}

                    {hasGoogleProvider && (
                      <button
                        onClick={() => signIn("google", { callbackUrl: "/" })}
                        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-all hover:bg-gray-50 dark:hover:bg-white/10 active:scale-[0.98]"
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
                        Continue with Google
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-brand-dark">
              <p className="text-[11px] text-center text-gray-400 dark:text-gray-500 leading-relaxed">
                Guest practice works without an account.{" "}
                <br className="hidden sm:block" />
                Sign in to sync history, Swift AI &amp; rewards.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
