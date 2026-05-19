import type { WizardFinanceCostItemV1, WizardFinanceDraftV1, WizardFinanceTierV1 } from "./wizard-finance-draft";

export type RiskLevel = "Low Risk" | "Medium Risk" | "High Risk";

export type FinanceRisk = {
  label: RiskLevel;
  tone: string;
  copy: string;
};

export type FinanceTierRow = WizardFinanceTierV1 & {
  allocationPct: number;
  expectedSold: number;
  expectedRevenue: number;
  potentialRevenue: number;
};

export type FinanceSummary = {
  tierRows: FinanceTierRow[];
  totalAllocatedTickets: number;
  allocationCoveragePct: number;
  inventoryBalanced: boolean;
  totalExpectedSold: number;
  expectedSellThroughPct: number;
  potentialRevenue: number;
  expectedRevenue: number;
  artistFees: number;
  venueFee: number;
  additionalCostsTotal: number;
  totalCosts: number;
  projectedProfit: number;
  averageTicketPrice: number;
  breakEvenTickets: number;
  risk: FinanceRisk;
};

type DefaultTierBlueprint = {
  id: string;
  name: string;
  price: number;
  allocationSharePct: number;
  sellThroughPct: number;
};

type BuildFinanceDraftParams = {
  stored: WizardFinanceDraftV1 | null;
  venueCapacity?: number;
};

const DEFAULT_TICKET_INVENTORY = 800;

const DEFAULT_TIER_BLUEPRINTS: DefaultTierBlueprint[] = [
  { id: "early-bird", name: "Early Bird", price: 20, allocationSharePct: 15, sellThroughPct: 100 },
  { id: "first-release", name: "First Release", price: 25, allocationSharePct: 25, sellThroughPct: 85 },
  { id: "second-release", name: "Second Release", price: 30, allocationSharePct: 25, sellThroughPct: 70 },
  { id: "final-release", name: "Final Release", price: 35, allocationSharePct: 20, sellThroughPct: 55 },
  { id: "door-sales", name: "Door Sales", price: 40, allocationSharePct: 15, sellThroughPct: 35 },
];

function sanitizeNumber(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value * 100) / 100);
}

function sanitizeWholeNumber(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

export function clampInventoryToVenueCapacity(ticketInventory: number, venueCapacity?: number) {
  const sanitizedInventory = sanitizeWholeNumber(ticketInventory);
  if (!venueCapacity || venueCapacity <= 0) return sanitizedInventory;
  return Math.min(sanitizedInventory, sanitizeWholeNumber(venueCapacity));
}

function allocateQuantities(total: number, blueprints: DefaultTierBlueprint[]) {
  const sanitizedTotal = sanitizeWholeNumber(total);
  if (sanitizedTotal <= 0) return blueprints.map(() => 0);

  const rawAllocations = blueprints.map((tier) => (sanitizedTotal * tier.allocationSharePct) / 100);
  const wholeAllocations = rawAllocations.map((value) => Math.floor(value));
  let remaining = sanitizedTotal - wholeAllocations.reduce((sum, value) => sum + value, 0);

  const rankedRemainders = rawAllocations
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);

  for (let index = 0; index < rankedRemainders.length && remaining > 0; index += 1) {
    wholeAllocations[rankedRemainders[index].index] += 1;
    remaining -= 1;
  }

  return wholeAllocations;
}

export function buildDefaultTiers(ticketInventory: number): WizardFinanceTierV1[] {
  const allocations = allocateQuantities(ticketInventory, DEFAULT_TIER_BLUEPRINTS);

  return DEFAULT_TIER_BLUEPRINTS.map((tier, index) => ({
    id: tier.id,
    name: tier.name,
    price: tier.price,
    allocationQty: allocations[index] ?? 0,
    sellThroughPct: tier.sellThroughPct,
  }));
}

export function clampTierAllocationsToInventory(
  tiers: WizardFinanceTierV1[],
  ticketInventory: number
): WizardFinanceTierV1[] {
  let remaining = sanitizeWholeNumber(ticketInventory);

  return tiers.map((tier) => {
    const nextAllocation = Math.min(sanitizeWholeNumber(tier.allocationQty), remaining);
    remaining = Math.max(0, remaining - nextAllocation);

    return {
      ...tier,
      allocationQty: nextAllocation,
    };
  });
}

export function buildFinanceDraft(params: BuildFinanceDraftParams): WizardFinanceDraftV1 {
  const requestedInventory =
    params.stored?.ticketInventory && params.stored.ticketInventory > 0
      ? sanitizeWholeNumber(params.stored.ticketInventory)
      : params.venueCapacity && params.venueCapacity > 0
        ? sanitizeWholeNumber(params.venueCapacity)
        : DEFAULT_TICKET_INVENTORY;
  const ticketInventory = clampInventoryToVenueCapacity(requestedInventory, params.venueCapacity);
  const storedCosts = (params.stored?.costs ?? [])
    .filter((cost) => cost.id !== "venue-hire")
    .map((cost) => ({
      ...cost,
      amount: sanitizeNumber(cost.amount),
    }));
  const initialTiers =
    params.stored?.tiers && params.stored.tiers.length > 0
      ? params.stored.tiers.map((tier) => ({
          ...tier,
          price: sanitizeNumber(tier.price),
          allocationQty: sanitizeWholeNumber(tier.allocationQty),
          sellThroughPct: sanitizeNumber(tier.sellThroughPct),
        }))
      : buildDefaultTiers(ticketInventory);

  return {
    v: 1,
    ticketInventory,
    costs: storedCosts,
    tiers: clampTierAllocationsToInventory(initialTiers, ticketInventory),
  };
}

