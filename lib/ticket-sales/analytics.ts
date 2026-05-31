import { buildFinanceDraft, calculateFinanceSummary } from "@/lib/data/wizard-finance-logic";
import type { WizardFinanceDraftV1 } from "@/lib/data/wizard-finance-draft";
import type { WorkspaceEvent } from "@/lib/types/collaboration";

import type {
  BreakEvenMetrics,
  SalesChartSeries,
  SalesCheckpoint,
  SalesMetrics,
  SalesSource,
  SalesSourceType,
  TicketSalesSnapshot,
  TicketTier,
} from "./types";

function parseFinanceDraft(raw: Record<string, unknown>): WizardFinanceDraftV1 | null {
  if (
    typeof raw.ticketInventory !== "number" ||
    !Array.isArray(raw.costs) ||
    !Array.isArray(raw.tiers)
  ) {
    return null;
  }
  return {
    v: 1,
    ticketInventory: Math.max(0, Math.round(raw.ticketInventory)),
    costs: raw.costs as WizardFinanceDraftV1["costs"],
    tiers: raw.tiers as WizardFinanceDraftV1["tiers"],
  };
}

export function getEventTotalCosts(event: WorkspaceEvent): number {
  const draft = parseFinanceDraft(event.financeJson ?? {});
  if (draft) {
    const summary = calculateFinanceSummary(draft, { artistFees: 0, venueFee: 0 });
    return summary.totalCosts;
  }
  return Math.max(0, event.totalCosts);
}

export function getEventCapacity(event: WorkspaceEvent, fallback = 0): number {
  const draft = parseFinanceDraft(event.financeJson ?? {});
  if (draft?.ticketInventory) return draft.ticketInventory;
  if (event.ticketInventory > 0) return event.ticketInventory;
  return fallback;
}

function latestCheckpoint(checkpoints: SalesCheckpoint[]): SalesCheckpoint | null {
  if (checkpoints.length === 0) return null;
  return checkpoints[checkpoints.length - 1];
}

