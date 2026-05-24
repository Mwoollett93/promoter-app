import type { UpcomingEventRowProps } from "@/app/components/dashboard/UpcomingEventRow";
import type { EventStatus } from "@/app/components/ui/EventStatusBadge";
import type { ManagedEventRecord, ManagedEventStatus } from "@/lib/data/events";
import {
  formatCurrency,
  formatDateLabel,
  formatRelativeEventDate,
  formatTimeLabel,
} from "@/lib/data/format";
import type { PreferencesState } from "@/lib/settings/settings";
import type { ArtistProfile } from "@/lib/types/artist";
import {
  buildVenueImageLookup,
  resolveVenueImage,
  type VenueSummary,
} from "@/lib/supabase/venue-summaries";

export type DashboardStat = {
  label: string;
  value: string;
  currencyAmount?: number;
  trend: string;
  trendUp: boolean;
};

export type FinancialRow = {
  label: string;
  value: string;
  currencyAmount?: number;
  highlight?: boolean;
};

export type StatusSlice = { status: EventStatus; pct: number; count: number };

export type TopVenueRow = { name: string; events: number; thumb?: string };

export type TopArtistRow = { name: string; events: number; avatar?: string };

export type DashboardSnapshot = {
  stats: DashboardStat[];
  upcomingEvents: UpcomingEventRowProps[];
  financialRows: FinancialRow[];
  eventStatusDistribution: StatusSlice[];
  topVenues: TopVenueRow[];
  topArtists: TopArtistRow[];
  sparklineValues: number[];
};

function toBadgeStatus(status: ManagedEventStatus): EventStatus {
  return status;
}

function parseDateKey(dateKey?: string) {
  if (!dateKey) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function isUpcoming(event: ManagedEventRecord) {
  if (event.status === "canceled" || event.status === "completed") return false;
  if (!event.dateKey) return event.status === "draft" || event.status === "active";

  const date = parseDateKey(event.dateKey);
  if (!date) return event.status === "draft" || event.status === "active";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date.getTime() >= today.getTime();
}

function shortVenueName(venueName: string) {
  return venueName.split(",")[0]?.trim() || venueName;
}

function trendLabel(current: number, previous: number, suffix: string) {
  const delta = current - previous;
  if (delta === 0) return `— flat ${suffix}`;
  const up = delta > 0;
  return `${up ? "↑" : "↓"} ${Math.abs(delta)} ${suffix}`;
}

function eventsInRange(events: ManagedEventRecord[], start: Date, end: Date) {
  return events.filter((event) => {
    const created = Date.parse(event.createdAt);
    return Number.isFinite(created) && created >= start.getTime() && created < end.getTime();
  });
}

function buildStats(events: ManagedEventRecord[], prefs?: PreferencesState): DashboardStat[] {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisMonth = eventsInRange(events, monthStart, now);
  const lastMonth = eventsInRange(events, prevMonthStart, monthStart);

  const upcoming = events.filter(isUpcoming);
  const confirmed = events.filter((event) => event.status === "active");
  const portfolio = events.filter((event) => event.status !== "canceled");

  const projectedProfit = portfolio.reduce((sum, event) => sum + event.projectedProfit, 0);
  const totalRevenue = portfolio.reduce((sum, event) => sum + event.expectedRevenue, 0);

  const upcomingThisMonth = thisMonth.filter(isUpcoming).length;
  const upcomingLastMonth = lastMonth.filter(isUpcoming).length;
  const confirmedThisMonth = thisMonth.filter((event) => event.status === "active").length;
  const confirmedLastMonth = lastMonth.filter((event) => event.status === "active").length;

  const profitThisMonth = thisMonth.reduce((sum, event) => sum + event.projectedProfit, 0);
  const profitLastMonth = lastMonth.reduce((sum, event) => sum + event.projectedProfit, 0);

  const revenueThisMonth = thisMonth.reduce((sum, event) => sum + event.expectedRevenue, 0);
  const revenueLastMonth = lastMonth.reduce((sum, event) => sum + event.expectedRevenue, 0);

  return [
    {
      label: "Upcoming Events",
      value: String(upcoming.length),
      trend: trendLabel(upcomingThisMonth, upcomingLastMonth, "vs last month"),
      trendUp: upcomingThisMonth >= upcomingLastMonth,
    },
    {
      label: "Confirmed Events",
      value: String(confirmed.length),
      trend: trendLabel(confirmedThisMonth, confirmedLastMonth, "vs last month"),
      trendUp: confirmedThisMonth >= confirmedLastMonth,
    },
    {
      label: "Projected Profit",
      value: formatCurrency(projectedProfit, prefs),
      currencyAmount: projectedProfit,
      trend: trendLabel(profitThisMonth, profitLastMonth, "vs last month"),
      trendUp: profitThisMonth >= profitLastMonth,
    },
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue, prefs),
      currencyAmount: totalRevenue,
      trend: trendLabel(revenueThisMonth, revenueLastMonth, "vs last month"),
      trendUp: revenueThisMonth >= revenueLastMonth,
    },
  ];
}

