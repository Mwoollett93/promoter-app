import type { ManagedEventRecord } from "@/lib/data/events";
import { parseDateKey, type SeasonRecord } from "@/lib/data/seasons";

export type MonthPerformance = {
  monthKey: string;
  label: string;
  eventCount: number;
  revenue: number;
  costs: number;
  profit: number;
};

export type QuarterPerformance = {
  quarter: 1 | 2 | 3 | 4;
  year: number;
  label: string;
  eventCount: number;
  revenue: number;
  costs: number;
  profit: number;
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function eventsInSeason(events: ManagedEventRecord[], season: SeasonRecord) {
  return events.filter((event) => {
    if (event.status === "canceled") return false;
    if (event.seasonId === season.id) return true;
    if (!event.dateKey) return false;
    return event.dateKey >= season.startDateKey && event.dateKey <= season.endDateKey;
  });
}

export function buildSeasonMonthPerformance(
  events: ManagedEventRecord[],
  season: SeasonRecord,
): MonthPerformance[] {
  const seasonEvents = eventsInSeason(events, season);
  const start = parseDateKey(season.startDateKey);
  const end = parseDateKey(season.endDateKey);
  if (!start || !end) return [];

  const buckets = new Map<string, MonthPerformance>();
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= endMonth) {
    const monthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(monthKey, {
      monthKey,
      label: `${MONTH_LABELS[cursor.getMonth()]} ${cursor.getFullYear()}`,
      eventCount: 0,
      revenue: 0,
      costs: 0,
      profit: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const event of seasonEvents) {
    if (!event.dateKey) continue;
    const monthKey = event.dateKey.slice(0, 7);
    const bucket = buckets.get(monthKey);
    if (!bucket) continue;
    bucket.eventCount += 1;
    bucket.revenue += event.expectedRevenue;
    bucket.costs += event.totalCosts;
    bucket.profit += event.projectedProfit;
  }

  return [...buckets.values()];
}

export function buildQuarterlyPerformance(
  events: ManagedEventRecord[],
  year: number,
): QuarterPerformance[] {
  const quarters: QuarterPerformance[] = [];
  for (let q = 1 as 1 | 2 | 3 | 4; q <= 4; q++) {
    const startMonth = (q - 1) * 3;
    const startKey = `${year}-${String(startMonth + 1).padStart(2, "0")}-01`;
    const endMonth = startMonth + 2;
    const endDay = new Date(year, endMonth + 1, 0).getDate();
    const endKey = `${year}-${String(endMonth + 1).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;

    const quarterEvents = events.filter((event) => {
      if (event.status === "canceled" || !event.dateKey) return false;
      return event.dateKey >= startKey && event.dateKey <= endKey;
    });

    quarters.push({
      quarter: q,
      year,
      label: `Q${q} ${year}`,
      eventCount: quarterEvents.length,
      revenue: quarterEvents.reduce((s, e) => s + e.expectedRevenue, 0),
      costs: quarterEvents.reduce((s, e) => s + e.totalCosts, 0),
      profit: quarterEvents.reduce((s, e) => s + e.projectedProfit, 0),
    });
  }
  return quarters;
}

export function seasonRollup(events: ManagedEventRecord[], season: SeasonRecord) {
  const seasonEvents = eventsInSeason(events, season);
  return {
    eventCount: seasonEvents.length,
    revenue: seasonEvents.reduce((s, e) => s + e.expectedRevenue, 0),
    costs: seasonEvents.reduce((s, e) => s + e.totalCosts, 0),
    profit: seasonEvents.reduce((s, e) => s + e.projectedProfit, 0),
    events: seasonEvents,
  };
}
