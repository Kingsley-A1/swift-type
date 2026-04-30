import { TermsOfService } from "@/components/TermsOfService";
import { LegalPageScaffold } from "@/components/LegalPageScaffold";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for using Swift Type.",
};

export default function TermsPage() {
  return (
    <LegalPageScaffold>
      <div className="fixed inset-0 z-40 overflow-y-auto bg-[#fafafa] px-4 pb-20 pt-6 pl-22 layout-scrollbar dark:bg-[#0f1218] sm:py-16 sm:pl-24">
        <TermsOfService />
      </div>
    </LegalPageScaffold>
  );
}
