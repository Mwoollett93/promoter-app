import { describe, expect, it } from "vitest";

import { buildFinanceDraft, calculateFinanceSummary } from "./wizard-finance-logic";

describe("buildFinanceDraft", () => {
  it("caps inventory to venue capacity and starts with no variable costs by default", () => {
    const draft = buildFinanceDraft({
      stored: null,
      venueCapacity: 800,
    });

    expect(draft.ticketInventory).toBe(800);
    expect(draft.costs).toEqual([]);
    expect(draft.tiers.reduce((sum, tier) => sum + tier.allocationQty, 0)).toBe(800);
  });

  it("drops legacy venue-hire from stored variable costs", () => {
    const draft = buildFinanceDraft({
      venueCapacity: 700,
      stored: {
        v: 1,
        ticketInventory: 900,
        costs: [
          { id: "venue-hire", label: "Venue Hire", amount: 3200 },
          { id: "marketing", label: "Marketing", amount: 800 },
        ],
        tiers: [
          { id: "tier-a", name: "Tier A", price: 20, allocationQty: 500, sellThroughPct: 80 },
          { id: "tier-b", name: "Tier B", price: 30, allocationQty: 400, sellThroughPct: 70 },
        ],
      },
    });

    expect(draft.ticketInventory).toBe(700);
    expect(draft.costs).toEqual([{ id: "marketing", label: "Marketing", amount: 800 }]);
    expect(draft.tiers.reduce((sum, tier) => sum + tier.allocationQty, 0)).toBe(700);
  });
});

describe("calculateFinanceSummary", () => {
  it("calculates revenue, break-even, and low-risk forecasts from tier quantities", () => {
    const summary = calculateFinanceSummary(
      {
        ticketInventory: 100,
        costs: [{ id: "production", label: "Production", amount: 1000 }],
        tiers: [
          { id: "tier-a", name: "Tier A", price: 20, allocationQty: 30, sellThroughPct: 50 },
          { id: "tier-b", name: "Tier B", price: 40, allocationQty: 70, sellThroughPct: 100 },
        ],
      },
      { artistFees: 500, venueFee: 300 }
    );

    expect(summary.totalAllocatedTickets).toBe(100);
    expect(summary.inventoryBalanced).toBe(true);
    expect(summary.totalExpectedSold).toBe(85);
    expect(summary.potentialRevenue).toBe(3400);
    expect(summary.expectedRevenue).toBe(3100);
    expect(summary.totalCosts).toBe(1800);
    expect(summary.projectedProfit).toBe(1300);
    expect(summary.breakEvenTickets).toBe(53);
    expect(summary.risk.label).toBe("Low Risk");
  });

  it("marks the plan high risk when inventory is not fully allocated", () => {
    const summary = calculateFinanceSummary(
      {
        ticketInventory: 120,
        costs: [{ id: "production", label: "Production", amount: 2000 }],
        tiers: [
          { id: "tier-a", name: "Tier A", price: 25, allocationQty: 40, sellThroughPct: 60 },
          { id: "tier-b", name: "Tier B", price: 35, allocationQty: 60, sellThroughPct: 70 },
        ],
      },
      { artistFees: 1500, venueFee: 0 }
    );

    expect(summary.totalAllocatedTickets).toBe(100);
    expect(summary.inventoryBalanced).toBe(false);
    expect(summary.allocationCoveragePct).toBeCloseTo(83.33, 2);
    expect(summary.risk.label).toBe("High Risk");
  });
});
