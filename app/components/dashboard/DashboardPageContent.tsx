"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ArrowRight, Plus } from "lucide-react";

import StartNewEventLink from "@/app/components/events/StartNewEventLink";
import PageContent from "@/app/components/layout/PageContent";
import DashboardLoadingSkeleton from "@/app/components/dashboard/DashboardLoadingSkeleton";
import DashboardOpsStatsRow from "@/app/components/dashboard/DashboardOpsStatsRow";
import UpcomingEventRow from "@/app/components/dashboard/UpcomingEventRow";
import CurrencyText from "@/app/components/ui/CurrencyText";
import TeamNotificationsPanel from "@/app/components/team/TeamNotificationsPanel";
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
import { GRID_CARD_GAP, PAGE_STACK_GAP } from "@/lib/layout/page-layout";
import {
  LINK_ACCENT,
  SECTION_CARD,
  SECTION_CARD_PADDING,
  SECTION_TITLE,
} from "@/lib/ui/page-surfaces";
import { getStoredSession, getSupabaseConfig, listArtists } from "@/lib/supabase/browser";
import { listVenueSummaries } from "@/lib/supabase/venue-summaries";

function FinancialSparkline({ values }: { values: number[] }) {
  const width = 400;
  const height = 100;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const points = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 12) - 6;
    return { x, y };
  });

  const line = points.map((point) => `${point.x},${point.y}`).join(" L ");
  const area = `M0,${height} L ${line} L ${width},${height} Z`;

  return (
    <div className="relative h-[100px] w-full overflow-hidden rounded-lg bg-[#0B0B10] ring-1 ring-[#232330]">
      <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="dash-fin-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="dash-fin-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6D28D9" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#dash-fin-fill)" />
        <path
          d={`M ${line}`}
          fill="none"
          stroke="url(#dash-fin-line)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

const EMPTY_SNAPSHOT = buildDashboardSnapshot({ events: [] });

const artistsCache: {
  workspaceId: string | null;
  artists: Awaited<ReturnType<typeof listArtists>>;
} = { workspaceId: null, artists: [] };

const venuesCache: {
  workspaceId: string | null;
  venues: Awaited<ReturnType<typeof listVenueSummaries>>;
} = { workspaceId: null, venues: [] };

export default function DashboardPageContent() {
  const router = useRouter();
  const { settings } = useSettings();
  const { events: workspaceEvents, ready: workspaceReady, refresh: refreshWorkspace, workspace } = useWorkspace();
  const ops = useDashboardOpsData();
  const [financeScope, setFinanceScope] = React.useState<DashboardFinanceScope>("portfolio");
  const [snapshot, setSnapshot] = React.useState<DashboardSnapshot>(EMPTY_SNAPSHOT);
  const [snapshotReady, setSnapshotReady] = React.useState(false);

  const refreshSnapshot = React.useCallback(async () => {
    const events = loadManagedEvents();
    const session = getStoredSession();
    let artists: Awaited<ReturnType<typeof listArtists>> = [];
    let venues: Awaited<ReturnType<typeof listVenueSummaries>> = [];

    try {
      if (session && getSupabaseConfig() && workspace?.id) {
        const workspaceId = workspace.id;
        if (artistsCache.workspaceId === workspaceId) {
          artists = artistsCache.artists;
        } else {
          try {
            artists = await listArtists(session, workspaceId);
            artistsCache.workspaceId = workspaceId;
            artistsCache.artists = artists;
          } catch {
            artists = [];
          }
        }

        if (venuesCache.workspaceId === workspaceId) {
          venues = venuesCache.venues;
        } else {
          try {
            venues = await listVenueSummaries(session, workspaceId);
            venuesCache.workspaceId = workspaceId;
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
    } finally {
      setSnapshotReady(true);
    }
  }, [settings.preferences, financeScope, workspace?.id]);

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
      void refreshWorkspace();
    };

    const onFocus = () => {
      if (focusTimer) clearTimeout(focusTimer);
      focusTimer = setTimeout(() => {
        void refreshSnapshot();
        void refreshWorkspace();
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
  }, [refreshSnapshot, refreshWorkspace]);

  const upcoming = snapshot.upcomingEvents;
  const loading = !snapshotReady;

  return (
    <PageContent fill>
      <div className={`flex h-full min-h-0 flex-col ${PAGE_STACK_GAP} overflow-hidden`}>
        <header
          className={`flex shrink-0 flex-col ${PAGE_STACK_GAP} sm:flex-row sm:items-start sm:justify-between`}
        >
          <div>
            <h1 className="text-[28px] font-bold leading-8 tracking-tight text-[#F5F5F7] sm:text-[32px] sm:leading-9">
              Welcome back, {getProfileFirstName(settings)}{" "}
              <span className="inline-block" aria-hidden>
                👋
              </span>
            </h1>
            <p className="mt-1 text-[14px] leading-5 text-[#A1A1AA]">
              Here&apos;s what&apos;s happening with your events.
            </p>
          </div>
          <StartNewEventLink
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[8px] border border-[rgba(139,92,246,0.45)] bg-[#7C3AED] px-6 text-[16px] font-medium leading-5 tracking-[0.08px] text-white transition-all hover:border-[#A855F7] hover:bg-[linear-gradient(178.683deg,#7C3AED_4.7705%,rgba(71,33,135,0.76)_96.232%)] hover:shadow-[0_0_24px_0_rgba(139,92,246,0.3)] active:bg-[rgba(124,58,237,0.44)]"
          >
            <Plus className="size-5 shrink-0" strokeWidth={2} aria-hidden />
            Create Event
          </StartNewEventLink>
        </header>

        {loading ? (
          <DashboardLoadingSkeleton />
        ) : (
          <div className={`flex min-h-0 flex-1 flex-col ${PAGE_STACK_GAP} overflow-hidden`}>
            <DashboardOpsStatsRow stats={ops.opsStats} />

            <section
              className={`grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-3 lg:items-stretch ${GRID_CARD_GAP}`}
            >
              <div
                className={`flex min-h-0 flex-col rounded-xl border border-[#232330] bg-[#11111A] p-4 shadow-[0px_8px_24px_rgba(0,0,0,0.35)] lg:col-span-2`}
              >
                <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-2">
                  <h2 className="text-[16px] font-semibold text-[#F5F5F7]">Upcoming Events</h2>
                  <Link
                    href="/events"
                    className={`inline-flex items-center gap-1 ${LINK_ACCENT}`}
                  >
                    View all events
                    <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
                  </Link>
                </div>
                <ul
                  className={`flex min-h-0 flex-1 flex-col ${PAGE_STACK_GAP} overflow-y-auto overscroll-contain pr-1`}
                >
                  {upcoming.length > 0 ? (
                    upcoming.map((ev) => (
                      <li key={ev.title} className="shrink-0">
                        <UpcomingEventRow {...ev} />
                      </li>
                    ))
                  ) : (
                    <li className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[#3F3F46] px-4 py-8 text-center text-[13px] text-[#A1A1AA]">
                      No upcoming events yet. Create one to see it here.
                    </li>
                  )}
                </ul>
                <StartNewEventLink
                  className="mt-4 inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-dashed border-[#8B5CF6]/50 py-2.5 text-[14px] font-medium text-[#8B5CF6] transition-colors hover:border-[#8B5CF6] hover:bg-[#8B5CF6]/5"
                >
                  <Plus className="size-4" strokeWidth={2} aria-hidden />
                  Create New Event
                </StartNewEventLink>
              </div>

              <TeamNotificationsPanel
                items={ops.notifications}
                limit={4}
                onViewAll={() => router.push("/team?tab=activity")}
              />
            </section>

            <section className={`grid shrink-0 grid-cols-1 lg:grid-cols-3 ${GRID_CARD_GAP}`}>
              <div
                className={`rounded-xl border border-[#232330] bg-[#11111A] p-4 shadow-[0px_8px_24px_rgba(0,0,0,0.35)] lg:col-span-2`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-[16px] font-semibold text-[#F5F5F7]">Financial Overview</h2>
                  <select
                    value={financeScope}
                    onChange={(e) => setFinanceScope(e.target.value as DashboardFinanceScope)}
                    className="rounded-md border border-[#3F3F46] bg-[#0B0B10] px-2 py-1.5 text-[12px] text-[#E4E4E7] outline-none focus:border-[#8B5CF6]"
                    aria-label="Finance range"
                  >
                    <option value="portfolio">All Events</option>
                    <option value="active">Active Only</option>
                  </select>
                </div>
                <div className={`mt-4 grid grid-cols-1 sm:grid-cols-2 ${GRID_CARD_GAP}`}>
                  <ul className="space-y-2 text-[13px]">
                    {snapshot.financialRows.map((row) => (
                      <li
                        key={row.label}
                        className="flex items-center justify-between gap-2 border-b border-[#232330] pb-2 last:border-0"
                      >
                        <span className="text-[#A1A1AA]">{row.label}</span>
                        <span
                          className={`font-semibold tabular-nums ${row.highlight ? "text-emerald-400" : "text-[#F5F5F7]"}`}
                        >
                          {row.currencyAmount != null ? (
                            <CurrencyText value={row.currencyAmount} />
                          ) : (
                            row.value
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <FinancialSparkline values={snapshot.sparklineValues} />
                </div>
              </div>

              <div className={`flex flex-col ${PAGE_STACK_GAP}`}>
                <section className={[SECTION_CARD, SECTION_CARD_PADDING, "flex-1"].join(" ")}>
                  <h3 className={SECTION_TITLE}>Top Venues</h3>
                  <ul className="mt-4 space-y-3">
                    {snapshot.topVenues.length > 0 ? (
                      snapshot.topVenues.map((v) => (
                        <li key={v.name} className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-[#3F3F46] bg-[#18181F]">
                            {v.thumb ? (
                              <img src={v.thumb} alt="" className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-[#F5F5F7]">{v.name}</p>
                            <p className="text-[11px] text-[#A1A1AA]">{v.events} events</p>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="text-[13px] text-[#A1A1AA]">No venues in your portfolio yet.</li>
                    )}
                  </ul>
                </section>

                <section className={[SECTION_CARD, SECTION_CARD_PADDING, "flex-1"].join(" ")}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={SECTION_TITLE}>Top Artists</h3>
                    <Link
                      href="/artists"
                      className={`inline-flex items-center gap-1 ${LINK_ACCENT}`}
                    >
                      View all
                      <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
                    </Link>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {snapshot.topArtists.length > 0 ? (
                      snapshot.topArtists.map((a) => (
                        <li key={a.name}>
                          <Link
                            href="/artists"
                            className="flex items-center gap-3 rounded-lg transition-colors hover:bg-[#181824]"
                          >
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#3F3F46] ring-2 ring-[#18181F]">
                              {a.avatar ? (
                                <img src={a.avatar} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full bg-gradient-to-br from-[#2D2640] to-[#11111A]" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-medium text-[#F5F5F7]">{a.name}</p>
                              <p className="text-[11px] text-[#A1A1AA]">{a.events} bookings</p>
                            </div>
                          </Link>
                        </li>
                      ))
                    ) : (
                      <li className="text-[13px] text-[#A1A1AA]">Add artists to populate this list.</li>
                    )}
                  </ul>
                </section>
              </div>
            </section>
          </div>
        )}
      </div>
    </PageContent>
  );
}
