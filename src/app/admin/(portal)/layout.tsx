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
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-4">
            <Link
              href="/admin"
              className="text-[14px] font-black tracking-tight text-gray-900"
            >
              Swift<span className="text-[#ff6b35]">Type</span>{" "}
              <span className="text-[13px] font-normal text-gray-400">
                Admin
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-[12px] font-semibold text-gray-900 leading-none">
                  {admin.name}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {admin.email}
                </p>
              </div>
              <form action="/api/admin/logout" method="post">
                <button
                  type="submit"
                  className="h-8 rounded-lg bg-gray-100 px-3 text-[12px] font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>

          <AdminPortalNav />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">{children}</div>
    </div>
  );
}
