"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AdminAuthFormProps {
  mode: "login" | "register";
}

export function AdminAuthForm({ mode }: AdminAuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [registrationPassword, setRegistrationPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        mode === "login" ? "/api/admin/login" : "/api/admin/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            mode === "login"
              ? { email, code }
              : { name, email, registrationPassword },
          ),
        },
      );

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "Request failed");
      }

      router.push("/admin");
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {mode === "register" ? (
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Admin name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-(--brand-orange) focus:ring-4 focus:ring-orange-100"
            placeholder="Operations lead"
            required
          />
        </label>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-(--brand-orange) focus:ring-4 focus:ring-orange-100"
          placeholder="admin@swifttype.app"
          required
        />
      </label>

      {mode === "login" ? (
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Admin login code</span>
          <input
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D+/g, "").slice(0, 6))}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm tracking-[0.35em] text-slate-900 outline-none transition focus:border-(--brand-orange) focus:ring-4 focus:ring-orange-100"
            placeholder="123456"
            required
          />
        </label>
      ) : (
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Registration password</span>
          <input
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            value={registrationPassword}
            onChange={(event) =>
              setRegistrationPassword(
                event.target.value.replace(/\D+/g, "").slice(0, 10),
              )
            }
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm tracking-[0.28em] text-slate-900 outline-none transition focus:border-(--brand-orange) focus:ring-4 focus:ring-orange-100"
            placeholder="1234567890"
            required
          />
        </label>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading
          ? mode === "login"
            ? "Signing in..."
            : "Creating admin..."
          : mode === "login"
            ? "Sign in to Admin"
            : "Create Admin Access"}
      </button>
    </form>
  );
}