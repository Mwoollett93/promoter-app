"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ArrowRight, Plus } from "lucide-react";

import DashboardFinancePanel from "@/app/components/dashboard/DashboardFinancePanel";
import DashboardOpsStatsRow from "@/app/components/dashboard/DashboardOpsStatsRow";
import DashboardTeamMembers from "@/app/components/dashboard/DashboardTeamMembers";
import DashboardVenuesArtists from "@/app/components/dashboard/DashboardVenuesArtists";
import UpcomingEventRow from "@/app/components/dashboard/UpcomingEventRow";
import TeamNotificationsPanel from "@/app/components/team/TeamNotificationsPanel";
import WorkspaceActivityFeed from "@/app/components/team/WorkspaceActivityFeed";
import {
  buildDashboardSnapshot,
  type DashboardFinanceScope,
  type DashboardSnapshot,
} from "@/lib/data/dashboard-snapshot";
import { useSettings } from "@/lib/settings/SettingsProvider";
import { getProfileFirstName } from "@/lib/settings/settings";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { loadManagedEvents } from "@/lib/data/events";
import { useDashboardOpsData } from "@/lib/team/use-dashboard-ops-data";
import { getStoredSession, getSupabaseConfig, listArtists } from "@/lib/supabase/browser";
import { listVenueSummaries } from "@/lib/supabase/venue-summaries";

const EMPTY_SNAPSHOT = buildDashboardSnapshot({ events: [] });
const MAX_UPCOMING = 3;
const MAX_ALERTS = 3;
const MAX_ACTIVITY = 4;

const artistsCache: {
  sessionId: string | null;
  artists: Awaited<ReturnType<typeof listArtists>>;
} = { sessionId: null, artists: [] };

const venuesCache: {
  sessionId: string | null;
  venues: Awaited<ReturnType<typeof listVenueSummaries>>;
} = { sessionId: null, venues: [] };

