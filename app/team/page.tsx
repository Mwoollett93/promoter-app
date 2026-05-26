import { Suspense } from "react";

import DashboardShell from "@/app/components/layout/DashboardShell";
import TeamPageContent from "@/app/components/team/TeamPageContent";

export default function TeamPage() {
  return (
    <DashboardShell>
      <Suspense
        fallback={
          <p className="px-5 py-10 text-[14px] text-[#A1A1AA]">Loading team workspace…</p>
        }
      >
        <TeamPageContent />
      </Suspense>
    </DashboardShell>
  );
}
