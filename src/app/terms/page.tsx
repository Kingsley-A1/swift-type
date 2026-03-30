import { TermsOfService } from "@/components/TermsOfService";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for using Swift Type.",
};

export default function TermsPage() {
  return (
    <div className="fixed inset-0 z-40 bg-[#fafafa] dark:bg-[#0f1218] overflow-y-auto layout-scrollbar pt-6 pb-20 sm:py-16 px-4">
      <TermsOfService />
    </div>
  );
}
