import { PrivacyPolicy } from "@/components/PrivacyPolicy";

export const metadata = {
  title: "Privacy Policy",
  description: "Learn how Swift Type handles and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="fixed inset-0 z-40 bg-[#fafafa] dark:bg-[#0f1218] overflow-y-auto layout-scrollbar pt-6 pb-20 sm:py-16 px-4">
      <PrivacyPolicy />
    </div>
  );
}
