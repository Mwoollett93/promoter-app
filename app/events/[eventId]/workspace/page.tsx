import { Suspense } from "react";

import EventWorkspaceContent from "@/app/components/collaboration/EventWorkspaceContent";
import DashboardShell from "@/app/components/layout/DashboardShell";

type PageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function EventWorkspacePage({ params }: PageProps) {
  const { eventId } = await params;

  return (
    <DashboardShell>
      <Suspense fallback={<p className="text-[#A1A1AA]">Loading workspace…</p>}>
        <EventWorkspaceContent eventId={eventId} />
      </Suspense>
    </DashboardShell>
  );
}
