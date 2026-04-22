export const dynamic = "force-dynamic";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-gray-50 bg-[radial-gradient(circle_at_12%_0%,rgba(255,107,53,0.1),transparent_38%),radial-gradient(circle_at_88%_0%,rgba(255,107,53,0.06),transparent_34%)]">
      <div className="min-h-full">{children}</div>
    </div>
  );
}
