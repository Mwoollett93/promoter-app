import type { ManagedEventRecord } from "@/lib/data/events";
import {
  buildMonthPerformance,
  eventsInTimeframe,
  timeframeRollup,
  type MonthPerformance,
} from "@/lib/run/run-performance";
import type { TimeframeBounds, TimeframeOption } from "@/lib/run/timeframe";

export type RunAlert = {
  id: string;
  tone: "danger" | "warning" | "info";
  title: string;
  detail: string;
  suggestedAction?: string;
  eventId?: string;
};

export type RunSnapshot = {
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
  shortLabel: string;
  eventCount: number;
  profit: number;
  events: ManagedEventRecord[];
};

export type RunInsights = {
  snapshot: RunSnapshot;
  months: MonthPerformance[];
  monthGroups: TimelineMonthGroup[];
  alerts: RunAlert[];
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function buildEventRiskAlerts(events: ManagedEventRecord[]): RunAlert[] {
  const alerts: RunAlert[] = [];

  for (const event of events) {
    if (event.projectedProfit >= 0) continue;
    const shortfall = Math.abs(event.projectedProfit);
    const ticketBump =
      event.ticketInventory > 0 ? Math.ceil(shortfall / event.ticketInventory) : 0;
    alerts.push({
      id: `be-${event.id}`,
      tone: "danger",
      title: `${event.name} below break-even`,
      detail: `Projected loss of ${formatCurrency(shortfall)}.`,
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
      detail: "Artists or slots are missing.",
      suggestedAction: "Open the workspace and finalize lineup before on-sale.",
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
      detail: "Costs are consuming most of projected revenue.",
      suggestedAction:
        excess > 0
          ? `Trim costs by ${formatCurrency(excess)} or raise forecast ticket revenue.`
          : "Review artist fees and venue hire in finance.",
      eventId: event.id,
    });
  }

  return alerts;
}

function detectOverlaps(events: ManagedEventRecord[]): RunAlert[] {
  const byDate = new Map<string, ManagedEventRecord[]>();
  for (const event of events) {
    if (!event.dateKey) continue;
    const list = byDate.get(event.dateKey) ?? [];
    list.push(event);
    byDate.set(event.dateKey, list);
  }

  const alerts: RunAlert[] = [];
  for (const [date, list] of byDate) {
    if (list.length < 2) continue;
    alerts.push({
      id: `overlap-${date}`,
      tone: "warning",
      title: "Operational overlap",
      detail: `${list.length} shows on ${date}.`,
      suggestedAction: "Stagger load-in times or reassign crew across shows.",
    });
  }
  return alerts;
}

export function buildRunInsights(
  events: ManagedEventRecord[],
  timeframe: TimeframeOption,
): RunInsights {
  const bounds: TimeframeBounds = timeframe.bounds;
  const rollup = timeframeRollup(events, bounds);
  const months = buildMonthPerformance(events, bounds);
  const inRange = eventsInTimeframe(events, bounds);

  const monthGroups: TimelineMonthGroup[] = months.map((m) => ({
    monthKey: m.monthKey,
    label: m.label,
    shortLabel: m.shortLabel,
    eventCount: m.eventCount,
    profit: m.profit,
    events: inRange
      .filter((e) => e.dateKey?.startsWith(m.monthKey))
      .sort((a, b) => (a.dateKey! < b.dateKey! ? -1 : 1)),
  }));

  const totalAttendance = inRange.reduce((s, e) => s + e.ticketInventory, 0);
  const avgCapacity =
    inRange.length > 0 ? Math.round(totalAttendance / inRange.length) : 0;
  const profitMarginPct =
    rollup.revenue > 0 ? Math.round((rollup.profit / rollup.revenue) * 100) : 0;
  const avgBreakEven =
    inRange.length > 0
      ? Math.round(inRange.reduce((s, e) => s + e.totalCosts, 0) / inRange.length)
      : 0;

  const alerts: RunAlert[] = [
    ...buildEventRiskAlerts(inRange),
    ...detectOverlaps(inRange),
  ];

  if (alerts.length === 0) {
    alerts.push({
      id: "clear",
      tone: "info",
      title: "Run looks on track",
      detail: "No critical risks in this timeframe.",
      suggestedAction: "Monitor ticket sell-through as shows approach.",
    });
  }

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
    alerts,
  };
}
