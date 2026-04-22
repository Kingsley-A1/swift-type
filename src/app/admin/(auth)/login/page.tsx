import Link from "next/link";
import { AdminAuthForm } from "@/components/admin/AdminAuthForm";
import { getAdminConfigStatus } from "@/lib/adminAuth";

export default function AdminLoginPage() {
  const config = getAdminConfigStatus();

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-[13px] font-bold uppercase tracking-[0.28em] text-[#ff6b35]">
            Swift Type
          </span>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-gray-900">
            Admin Sign In
          </h1>
          <p className="mt-1.5 text-sm text-gray-400">
            Secure access to the product dashboard
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          {!config.hasLoginCode || !config.hasSessionSecret ? (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Admin env incomplete — set ADMIN_LOGIN_CODE and
              ADMIN_SESSION_SECRET.
            </div>
          ) : null}

          <AdminAuthForm mode="login" />

          <p className="mt-5 text-sm text-center text-gray-400">
            First time?{" "}
            <Link
              href="/admin/register"
              className="font-semibold text-gray-900 hover:text-[#ff6b35] transition-colors"
            >
              Register an admin
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
