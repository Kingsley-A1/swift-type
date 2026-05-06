import { AboutPage } from "@/components/AboutPage";
import { LegalPageScaffold } from "@/components/LegalPageScaffold";

export const metadata = {
  title: "About | Swift Type",
  description: "Learn more about Swift Type, our mission, vision, and the team behind it.",
};

export default function About() {
  return (
    <LegalPageScaffold>
      <div className="fixed inset-0 z-40 overflow-y-auto bg-[#fafafa] px-4 pb-20 pt-6 pl-22 layout-scrollbar dark:bg-[#0f1218] sm:py-16 sm:pl-24">
        <AboutPage />
      </div>
    </LegalPageScaffold>
  );
}
