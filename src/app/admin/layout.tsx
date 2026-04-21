export const dynamic = "force-dynamic";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-10 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(255,107,53,0.16),transparent_42%),linear-gradient(180deg,#fffaf5_0%,#f8fafc_45%,#eef2f7_100%)]">
      {children}
    </div>
  );
}