import { PrivacyPolicy } from "@/components/PrivacyPolicy";
import { LegalPageScaffold } from "@/components/LegalPageScaffold";

export const metadata = {
  title: "Privacy Policy",
  description: "Learn how Swift Type handles and protects your data.",
};

export default function PrivacyPage() {
  return (
    <LegalPageScaffold>
      <div className="fixed inset-0 z-40 overflow-y-auto bg-[#fafafa] px-4 pb-20 pt-6 pl-22 layout-scrollbar dark:bg-[#0f1218] sm:py-16 sm:pl-24">
        <PrivacyPolicy />
      </div>
    </LegalPageScaffold>
  );
}
