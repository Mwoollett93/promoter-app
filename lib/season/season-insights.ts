import type { ManagedEventRecord } from "@/lib/data/events";
import {
  buildSeasonMonthPerformance,
  seasonRollup,
  type MonthPerformance,
} from "@/lib/data/season-performance";
import { parseDateKey, type SeasonRecord } from "@/lib/data/seasons";

export type SeasonAlert = {
  id: string;
  tone: "danger" | "warning" | "info";
  title: string;
  detail: string;
  suggestedAction?: string;
  eventId?: string;
};

export type TrendMonthPoint = {
  monthKey: string;
  label: string;
  shortLabel: string;
  profit: number;
  eventCount: number;
};

export type SeasonSnapshot = {
  projectedProfit: number;
  totalRevenue: number;
  totalCosts: number;
  totalShows: number;
  projectedAttendance: number;
  avgCapacity: number;
  profitMarginPct: number;
  avgBreakEven: number;
};

export type TimelineMonthGroup = {
  monthKey: string;
  label: string;
  eventCount: number;
  profit: number;
  events: ManagedEventRecord[];
};

export type SeasonInsights = {
  snapshot: SeasonSnapshot;
  months: MonthPerformance[];
  monthGroups: TimelineMonthGroup[];
  unscheduled: ManagedEventRecord[];
  alerts: SeasonAlert[];
  trendValues: number[];
  trendMonths: TrendMonthPoint[];
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function monthLabel(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return monthKey;
  return `${MONTH_NAMES[m - 1] ?? monthKey} ${y}`;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function buildEventRiskAlerts(events: ManagedEventRecord[]): SeasonAlert[] {
  const alerts: SeasonAlert[] = [];

  for (const event of events) {
    if (event.projectedProfit >= 0) continue;
    const shortfall = Math.abs(event.projectedProfit);
    const ticketBump =
      event.ticketInventory > 0 ? Math.ceil(shortfall / event.ticketInventory) : 0;
    alerts.push({
      id: `be-${event.id}`,
      tone: "danger",
      title: `${event.name} below break-even`,
      detail: `Projected loss of ${formatCurrency(shortfall)} on current forecast.`,
      suggestedAction:
        ticketBump > 0
          ? `Increase ticket price by $${ticketBump} or reduce costs by ${formatCurrency(shortfall)}.`
          : `Reduce costs by ${formatCurrency(shortfall)} or add ticket inventory.`,
      eventId: event.id,
    });
  }

  for (const event of events) {
    if (event.artistCount >= 1 && event.slotCount >= 1) continue;
    alerts.push({
      id: `lineup-${event.id}`,
      tone: "warning",
      title: `${event.name} — lineup incomplete`,
      detail: "Artists or slots are missing from the running order.",
      suggestedAction: "Open the event workspace and finalize lineup before on-sale.",
      eventId: event.id,
    });
  }

  for (const event of events) {
    if (event.expectedRevenue <= 0 || event.totalCosts / event.expectedRevenue <= 0.85) continue;
    const excess = Math.round(event.totalCosts - event.expectedRevenue * 0.75);
    alerts.push({
      id: `margin-${event.id}`,
      tone: "warning",
      title: `${event.name} — margin under pressure`,
      detail: "Artist and venue costs are consuming most of projected revenue.",
      suggestedAction:
        excess > 0
          ? `Trim costs by ${formatCurrency(excess)} or raise forecast ticket revenue.`
          : "Review artist fees and venue hire in finance.",
      eventId: event.id,
    });
  }

  return alerts.slice(0, 6);
}

function detectOverlaps(events: ManagedEventRecord[]): SeasonAlert[] {
  const byDate = new Map<string, ManagedEventRecord[]>();
  for (const event of events) {
    if (!event.dateKey) continue;
    const list = byDate.get(event.dateKey) ?? [];
    list.push(event);
    byDate.set(event.dateKey, list);
  }

  const alerts: SeasonAlert[] = [];
  for (const [date, list] of byDate) {
    if (list.length < 2) continue;
    alerts.push({
      id: `overlap-${date}`,
      tone: "warning",
      title: "Operational overlap detected",
      detail: `${list.length} shows on ${date} — ${list.map((e) => e.name).join(", ")}`,
      suggestedAction: "Stagger load-in times or reassign crew across shows.",
    });
  }
  return alerts;
}

export function buildSeasonInsights(
  events: ManagedEventRecord[],
  season: SeasonRecord,
): SeasonInsights {
  const rollup = seasonRollup(events, season);
  const seasonEvents = rollup.events;
  const months = buildSeasonMonthPerformance(events, season);

  const scheduled = seasonEvents.filter((e) => e.dateKey);
  const unscheduled = seasonEvents.filter((e) => !e.dateKey);

  const monthGroups: TimelineMonthGroup[] = months.map((m) => ({
    monthKey: m.monthKey,
    label: monthLabel(m.monthKey),
    eventCount: m.eventCount,
    profit: m.profit,
    events: scheduled
      .filter((e) => e.dateKey?.startsWith(m.monthKey))
      .sort((a, b) => (a.dateKey! < b.dateKey! ? -1 : 1)),
  }));

  const totalAttendance = seasonEvents.reduce((s, e) => s + e.ticketInventory, 0);
  const avgCapacity =
    seasonEvents.length > 0
      ? Math.round(totalAttendance / seasonEvents.length)
      : 0;
  const profitMarginPct =
    rollup.revenue > 0 ? Math.round((rollup.profit / rollup.revenue) * 100) : 0;
  const avgBreakEven =
    seasonEvents.length > 0
      ? Math.round(
          seasonEvents.reduce((s, e) => s + e.totalCosts, 0) / seasonEvents.length,
        )
      : 0;

  const alerts: SeasonAlert[] = [
    ...buildEventRiskAlerts(seasonEvents),
    ...detectOverlaps(scheduled),
  ].slice(0, 8);

  if (alerts.length === 0) {
    alerts.push({
      id: "clear",
      tone: "info",
      title: "Season looks on track",
      detail: "No critical operational risks detected for this run.",
      suggestedAction: "Keep monitoring ticket sell-through as shows approach.",
    });
  }

  const trendMonths: TrendMonthPoint[] = months.map((m) => ({
    monthKey: m.monthKey,
    label: monthLabel(m.monthKey),
    shortLabel: m.label.split(" ")[0] ?? m.label,
    profit: m.profit,
    eventCount: m.eventCount,
  }));

  const trendValues = months.map((m) => m.profit);

  return {
    snapshot: {
      projectedProfit: rollup.profit,
      totalRevenue: rollup.revenue,
      totalCosts: rollup.costs,
      totalShows: rollup.eventCount,
      projectedAttendance: totalAttendance,
      avgCapacity,
      profitMarginPct,
      avgBreakEven,
    },
    months,
    monthGroups,
    unscheduled,
    alerts,
    trendValues,
    trendMonths,
  };
}

export function formatSeasonDateRange(season: SeasonRecord) {
  const start = parseDateKey(season.startDateKey);
  const end = parseDateKey(season.endDateKey);
  if (!start || !end) return `${season.startDateKey} → ${season.endDateKey}`;
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}
