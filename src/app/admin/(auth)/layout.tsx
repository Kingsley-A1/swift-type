import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminAuth";

export default async function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminSession();

  if (admin) {
    redirect("/admin");
  }

  return children;
}
