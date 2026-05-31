"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";

import CommentThread from "@/app/components/collaboration/CommentThread";
import EventPermissionsPanel from "@/app/components/collaboration/EventPermissionsPanel";
import EventActivityFeed from "@/app/components/collaboration/EventActivityFeed";
import EventPresence from "@/app/components/collaboration/EventPresence";
import PageContent from "@/app/components/layout/PageContent";
import SalesTrackerTab from "@/app/components/ticket-sales/SalesTrackerTab";
import EventStatusBadge from "@/app/components/ui/EventStatusBadge";
import KanbanBoard from "@/app/components/tasks/KanbanBoard";
import {
  EVENT_WORKSPACE_TABS,
  parseEventWorkspaceTab,
} from "@/lib/collaboration/event-workspace-tabs";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { getWorkspaceEvent } from "@/lib/supabase/events";
import type { WorkspaceEvent } from "@/lib/types/collaboration";

export default function EventWorkspaceContent({ eventId }: { eventId: string }) {
  const searchParams = useSearchParams();
  const tab = parseEventWorkspaceTab(searchParams.get("tab"));

  const { session, workspace, capabilities } = useWorkspace();
  const [event, setEvent] = React.useState<WorkspaceEvent | null>(null);

  React.useEffect(() => {
    if (!session) return;
    void getWorkspaceEvent(session, eventId, workspace?.id).then(setEvent);
  }, [session, eventId, workspace?.id]);

  return (
    <PageContent fill>
      <div className="flex min-h-0 flex-1 flex-col space-y-6 overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/events" className="text-[12px] text-[#8B5CF6] hover:text-[#C4B5FD]">
              ← Events
            </Link>
            <h1 className="mt-2 text-[28px] font-bold text-[#F5F5F7]">
              {event?.name ?? "Event workspace"}
            </h1>
            {event ? (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <EventStatusBadge status={event.status} />
                <span className="text-[13px] text-[#A1A1AA]">{event.venueName}</span>
              </div>
            ) : null}
            <div className="mt-3">
              <EventPresence eventId={eventId} />
            </div>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2 border-b border-[#232330] pb-2">
          {EVENT_WORKSPACE_TABS.map((t) => (
            <Link
              key={t.id}
              href={`/events/${eventId}/workspace?tab=${t.id}`}
              className={[
                "rounded-lg px-4 py-2 text-[13px] font-medium",
                tab === t.id
                  ? "bg-[#2D2640] text-[#C4B5FD]"
                  : "text-[#A1A1AA] hover:text-[#F5F5F7]",
              ].join(" ")}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {tab === "overview" && event ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Lineup slots" value={String(event.slotCount)} />
              <Stat label="Projected profit" value={String(event.projectedProfit)} />
              <Stat label="Ticket inventory" value={String(event.ticketInventory)} />
            </div>
            {capabilities.canManageTeam ? <EventPermissionsPanel eventId={eventId} /> : null}
          </div>
        ) : null}

        {tab === "sales" && event ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <SalesTrackerTab eventId={eventId} event={event} />
          </div>
        ) : null}
        {tab === "sales" && !event ? (
          <p className="text-[13px] text-[#A1A1AA]">Loading event data…</p>
        ) : null}

        {tab === "activity" ? <EventActivityFeed eventId={eventId} /> : null}
        {tab === "tasks" && workspace ? (
          <KanbanBoard workspaceId={workspace.id} eventId={eventId} />
        ) : null}
        {tab === "comments" ? (
          <CommentThread targetType="event" targetId={eventId} eventId={eventId} />
        ) : null}
      </div>
    </PageContent>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#232330] bg-[#11111A] px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-[#71717A]">{label}</p>
      <p className="mt-1 text-[18px] font-bold text-[#F5F5F7]">{value}</p>
    </div>
  );
}
