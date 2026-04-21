import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPortalNav } from "@/components/admin/AdminPortalNav";
import { getAdminSession, touchAdminSession } from "@/lib/adminAuth";

export default async function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin/login");
  }

  await touchAdminSession(admin.sessionId);

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="sticky top-0 z-20 mb-5 rounded-4xl border border-white/60 bg-white/85 p-4 shadow-lg backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link href="/admin" className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
                Swift Type Admin
              </Link>
              <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Product observability cockpit
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">
                  Signed in
                </span>
                <span className="mt-1 block font-semibold text-slate-950">
                  {admin.name}
                </span>
                <span className="block text-xs text-slate-500">{admin.email}</span>
              </div>

              <form action="/api/admin/logout" method="post">
                <button
                  type="submit"
                  className="h-12 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>

          <div className="mt-4">
            <AdminPortalNav />
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}