export function getRiskLevel(params: {
  inventoryBalanced: boolean;
  projectedProfit: number;
  breakEvenTickets: number;
  totalExpectedSold: number;
  totalCosts: number;
}): FinanceRisk {
  const { inventoryBalanced, projectedProfit, breakEvenTickets, totalExpectedSold, totalCosts } = params;

  if (!inventoryBalanced || projectedProfit < 0 || totalExpectedSold < breakEvenTickets) {
    return {
      label: "High Risk",
      tone: "border-[#7F1D1D] bg-[#2B0F14] text-[#FCA5A5]",
      copy: "Expected sales are still below the level needed to safely cover your current spend.",
    };
  }

  if (projectedProfit < totalCosts * 0.1 || totalExpectedSold <= Math.ceil(breakEvenTickets * 1.1)) {
    return {
      label: "Medium Risk",
      tone: "border-[#854D0E] bg-[#2A1E0A] text-[#FCD34D]",
      copy: "You are projected to be profitable, but the margin is tight enough that later-tier sales matter.",
    };
  }

  return {
    label: "Low Risk",
    tone: "border-[#14532D] bg-[#0F2417] text-[#86EFAC]",
    copy: "Your current forecast leaves comfortable room above break-even.",
  };
}

export function calculateFinanceSummary(
  draft: Pick<WizardFinanceDraftV1, "ticketInventory" | "costs" | "tiers">,
  fixedCosts: { artistFees: number; venueFee: number }
): FinanceSummary {
  const ticketInventory = sanitizeWholeNumber(draft.ticketInventory);
  const tierRows = draft.tiers.map((tier) => {
    const allocationQty = sanitizeWholeNumber(tier.allocationQty);
    const sellThroughPct = sanitizeNumber(tier.sellThroughPct);
    const price = sanitizeNumber(tier.price);
    return {
      ...tier,
      allocationQty,
      sellThroughPct,
      price,
      allocationPct: 0,
      expectedSold: Math.round((allocationQty * sellThroughPct) / 100),
      expectedRevenue: 0,
      potentialRevenue: allocationQty * price,
    };
  });

  const totalAllocatedTickets = tierRows.reduce((sum, tier) => sum + tier.allocationQty, 0);
  const tierRowsWithPercents = tierRows.map((tier) => ({
    ...tier,
    allocationPct: totalAllocatedTickets > 0 ? (tier.allocationQty / totalAllocatedTickets) * 100 : 0,
    expectedRevenue: tier.expectedSold * tier.price,
  }));

  const allocationCoveragePct =
    ticketInventory > 0 ? (totalAllocatedTickets / ticketInventory) * 100 : 0;
  const inventoryBalanced = ticketInventory > 0 && totalAllocatedTickets === ticketInventory;
  const totalExpectedSold = tierRowsWithPercents.reduce((sum, tier) => sum + tier.expectedSold, 0);
  const potentialRevenue = tierRowsWithPercents.reduce((sum, tier) => sum + tier.potentialRevenue, 0);
  const expectedRevenue = tierRowsWithPercents.reduce((sum, tier) => sum + tier.expectedRevenue, 0);
  const artistFees = sanitizeNumber(fixedCosts.artistFees);
  const venueFee = sanitizeNumber(fixedCosts.venueFee);
  const additionalCostsTotal = draft.costs.reduce((sum, cost) => sum + sanitizeNumber(cost.amount), 0);
  const totalCosts = artistFees + venueFee + additionalCostsTotal;
  const projectedProfit = expectedRevenue - totalCosts;
  const averageTicketPrice =
    totalAllocatedTickets > 0 ? potentialRevenue / totalAllocatedTickets : 0;
  const breakEvenTickets =
    averageTicketPrice > 0 ? Math.ceil(totalCosts / averageTicketPrice) : 0;
  const expectedSellThroughPct =
    totalAllocatedTickets > 0 ? (totalExpectedSold / totalAllocatedTickets) * 100 : 0;

  return {
    tierRows: tierRowsWithPercents,
    totalAllocatedTickets,
    allocationCoveragePct,
    inventoryBalanced,
    totalExpectedSold,
    expectedSellThroughPct,
    potentialRevenue,
    expectedRevenue,
    artistFees,
    venueFee,
    additionalCostsTotal,
    totalCosts,
    projectedProfit,
    averageTicketPrice,
    breakEvenTickets,
    risk: getRiskLevel({
      inventoryBalanced,
      projectedProfit,
      breakEvenTickets,
      totalExpectedSold,
      totalCosts,
    }),
  };
}
