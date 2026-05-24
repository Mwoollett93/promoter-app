"use client";

import Link from "next/link";
import * as React from "react";
import {
  ArrowRight,
  CalendarDays,
  DollarSign,
  LayoutDashboard,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";

import PageContent from "@/app/components/layout/PageContent";
import EventStatusBadge from "@/app/components/ui/EventStatusBadge";
import UpcomingEventRow from "@/app/components/dashboard/UpcomingEventRow";
import StatMiniCard from "@/app/components/dashboard/StatMiniCard";
import CurrencyText from "@/app/components/ui/CurrencyText";
import { buildDashboardSnapshot, type DashboardSnapshot } from "@/lib/data/dashboard-snapshot";
import { useSettings } from "@/lib/settings/SettingsProvider";
import { getProfileFirstName } from "@/lib/settings/settings";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { loadManagedEvents } from "@/lib/data/events";
import { GRID_CARD_GAP, PAGE_STACK_GAP } from "@/lib/layout/page-layout";
import { getStoredSession, getSupabaseConfig, listArtists } from "@/lib/supabase/browser";
import { listVenueSummaries } from "@/lib/supabase/venue-summaries";

function FinancialSparkline({ values }: { values: number[] }) {
  const width = 400;
  const height = 120;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const points = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 16) - 8;
    return { x, y };
  });

  const line = points.map((point) => `${point.x},${point.y}`).join(" L ");
  const area = `M0,${height} L ${line} L ${width},${height} Z`;

  return (
    <div className="relative mt-4 min-h-[160px] w-full flex-1 overflow-hidden rounded-lg bg-[#0B0B10] ring-1 ring-[#232330]">
      <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="fin-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="fin-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6D28D9" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#fin-fill)" />
        <path
          d={`M ${line}`}
          fill="none"
          stroke="url(#fin-line)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function StatusDonut({ slices }: { slices: DashboardSnapshot["eventStatusDistribution"] }) {
  let acc = 0;
  const gradientStops = slices
    .map((s) => {
      const colors: Record<string, string> = {
        active: "#8B5CF6",
        confirmed: "#8B5CF6",
        planning: "#F59E0B",
        draft: "#71717A",
        cancelled: "#EF4444",
        canceled: "#EF4444",
        completed: "#10B981",
      };
      const start = acc;
      acc += s.pct;
      return `${colors[s.status] ?? "#71717A"} ${start}% ${acc}%`;
    })
    .join(", ");

  return (
    <div className="rounded-xl border border-[#232330] bg-[#11111A] p-4 shadow-[0px_8px_24px_rgba(0,0,0,0.35)]">
      <h3 className="text-[15px] font-semibold text-[#F5F5F7]">Event Status</h3>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div
          className="size-36 shrink-0 rounded-full ring-4 ring-[#18181F]"
          style={{ background: slices.length > 0 ? `conic-gradient(${gradientStops})` : "#27272F" }}
          aria-hidden
        />
        <ul className="min-w-0 flex-1 space-y-2 text-[12px]">
          {slices.map((s) => (
            <li key={s.status} className="flex items-center justify-between gap-2">
              <EventStatusBadge status={s.status} />
              <span className="tabular-nums text-[#A1A1AA]">
                {s.count} ({s.pct}%)
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const EMPTY_SNAPSHOT = buildDashboardSnapshot({ events: [] });

/** ~3 upcoming event rows visible before the list scrolls (row height + 12px gaps). */
const UPCOMING_EVENTS_LIST_MAX_HEIGHT =
  "max-h-[264px] overflow-y-auto overscroll-contain sm:max-h-[312px]";

const artistsCache: {
  sessionId: string | null;
  artists: Awaited<ReturnType<typeof listArtists>>;
} = { sessionId: null, artists: [] };

const venuesCache: {
  sessionId: string | null;
  venues: Awaited<ReturnType<typeof listVenueSummaries>>;
} = { sessionId: null, venues: [] };

export default function DashboardPageContent() {
  const { settings } = useSettings();
  const { events: workspaceEvents, ready: workspaceReady } = useWorkspace();
  const [snapshot, setSnapshot] = React.useState<DashboardSnapshot>(EMPTY_SNAPSHOT);
  const icons = [CalendarDays, Users, DollarSign, TrendingUp];

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
      }),
    );
  }, [settings.preferences]);

  React.useEffect(() => {
    if (workspaceReady) void refreshSnapshot();
  }, [workspaceEvents, workspaceReady, refreshSnapshot]);

  React.useEffect(() => {
    void refreshSnapshot();

    let focusTimer: ReturnType<typeof setTimeout> | null = null;

    const onStorage = (event: StorageEvent) => {
      if (event.key === "promosync:managed-events") {
        void refreshSnapshot();
      }
    };

    const onEventsUpdated = () => {
      void refreshSnapshot();
    };

    const onFocus = () => {
      if (focusTimer) clearTimeout(focusTimer);
      focusTimer = setTimeout(() => void refreshSnapshot(), 500);
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
  }, [refreshSnapshot]);

  return (
    <PageContent fill>
      <header className={`flex flex-col ${PAGE_STACK_GAP} sm:flex-row sm:items-start sm:justify-between`}>
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
        <Link
          href="/event-wizard/event-basics"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[8px] border border-[rgba(139,92,246,0.45)] bg-[#7C3AED] px-6 text-[16px] font-medium leading-5 tracking-[0.08px] text-white transition-all hover:border-[#A855F7] hover:bg-[linear-gradient(178.683deg,#7C3AED_4.7705%,rgba(71,33,135,0.76)_96.232%)] hover:shadow-[0_0_24px_0_rgba(139,92,246,0.3)] active:bg-[rgba(124,58,237,0.44)]"
        >
          <Plus className="size-5 shrink-0" strokeWidth={2} aria-hidden />
          Create Event
        </Link>
      </header>

      <section className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 ${GRID_CARD_GAP}`}>
        {snapshot.stats.map((s, i) => (
          <StatMiniCard
            key={s.label}
            icon={icons[i] ?? LayoutDashboard}
            label={s.label}
            value={
              s.currencyAmount != null ? (
                <CurrencyText value={s.currencyAmount} />
              ) : (
                s.value
              )
            }
            trend={s.trend}
            trendUp={s.trendUp}
          />
        ))}
      </section>

      <section className={`grid grid-cols-1 lg:grid-cols-3 lg:items-stretch ${GRID_CARD_GAP}`}>
        <div className="flex flex-col rounded-xl border border-[#232330] bg-[#11111A] p-4 shadow-[0px_8px_24px_rgba(0,0,0,0.35)] lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[16px] font-semibold text-[#F5F5F7]">Upcoming Events</h2>
            <Link
              href="/events"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-[#8B5CF6] hover:text-[#A855F7]"
            >
              View all events
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
            </Link>
          </div>
          <ul className={`flex flex-col ${PAGE_STACK_GAP} ${UPCOMING_EVENTS_LIST_MAX_HEIGHT}`}>
            {snapshot.upcomingEvents.length > 0 ? (
              snapshot.upcomingEvents.map((ev) => (
                <li key={ev.title}>
                  <UpcomingEventRow {...ev} />
                </li>
              ))
            ) : (
              <li className="rounded-lg border border-dashed border-[#3F3F46] px-4 py-8 text-center text-[13px] text-[#A1A1AA]">
                No upcoming events yet. Create one to see it here.
              </li>
            )}
          </ul>
          <Link
            href="/event-wizard/event-basics"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-dashed border-[#8B5CF6]/50 bg-transparent py-2.5 text-[14px] font-medium text-[#8B5CF6] transition-colors hover:border-[#8B5CF6] hover:bg-[#8B5CF6]/5"
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            Create New Event
          </Link>
        </div>

        <div className="flex min-h-0 flex-col rounded-xl border border-[#232330] bg-[#11111A] p-4 shadow-[0px_8px_24px_rgba(0,0,0,0.35)]">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
            <h2 className="text-[16px] font-semibold text-[#F5F5F7]">Financial Overview</h2>
            <label className="sr-only" htmlFor="fin-range">
              Range
            </label>
            <select
              id="fin-range"
              className="rounded-md border border-[#3F3F46] bg-[#0B0B10] px-2 py-1.5 text-[12px] text-[#E4E4E7] outline-none focus:border-[#8B5CF6]"
              defaultValue="portfolio"
            >
              <option value="portfolio">All Events</option>
              <option value="active">Active Only</option>
            </select>
          </div>
          <ul className="mt-4 shrink-0 space-y-2 text-[13px]">
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
      </section>

      <section className={`grid grid-cols-1 lg:grid-cols-3 ${GRID_CARD_GAP}`}>
        <StatusDonut slices={snapshot.eventStatusDistribution} />

        <div className="rounded-xl border border-[#232330] bg-[#11111A] p-4 shadow-[0px_8px_24px_rgba(0,0,0,0.35)]">
          <h3 className="text-[15px] font-semibold text-[#F5F5F7]">Top Venues</h3>
          <ul className="mt-4 space-y-3">
            {snapshot.topVenues.length > 0 ? (
              snapshot.topVenues.map((v) => (
                <li key={v.name} className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-[#3F3F46] bg-[#18181F]">
                    {v.thumb ? <img src={v.thumb} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-[#F5F5F7]">{v.name}</p>
                    <p className="text-[11px] text-[#A1A1AA]">{v.events} events</p>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-[13px] text-[#A1A1AA]">No venues in your event portfolio yet.</li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-[#232330] bg-[#11111A] p-4 shadow-[0px_8px_24px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[15px] font-semibold text-[#F5F5F7]">Top Artists</h3>
            <Link
              href="/artists"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-[#8B5CF6] hover:text-[#A855F7]"
            >
              View all artists
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
        </div>
      </section>
    </PageContent>
  );
}