export default function DashboardPageContent() {
  const router = useRouter();
  const { settings } = useSettings();
  const { events: workspaceEvents, ready: workspaceReady } = useWorkspace();
  const ops = useDashboardOpsData();
  const [financeScope, setFinanceScope] = React.useState<DashboardFinanceScope>("portfolio");
  const [snapshot, setSnapshot] = React.useState<DashboardSnapshot>(EMPTY_SNAPSHOT);

  const refreshSnapshot = React.useCallback(async () => {
    const events = loadManagedEvents();
    const session = getStoredSession();
    let artists: Awaited<ReturnType<typeof listArtists>> = [];
    let venues: Awaited<ReturnType<typeof listVenueSummaries>> = [];

    if (session && getSupabaseConfig()) {
      const sessionId = session.user.id;
      if (artistsCache.sessionId === sessionId) {
        artists = artistsCache.artists;
      } else {
        try {
          artists = await listArtists(session);
          artistsCache.sessionId = sessionId;
          artistsCache.artists = artists;
        } catch {
          artists = [];
        }
      }

      if (venuesCache.sessionId === sessionId) {
        venues = venuesCache.venues;
      } else {
        try {
          venues = await listVenueSummaries(session);
          venuesCache.sessionId = sessionId;
          venuesCache.venues = venues;
        } catch {
          venues = [];
        }
      }
    }

    setSnapshot(
      buildDashboardSnapshot({
        events,
        artists,
        venues,
        preferences: settings.preferences,
        financeScope,
      }),
    );
  }, [settings.preferences, financeScope]);

  React.useEffect(() => {
    if (workspaceReady) void refreshSnapshot();
  }, [workspaceEvents, workspaceReady, refreshSnapshot]);

  React.useEffect(() => {
    void refreshSnapshot();

    let focusTimer: ReturnType<typeof setTimeout> | null = null;

    const onStorage = (event: StorageEvent) => {
      if (event.key === "promosync:managed-events") void refreshSnapshot();
    };

    const onEventsUpdated = () => {
      void refreshSnapshot();
      void ops.refreshTasks();
    };

    const onFocus = () => {
      if (focusTimer) clearTimeout(focusTimer);
      focusTimer = setTimeout(() => {
        void refreshSnapshot();
        void ops.refreshTasks();
      }, 500);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    window.addEventListener("promosync:events-updated", onEventsUpdated);

    return () => {
      if (focusTimer) clearTimeout(focusTimer);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("promosync:events-updated", onEventsUpdated);
    };
  }, [refreshSnapshot, ops.refreshTasks]);

  const upcoming = snapshot.upcomingEvents.slice(0, MAX_UPCOMING);
  const loading = !workspaceReady || !ops.ready;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden pb-0">
      <header className="flex shrink-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-[22px] font-bold leading-7 tracking-tight text-[#F5F5F7]">
            Welcome back, {getProfileFirstName(settings)}{" "}
            <span aria-hidden>👋</span>
          </h1>
          <p className="text-[12px] leading-4 text-[#A1A1AA]">
            Here&apos;s what&apos;s happening with your events.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/team?tab=templates"
            className="hidden text-[11px] font-medium text-[#8B5CF6] hover:text-[#A855F7] sm:inline"
          >
            Templates
          </Link>
          <Link
            href="/season"
            className="hidden text-[11px] font-medium text-[#8B5CF6] hover:text-[#A855F7] sm:inline"
          >
            Season
          </Link>
          <Link
            href="/event-wizard/event-basics"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[rgba(139,92,246,0.45)] bg-[#7C3AED] px-4 text-[13px] font-medium text-white hover:bg-[#6D28D9]"
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            Create Event
          </Link>
        </div>
      </header>

      {loading ? (
        <p className="text-[13px] text-[#A1A1AA]">Loading dashboard…</p>
      ) : (
        <>
          <DashboardOpsStatsRow stats={ops.opsStats} dense />

          <div className="grid min-h-0 flex-1 grid-rows-2 gap-2">
            {/* Top band: events · alerts · finance */}
            <div className="grid min-h-0 grid-cols-12 gap-2">
              <section className="col-span-12 flex min-h-0 flex-col rounded-xl border border-[#232330] bg-[#11111A] p-3 shadow-[0px_8px_24px_rgba(0,0,0,0.35)] lg:col-span-5">
                <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
                  <h2 className="text-[13px] font-semibold text-[#F5F5F7]">Upcoming Events</h2>
                  <Link
                    href="/events"
                    className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#8B5CF6] hover:text-[#A855F7]"
                  >
                    View all
                    <ArrowRight className="size-3.5" strokeWidth={2} aria-hidden />
                  </Link>
                </div>
                <ul className="flex min-h-0 flex-1 flex-col justify-start gap-1.5 overflow-hidden">
                  {upcoming.length > 0 ? (
                    upcoming.map((ev) => (
                      <li key={ev.title} className="shrink-0">
                        <UpcomingEventRow {...ev} compact />
                      </li>
                    ))
                  ) : (
                    <li className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[#3F3F46] px-3 py-4 text-center text-[11px] text-[#A1A1AA]">
                      No upcoming events
                    </li>
                  )}
                </ul>
              </section>

              <div className="col-span-12 min-h-0 lg:col-span-3">
                <TeamNotificationsPanel
                  items={ops.notifications}
                  limit={MAX_ALERTS}
                  embedded
                  onViewAll={() => router.push("/team?tab=activity")}
                />
              </div>

              <div className="col-span-12 min-h-0 lg:col-span-4">
                <DashboardFinancePanel
                  rows={snapshot.financialRows}
                  sparklineValues={snapshot.sparklineValues}
                  scope={financeScope}
                  onScopeChange={setFinanceScope}
                />
              </div>
            </div>

            {/* Bottom band: team · activity · venues/artists */}
            <div className="grid min-h-0 grid-cols-12 gap-2">
              <div className="col-span-12 min-h-0 lg:col-span-4">
                <DashboardTeamMembers
                  members={ops.activeMembers}
                  workloads={ops.workloads}
                  currentUserId={ops.session?.user.id}
                  limit={2}
                />
              </div>

              <div className="col-span-12 min-h-0 lg:col-span-4">
                <WorkspaceActivityFeed
                  compact
                  embedded
                  limit={MAX_ACTIVITY}
                  onViewAll={() => router.push("/team?tab=activity")}
                />
              </div>

              <div className="col-span-12 min-h-0 lg:col-span-4">
                <DashboardVenuesArtists
                  venues={snapshot.topVenues}
                  artists={snapshot.topArtists}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
