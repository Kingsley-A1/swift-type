import Link from "next/link";
import { AdminAuthForm } from "@/components/admin/AdminAuthForm";
import { getAdminConfigStatus } from "@/lib/adminAuth";

export default function AdminLoginPage() {
  const config = getAdminConfigStatus();

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-4xl bg-slate-950 px-6 py-8 text-white shadow-2xl sm:px-8">
            <p className="text-sm uppercase tracking-[0.3em] text-orange-300">
              Swift Type Admin
            </p>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
              Metric-first control for product, support, and trust.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Monitor user momentum, session quality, goal completion, reviews,
              Swift AI usage, streak health, and the full audit trail from one
              mobile-first surface.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                  Access model
                </p>
                <p className="mt-2 text-sm text-white">
                  Sign in with an existing admin email and the shared 6-digit
                  login code.
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                  Export model
                </p>
                <p className="mt-2 text-sm text-white">
                  Download user and audit datasets as JSON or CSV on demand.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-4xl border border-white/60 bg-white/85 p-6 shadow-xl backdrop-blur sm:p-8">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Admin sign in
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Welcome back.
              </h2>
            </div>

            {!config.hasLoginCode || !config.hasSessionSecret ? (
              <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Admin env configuration is incomplete. Set ADMIN_LOGIN_CODE and
                ADMIN_SESSION_SECRET before using this surface.
              </div>
            ) : null}

            <AdminAuthForm mode="login" />

            <p className="mt-6 text-sm text-slate-500">
              Need first-time access?{" "}
              <Link href="/admin/register" className="font-semibold text-slate-950">
                Register an admin
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}