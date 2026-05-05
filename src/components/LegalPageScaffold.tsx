"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";

export function LegalPageScaffold({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <>
      <AppSidebar
        isGoalsOpen={false}
        isHistoryOpen={false}
        isDocsOpen={false}
        isRewardsOpen={false}
        isReviewsOpen={false}
        isContactOpen={false}
        isRankOpen={false}
        onOpenGoals={() => router.push("/")}
        onOpenHistory={() => router.push("/")}
        onOpenDocs={() => router.push("/")}
        onOpenRewards={() => router.push("/")}
        onOpenProfile={() => router.push("/")}
        onOpenReviews={() => router.push("/")}
        onOpenContact={() => router.push("/")}
        onOpenRank={() => router.push("/")}
      />
      {children}
    </>
  );
}
