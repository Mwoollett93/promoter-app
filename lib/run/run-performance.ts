import type { ManagedEventRecord } from "@/lib/data/events";
import { parseDateKey } from "@/lib/data/seasons";
import type { TimeframeBounds } from "@/lib/run/timeframe";

export type MonthPerformance = {
  monthKey: string;
  label: string;
  shortLabel: string;
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

export function eventsInTimeframe(events: ManagedEventRecord[], bounds: TimeframeBounds) {
  return events.filter((event) => {
    if (event.status === "canceled" || !event.dateKey) return false;
    return event.dateKey >= bounds.startDateKey && event.dateKey <= bounds.endDateKey;
  });
}

export function buildMonthPerformance(
  events: ManagedEventRecord[],
  bounds: TimeframeBounds,
): MonthPerformance[] {
  const inRange = eventsInTimeframe(events, bounds);
  const start = parseDateKey(bounds.startDateKey);
  const end = parseDateKey(bounds.endDateKey);
  if (!start || !end) return [];

  const buckets = new Map<string, MonthPerformance>();
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= endMonth) {
    const monthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(monthKey, {
      monthKey,
      label: `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`,
      shortLabel: MONTH_LABELS[cursor.getMonth()] ?? monthKey,
      eventCount: 0,
      revenue: 0,
      costs: 0,
      profit: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const event of inRange) {
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

export function timeframeRollup(events: ManagedEventRecord[], bounds: TimeframeBounds) {
  const inRange = eventsInTimeframe(events, bounds);
  return {
    eventCount: inRange.length,
    revenue: inRange.reduce((s, e) => s + e.expectedRevenue, 0),
    costs: inRange.reduce((s, e) => s + e.totalCosts, 0),
    profit: inRange.reduce((s, e) => s + e.projectedProfit, 0),
    events: inRange.sort((a, b) => (a.dateKey! < b.dateKey! ? -1 : 1)),
  };
}
