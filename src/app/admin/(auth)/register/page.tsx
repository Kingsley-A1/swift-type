import Link from "next/link";
import { AdminAuthForm } from "@/components/admin/AdminAuthForm";
import { getAdminConfigStatus } from "@/lib/adminAuth";

export default function AdminRegisterPage() {
  const config = getAdminConfigStatus();

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-4xl border border-white/60 bg-white/85 p-6 shadow-xl backdrop-blur sm:p-8">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Admin registration
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Create a gated admin identity.
              </h1>
            </div>

            {!config.hasRegistrationPassword || !config.hasSessionSecret ? (
              <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Admin env configuration is incomplete. Set
                ADMIN_REGISTRATION_PASSWORD and ADMIN_SESSION_SECRET before
                registering admins.
              </div>
            ) : null}

            <AdminAuthForm mode="register" />

            <p className="mt-6 text-sm text-slate-500">
              Already registered?{" "}
              <Link href="/admin/login" className="font-semibold text-slate-950">
                Sign in here
              </Link>
            </p>
          </section>

          <section className="rounded-4xl bg-[linear-gradient(180deg,#0f172a_0%,#172554_100%)] px-6 py-8 text-white shadow-2xl sm:px-8">
            <p className="text-sm uppercase tracking-[0.3em] text-orange-300">
              Registration rules
            </p>
            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl bg-white/10 p-4 text-sm leading-7 text-slate-200">
                A new admin account is created only when the 10-digit
                ADMIN_REGISTRATION_PASSWORD matches.
              </div>
              <div className="rounded-2xl bg-white/10 p-4 text-sm leading-7 text-slate-200">
                After registration, the admin can sign in using their email and
                the shared 6-digit ADMIN_LOGIN_CODE.
              </div>
              <div className="rounded-2xl bg-white/10 p-4 text-sm leading-7 text-slate-200">
                Every export and critical admin action is written into the admin
                audit log so usage remains explainable.
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}