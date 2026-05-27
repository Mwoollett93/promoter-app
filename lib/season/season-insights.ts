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

  const belowBreakEven = seasonEvents.filter((e) => e.projectedProfit < 0).length;
  const highCostRatio = seasonEvents.filter(
    (e) => e.expectedRevenue > 0 && e.totalCosts / e.expectedRevenue > 0.85,
  ).length;
  const lineupGaps = seasonEvents.filter(
    (e) => e.artistCount < 1 || e.slotCount < 1,
  ).length;

  const alerts: SeasonAlert[] = [
    ...detectOverlaps(scheduled),
    ...(belowBreakEven > 0
      ? [
          {
            id: "below-be",
            tone: "danger" as const,
            title: `${belowBreakEven} event${belowBreakEven === 1 ? "" : "s"} below break-even`,
            detail: "Review fees and ticket inventory before announcing.",
          },
        ]
      : []),
    ...(highCostRatio > 0
      ? [
          {
            id: "margin",
            tone: "warning" as const,
            title: "Artist costs exceed margin target",
            detail: `${highCostRatio} show${highCostRatio === 1 ? "" : "s"} have costs above 85% of projected revenue.`,
          },
        ]
      : []),
    ...(lineupGaps > 0
      ? [
          {
            id: "lineup",
            tone: "info" as const,
            title: `${lineupGaps} lineup${lineupGaps === 1 ? "" : "s"} incomplete`,
            detail: "Finalize artists and slots on affected events.",
          },
        ]
      : []),
  ];

  if (alerts.length === 0) {
    alerts.push({
      id: "clear",
      tone: "info",
      title: "Season looks on track",
      detail: "No critical operational risks detected for this run.",
    });
  }

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