function daysBetween(a: Date, b: Date) {
  return Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

function dateKey(iso: string) {
  return iso.slice(0, 10);
}

export function computeSalesMetrics(
  snapshot: TicketSalesSnapshot,
  event: WorkspaceEvent,
): SalesMetrics {
  const latest = latestCheckpoint(snapshot.checkpoints);
  const lastImport = snapshot.imports[snapshot.imports.length - 1];

  const ticketsSold = latest?.ticketsSold ?? lastImport?.totalTickets ?? 0;
  const capacity = latest?.capacity || getEventCapacity(event, lastImport?.totalTickets ?? 0);
  const grossRevenue = latest?.grossRevenue ?? lastImport?.grossRevenue ?? 0;
  const netRevenue = latest?.netRevenue ?? lastImport?.netRevenue ?? 0;
  const fees = latest?.fees ?? lastImport?.fees ?? 0;

  let salesVelocity: number | null = null;
  if (snapshot.checkpoints.length >= 2) {
    const prev = snapshot.checkpoints[snapshot.checkpoints.length - 2];
    const curr = snapshot.checkpoints[snapshot.checkpoints.length - 1];
    const deltaTickets = curr.ticketsSold - prev.ticketsSold;
    const deltaDays = daysBetween(new Date(prev.checkedAt), new Date(curr.checkedAt));
    if (deltaDays > 0) salesVelocity = Math.round((deltaTickets / deltaDays) * 10) / 10;
  }

  let forecastFinalAttendance: number | null = null;
  if (salesVelocity != null && event.dateKey) {
    const eventDate = new Date(event.dateKey);
    const now = new Date();
    const daysLeft = Math.max(0, (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    forecastFinalAttendance = Math.min(
      capacity,
      Math.round(ticketsSold + salesVelocity * daysLeft),
    );
  }

  return {
    ticketsSold,
    capacity,
    capacityPct: capacity > 0 ? Math.round((ticketsSold / capacity) * 1000) / 10 : 0,
    grossRevenue,
    netRevenue,
    fees,
    salesVelocity,
    forecastFinalAttendance,
  };
}

export function computeBreakEvenMetrics(
  metrics: SalesMetrics,
  event: WorkspaceEvent,
): BreakEvenMetrics {
  const totalCosts = getEventTotalCosts(event);
  const netRevenue = metrics.netRevenue;
  const amountRemaining = Math.max(0, totalCosts - netRevenue);
  const percentToBreakEven =
    totalCosts > 0 ? Math.min(100, Math.round((netRevenue / totalCosts) * 1000) / 10) : 0;

  const averageTicketPrice =
    metrics.ticketsSold > 0
      ? Math.round((metrics.netRevenue / metrics.ticketsSold) * 100) / 100
      : 0;

  const ticketsRequiredRemaining =
    averageTicketPrice > 0 ? Math.ceil(amountRemaining / averageTicketPrice) : 0;

  return {
    totalCosts,
    netRevenue,
    amountRemaining,
    percentToBreakEven,
    averageTicketPrice,
    ticketsRequiredRemaining,
    isBreakEven: totalCosts > 0 && netRevenue >= totalCosts,
  };
}

export function buildChartSeries(snapshot: TicketSalesSnapshot): SalesChartSeries {
  const ticketsOverTime = snapshot.checkpoints.map((cp) => ({
    at: cp.checkedAt,
    value: cp.ticketsSold,
  }));

  const revenueOverTime = snapshot.checkpoints.map((cp) => ({
    at: cp.checkedAt,
    gross: cp.grossRevenue,
    net: cp.netRevenue,
  }));

  const dailyMap = new Map<string, number>();
  for (let i = 1; i < snapshot.checkpoints.length; i += 1) {
    const prev = snapshot.checkpoints[i - 1];
    const curr = snapshot.checkpoints[i];
    const key = dateKey(curr.checkedAt);
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + (curr.ticketsSold - prev.ticketsSold));
  }

  const dailyVelocity = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, tickets]) => ({ date, tickets }));

  const tierBreakdown =
    snapshot.tiers.length > 0
      ? snapshot.tiers.map((tier) => ({
          name: tier.name,
          sold: tier.sold,
          revenue: tier.revenue,
        }))
      : aggregateTiersFromImports(snapshot);

  return { ticketsOverTime, revenueOverTime, dailyVelocity, tierBreakdown };
}

function aggregateTiersFromImports(snapshot: TicketSalesSnapshot) {
  const tiers = new Map<string, { sold: number; revenue: number }>();
  for (const tier of snapshot.tiers) {
    tiers.set(tier.name, { sold: tier.sold, revenue: tier.revenue });
  }
  return [...tiers.entries()].map(([name, data]) => ({ name, ...data }));
}

export function resolveSourceStatuses(snapshot: TicketSalesSnapshot): Array<{
  sourceType: SalesSourceType;
  active: boolean;
  provider?: string;
}> {
  const types: SalesSourceType[] = ["manual", "csv", "api", "email"];
  return types.map((sourceType) => {
    const matches = snapshot.sources.filter((s) => s.sourceType === sourceType);
    const active = matches.some((s) => s.status === "active" || s.status === "connected");
    return { sourceType, active };
  });
}

export function hasSalesData(snapshot: TicketSalesSnapshot) {
  return (
    snapshot.checkpoints.length > 0 ||
    snapshot.imports.length > 0 ||
    snapshot.tiers.length > 0
  );
}

export function mergeTierUpdates(
  existing: TicketTier[],
  incoming: TicketTier[],
): TicketTier[] {
  const map = new Map(existing.map((tier) => [tier.name.toLowerCase(), tier]));
  for (const tier of incoming) {
    map.set(tier.name.toLowerCase(), tier);
  }
  return [...map.values()];
}

export function sourceLabel(source: SalesSource) {
  return source.label ?? source.provider.toUpperCase();
}
