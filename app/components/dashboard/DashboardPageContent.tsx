import Link from "next/link";
import {
  ArrowRight,
  AudioWaveform,
  CalendarDays,
  DollarSign,
  LayoutDashboard,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";

import EventStatusBadge from "@/app/components/ui/EventStatusBadge";
import UpcomingEventRow from "@/app/components/dashboard/UpcomingEventRow";
import StatMiniCard from "@/app/components/dashboard/StatMiniCard";
import {
  dashboardStats,
  eventStatusDistribution,
  financialRows,
  recentActivity,
  topArtists,
  topVenues,
  upcomingEvents,
} from "@/lib/data/dashboard";
import type { ActivityItem } from "@/lib/data/dashboard";

function ActivityGlyph({ item }: { item: ActivityItem["icon"] }) {
  const wrap =
    "flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1A1630] text-[#C4B5FD] ring-1 ring-[#8B5CF6]/20";
  switch (item) {
    case "wave":
      return (
        <span className={wrap} aria-hidden>
          <AudioWaveform className="size-4" strokeWidth={2} />
        </span>
      );
    case "user":
      return (
        <span className={wrap} aria-hidden>
          <Users className="size-4" strokeWidth={2} />
        </span>
      );
    case "dollar":
      return (
        <span className={`${wrap} text-amber-300 ring-amber-500/30`} aria-hidden>
          <DollarSign className="size-4" strokeWidth={2} />
        </span>
      );
    case "calendar":
      return (
        <span className={`${wrap} text-emerald-300 ring-emerald-500/25`} aria-hidden>
          <CalendarDays className="size-4" strokeWidth={2} />
        </span>
      );
    default:
      return null;
  }
}

/** Simple purple trend SVG — decorative */
function FinancialSparkline() {
  return (
    <div className="relative mt-4 h-[120px] w-full overflow-hidden rounded-lg bg-[#0B0B10] ring-1 ring-[#232330]">
      <svg
        viewBox="0 0 400 120"
        className="h-full w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
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
        <path
          d="M0,90 L40,85 L80,70 L120,78 L160,55 L200,62 L240,40 L280,48 L320,30 L360,38 L400,25 L400,120 L0,120 Z"
          fill="url(#fin-fill)"
        />
        <path
          d="M0,90 L40,85 L80,70 L120,78 L160,55 L200,62 L240,40 L280,48 L320,30 L360,38 L400,25"
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

function StatusDonut() {
  const slices = eventStatusDistribution;
  let acc = 0;
  const gradientStops = slices
    .map((s) => {
      const colors: Record<string, string> = {
        confirmed: "#8B5CF6",
        planning: "#F59E0B",
        draft: "#71717A",
        cancelled: "#EF4444",
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
          style={{
            background: `conic-gradient(${gradientStops})`,
          }}
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

export default function DashboardPageContent() {
  const icons = [CalendarDays, Users, DollarSign, TrendingUp];

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 pb-10">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold leading-8 tracking-tight text-[#F5F5F7] sm:text-[32px] sm:leading-9">
            Welcome back, Alex{" "}
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

      {/* Stats */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((s, i) => (
          <StatMiniCard
            key={s.label}
            icon={icons[i] ?? LayoutDashboard}
            label={s.label}
            value={s.value}
            trend={s.trend}
            trendUp={s.trendUp}
          />
        ))}
      </section>

      {/* Middle row */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Upcoming Events — Figma `10:876` */}
        <div className="flex flex-col rounded-xl border border-[#232330] bg-[#11111A] p-4 shadow-[0px_8px_24px_rgba(0,0,0,0.35)] lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[16px] font-semibold text-[#F5F5F7]">Upcoming Events</h2>
            <Link
              href="/event-wizard/event-basics"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-[#8B5CF6] hover:text-[#A855F7]"
            >
              View all events
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
            </Link>
          </div>
          <ul className="flex flex-col gap-2">
            {upcomingEvents.map((ev) => (
              <li key={ev.title}>
                <UpcomingEventRow {...ev} />
              </li>
            ))}
          </ul>
          <Link
            href="/event-wizard/event-basics"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-dashed border-[#8B5CF6]/50 bg-transparent py-2.5 text-[14px] font-medium text-[#8B5CF6] transition-colors hover:border-[#8B5CF6] hover:bg-[#8B5CF6]/5"
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            Create New Event
          </Link>
        </div>

        {/* Financial Overview */}
        <div className="flex flex-col rounded-xl border border-[#232330] bg-[#11111A] p-4 shadow-[0px_8px_24px_rgba(0,0,0,0.35)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[16px] font-semibold text-[#F5F5F7]">Financial Overview</h2>
            <label className="sr-only" htmlFor="fin-range">
              Range
            </label>
            <select
              id="fin-range"
              className="rounded-md border border-[#3F3F46] bg-[#0B0B10] px-2 py-1.5 text-[12px] text-[#E4E4E7] outline-none focus:border-[#8B5CF6]"
              defaultValue="month"
            >
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>
          <ul className="mt-4 space-y-2 text-[13px]">
            {financialRows.map((row) => (
              <li
                key={row.label}
                className="flex items-center justify-between gap-2 border-b border-[#232330] pb-2 last:border-0"
              >
                <span className="text-[#A1A1AA]">{row.label}</span>
                <span
                  className={`font-semibold tabular-nums ${row.highlight ? "text-emerald-400" : "text-[#F5F5F7]"}`}
                >
                  {row.value}
                </span>
              </li>
            ))}
          </ul>
          <FinancialSparkline />
        </div>
      </section>

      {/* Bottom widgets */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatusDonut />

        <div className="rounded-xl border border-[#232330] bg-[#11111A] p-4 shadow-[0px_8px_24px_rgba(0,0,0,0.35)]">
          <h3 className="text-[15px] font-semibold text-[#F5F5F7]">Top Venues</h3>
          <ul className="mt-4 space-y-3">
            {topVenues.map((v) => (
              <li key={v.name} className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-[#3F3F46] bg-[#18181F]">
                  <img src={v.thumb} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[#F5F5F7]">{v.name}</p>
                  <p className="text-[11px] text-[#A1A1AA]">{v.events} events</p>
                </div>
              </li>
            ))}
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
            {topArtists.map((a) => (
              <li key={a.name}>
                <Link
                  href="/artists"
                  className="flex items-center gap-3 rounded-lg transition-colors hover:bg-[#181824]"
                >
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#3F3F46] ring-2 ring-[#18181F]">
                  <img src={a.avatar} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[#F5F5F7]">{a.name}</p>
                  <p className="text-[11px] text-[#A1A1AA]">{a.events} bookings</p>
                </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Recent activity */}
      <section className="rounded-xl border border-[#232330] bg-[#11111A] p-4 shadow-[0px_8px_24px_rgba(0,0,0,0.35)]">
        <h3 className="text-[15px] font-semibold text-[#F5F5F7]">Recent Activity</h3>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {recentActivity.map((row, i) => (
            <li key={i} className="flex gap-3 rounded-lg bg-[#0B0B10]/80 p-3 ring-1 ring-[#232330]">
              <ActivityGlyph item={row.icon} />
              <div className="min-w-0">
                <p className="text-[12px] leading-4 text-[#E4E4E7]">{row.text}</p>
                <p className="mt-1 text-[11px] text-[#71717A]">{row.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