function buildUpcoming(
  events: ManagedEventRecord[],
  venueLookup: ReturnType<typeof buildVenueImageLookup>,
): UpcomingEventRowProps[] {
  return events
    .filter(isUpcoming)
    .sort((a, b) => {
      const aDate = parseDateKey(a.dateKey)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bDate = parseDateKey(b.dateKey)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      if (aDate !== bDate) return aDate - bDate;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 5)
    .map((event) => ({
      href: `/events/${event.id}/workspace`,
      title: event.name,
      venueLabel: event.venueName,
      timeRangeLabel: event.startTime ? formatTimeLabel(event.startTime) : "Time TBD",
      status: toBadgeStatus(event.status),
      dateLabel: formatDateLabel(event.dateKey),
      relativeLabel: formatRelativeEventDate(event.dateKey),
      imageSrc: resolveVenueImage(event, venueLookup),
    }));
}

export type DashboardFinanceScope = "portfolio" | "active";

function eventsForFinanceScope(events: ManagedEventRecord[], scope: DashboardFinanceScope) {
  if (scope === "active") {
    return events.filter((event) => event.status === "active");
  }
  return events.filter((event) => event.status !== "canceled");
}

function buildFinancialRows(
  events: ManagedEventRecord[],
  prefs?: PreferencesState,
  scope: DashboardFinanceScope = "portfolio",
): FinancialRow[] {
  const portfolio = eventsForFinanceScope(events, scope);
  const totalRevenue = portfolio.reduce((sum, event) => sum + event.expectedRevenue, 0);
  const totalCosts = portfolio.reduce((sum, event) => sum + event.totalCosts, 0);
  const projectedProfit = portfolio.reduce((sum, event) => sum + event.projectedProfit, 0);
  const breakEven = portfolio.reduce((sum, event) => {
    if (event.expectedRevenue <= 0) return sum;
    return sum + event.totalCosts;
  }, 0);

  return [
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue, prefs),
      currencyAmount: totalRevenue,
    },
    {
      label: "Total Costs",
      value: formatCurrency(totalCosts, prefs),
      currencyAmount: totalCosts,
    },
    {
      label: "Projected Profit",
      value: formatCurrency(projectedProfit, prefs),
      currencyAmount: projectedProfit,
      highlight: true,
    },
    {
      label: "Break-even Point",
      value: formatCurrency(breakEven, prefs),
      currencyAmount: breakEven,
    },
  ];
}

function buildStatusDistribution(events: ManagedEventRecord[]): StatusSlice[] {
  const statuses: ManagedEventStatus[] = ["active", "draft", "canceled", "completed"];
  const total = events.length || 1;

  return statuses
    .map((status) => {
      const count = events.filter((event) => event.status === status).length;
      return {
        status: toBadgeStatus(status),
        count,
        pct: Math.round((count / total) * 100),
      };
    })
    .filter((slice) => slice.count > 0);
}

function buildTopVenues(
  events: ManagedEventRecord[],
  venueLookup: ReturnType<typeof buildVenueImageLookup>,
): TopVenueRow[] {
  const counts = new Map<string, { count: number; sample: ManagedEventRecord }>();

  for (const event of events) {
    if (event.status === "canceled") continue;
    const name = shortVenueName(event.venueName);
    const existing = counts.get(name);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(name, { count: 1, sample: event });
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([name, { count, sample }]) => ({
      name,
      events: count,
      thumb: resolveVenueImage(sample, venueLookup),
    }));
}

function buildTopArtists(events: ManagedEventRecord[], artists: ArtistProfile[]): TopArtistRow[] {
  const activeShows = events.filter((event) => event.status === "active").length;

  if (artists.length > 0) {
    return [...artists]
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, 3)
      .map((artist, index) => ({
        name: artist.name,
        events: index === 0 ? Math.max(activeShows, artist.tags.length) : artist.tags.length,
        avatar: artist.promoImageUrl,
      }));
  }

  const fallback = events
    .filter((event) => event.artistCount > 0)
    .slice(0, 3)
    .map((event) => ({
      name: `${event.artistCount} artists · ${event.name}`,
      events: event.artistCount,
    }));

  return fallback;
}

function buildSparkline(events: ManagedEventRecord[]): number[] {
  const buckets = new Map<string, number>();

  for (const event of events) {
    if (event.status === "canceled" || !event.dateKey) continue;
    const monthKey = event.dateKey.slice(0, 7);
    buckets.set(monthKey, (buckets.get(monthKey) ?? 0) + event.expectedRevenue);
  }

  const sorted = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b));
  const values = sorted.map(([, value]) => value);

  if (values.length >= 2) return values;
  if (values.length === 1) return [values[0] * 0.7, values[0]];

  const fallback = events
    .filter((event) => event.status !== "canceled")
    .map((event) => event.expectedRevenue);
  return fallback.length > 0 ? fallback : [0, 0];
}

export function buildDashboardSnapshot(input: {
  events: ManagedEventRecord[];
  artists?: ArtistProfile[];
  venues?: VenueSummary[];
  preferences?: PreferencesState;
  financeScope?: DashboardFinanceScope;
}): DashboardSnapshot {
  const events = input.events;
  const artists = input.artists ?? [];
  const prefs = input.preferences;
  const financeScope = input.financeScope ?? "portfolio";
  const venueLookup = buildVenueImageLookup(input.venues ?? []);

  return {
    stats: buildStats(events, prefs),
    upcomingEvents: buildUpcoming(events, venueLookup),
    financialRows: buildFinancialRows(events, prefs, financeScope),
    eventStatusDistribution: buildStatusDistribution(events),
    topVenues: buildTopVenues(events, venueLookup),
    topArtists: buildTopArtists(events, artists),
    sparklineValues: buildSparkline(events),
  };
}
