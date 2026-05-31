import { Suspense } from "react";

import EventManagementPage from "@/app/components/events/EventManagementPage";
import DashboardShell from "@/app/components/layout/DashboardShell";

export default function EventsPage() {
  return (
    <DashboardShell>
      <Suspense fallback={<div className="p-8 text-[#A1A1AA]">Loading events…</div>}>
        <EventManagementPage />
      </Suspense>
    </DashboardShell>
  );
}
