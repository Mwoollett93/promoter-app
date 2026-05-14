"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Info,
  Plus,
  Trash2,
} from "lucide-react";

import Button from "@/app/components/ui/Button";
import Stepper from "@/app/components/ui/Stepper";
import { getInitialScheduleSlots } from "@/lib/data/schedule";
import {
  loadWizardFinanceDraft,
  saveWizardFinanceDraft,
} from "@/lib/data/wizard-finance-draft";
import { loadWizardScheduleSlots } from "@/lib/data/wizard-schedule-persist";
import { formatDurationMinutes } from "@/lib/schedule";
import type {
  WizardFinanceCostItemV1,
  WizardFinanceTierV1,
} from "@/lib/data/wizard-finance-draft";

type FinanceDraftState = {
  ticketInventory: number;
  costs: WizardFinanceCostItemV1[];
  tiers: WizardFinanceTierV1[];
};

type RiskLevel = "Low Risk" | "Medium Risk" | "High Risk";

const DEFAULT_TICKET_INVENTORY = 800;

const DEFAULT_COSTS: WizardFinanceCostItemV1[] = [
  { id: "venue-hire", label: "Venue Hire", amount: 3000 },
  { id: "production", label: "Production", amount: 1500 },
  { id: "marketing", label: "Marketing", amount: 800 },
  { id: "staff", label: "Staff", amount: 600 },
  { id: "security", label: "Security", amount: 600 },
  { id: "equipment", label: "Equipment", amount: 700 },
  { id: "other-expenses", label: "Other Expenses", amount: 500 },
];

const DEFAULT_TIERS: WizardFinanceTierV1[] = [
  { id: "early-bird", name: "Early Bird", price: 20, allocationPct: 15, sellThroughPct: 100 },
  { id: "first-release", name: "First Release", price: 25, allocationPct: 25, sellThroughPct: 85 },
  { id: "second-release", name: "Second Release", price: 30, allocationPct: 25, sellThroughPct: 70 },
  { id: "final-release", name: "Final Release", price: 35, allocationPct: 20, sellThroughPct: 55 },
  { id: "door-sales", name: "Door Sales", price: 40, allocationPct: 15, sellThroughPct: 35 },
];

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return moneyFormatter.format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function sanitizeNumber(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value * 100) / 100);
}

function parseInputNumber(raw: string) {
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return 0;
  return sanitizeNumber(parsed);
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function getInitials(label: string) {
  const parts = label.trim().split(/\s+/).slice(0, 2);
  if (parts.length === 0) return "C";
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function buildDefaultDraft(): FinanceDraftState {
  return {
    ticketInventory: DEFAULT_TICKET_INVENTORY,
    costs: DEFAULT_COSTS,
    tiers: DEFAULT_TIERS,
  };
}

function mergeStoredDraft(stored: ReturnType<typeof loadWizardFinanceDraft>): FinanceDraftState {
  const fallback = buildDefaultDraft();
  if (!stored) return fallback;

  return {
    ticketInventory:
      stored.ticketInventory > 0 ? Math.round(stored.ticketInventory) : fallback.ticketInventory,
    costs: stored.costs.length > 0 ? stored.costs : fallback.costs,
    tiers: stored.tiers.length > 0 ? stored.tiers : fallback.tiers,
  };
}

function allocateTierTickets(ticketInventory: number, tiers: WizardFinanceTierV1[]) {
  const rawAllocations = tiers.map((tier) => (ticketInventory * Math.max(0, tier.allocationPct)) / 100);
  const allocatedTarget = Math.round(rawAllocations.reduce((sum, value) => sum + value, 0));
  const wholeTickets = rawAllocations.map((value) => Math.floor(value));
  let remaining = Math.max(0, allocatedTarget - wholeTickets.reduce((sum, value) => sum + value, 0));

  const rankedRemainders = rawAllocations
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);

  for (let i = 0; i < rankedRemainders.length && remaining > 0; i += 1) {
    wholeTickets[rankedRemainders[i].index] += 1;
    remaining -= 1;
  }

  return wholeTickets;
}

function getRiskLevel(params: {
  allocationBalanced: boolean;
  projectedProfit: number;
  expectedRevenue: number;
  totalCosts: number;
}): { label: RiskLevel; tone: string; copy: string } {
  const { allocationBalanced, projectedProfit, expectedRevenue, totalCosts } = params;
  if (!allocationBalanced || projectedProfit < 0) {
    return {
      label: "High Risk",
      tone: "border-[#7F1D1D] bg-[#2B0F14] text-[#FCA5A5]",
      copy: "Ticket assumptions are not yet covering your current spend.",
    };
  }

  if (expectedRevenue < totalCosts * 1.15) {
    return {
      label: "Medium Risk",
      tone: "border-[#854D0E] bg-[#2A1E0A] text-[#FCD34D]",
      copy: "You are close to break-even, so sell-through on later tiers matters.",
    };
  }

  return {
    label: "Low Risk",
    tone: "border-[#14532D] bg-[#0F2417] text-[#86EFAC]",
    copy: "Current assumptions leave a healthy margin over your planned costs.",
  };
}

export default function FinanceForecastPage() {
  const router = useRouter();
  const [draft, setDraft] = React.useState<FinanceDraftState>(() => buildDefaultDraft());
  const [artistFees, setArtistFees] = React.useState(0);
  const [lineupRuntimeMinutes, setLineupRuntimeMinutes] = React.useState(0);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      const stored = loadWizardFinanceDraft();
      const slots = loadWizardScheduleSlots() ?? (await getInitialScheduleSlots());
      if (cancelled) return;

      setDraft(mergeStoredDraft(stored));
      setArtistFees(
        Math.round(
          slots.reduce((sum, slot) => sum + slot.feeCents, 0) / 100
        )
      );
      setLineupRuntimeMinutes(slots.reduce((sum, slot) => sum + slot.durationMinutes, 0));
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    saveWizardFinanceDraft({
      ticketInventory: draft.ticketInventory,
      costs: draft.costs,
      tiers: draft.tiers,
    });
  }, [draft, hydrated]);

  const tierAllocations = React.useMemo(
    () => allocateTierTickets(Math.round(draft.ticketInventory), draft.tiers),
    [draft.ticketInventory, draft.tiers]
  );

  const tierRows = React.useMemo(
    () =>
      draft.tiers.map((tier, index) => {
        const allocatedTickets = tierAllocations[index] ?? 0;
        const expectedSold = Math.round((allocatedTickets * Math.max(0, tier.sellThroughPct)) / 100);
        const expectedRevenue = expectedSold * tier.price;
        const potentialRevenue = allocatedTickets * tier.price;

        return {
          ...tier,
          allocatedTickets,
          expectedSold,
          expectedRevenue,
          potentialRevenue,
        };
      }),
    [draft.tiers, tierAllocations]
  );

  const allocationTotal = React.useMemo(
    () => draft.tiers.reduce((sum, tier) => sum + Math.max(0, tier.allocationPct), 0),
    [draft.tiers]
  );

  const allocationBalanced = Math.abs(allocationTotal - 100) < 0.01;
  const totalAllocatedTickets = tierRows.reduce((sum, tier) => sum + tier.allocatedTickets, 0);
  const totalExpectedSold = tierRows.reduce((sum, tier) => sum + tier.expectedSold, 0);
  const potentialRevenue = tierRows.reduce((sum, tier) => sum + tier.potentialRevenue, 0);
  const expectedRevenue = tierRows.reduce((sum, tier) => sum + tier.expectedRevenue, 0);
  const totalCosts = artistFees + draft.costs.reduce((sum, cost) => sum + cost.amount, 0);
  const projectedProfit = expectedRevenue - totalCosts;
  const averageTicketPrice =
    totalAllocatedTickets > 0 ? potentialRevenue / totalAllocatedTickets : 0;
  const breakEvenTickets =
    averageTicketPrice > 0 ? Math.ceil(totalCosts / averageTicketPrice) : 0;
  const expectedSellThroughPct =
    draft.ticketInventory > 0 ? (totalExpectedSold / draft.ticketInventory) * 100 : 0;
  const risk = getRiskLevel({
    allocationBalanced,
    projectedProfit,
    expectedRevenue,
    totalCosts,
  });

  const updateCostAmount = React.useCallback((id: string, value: string) => {
    setDraft((current) => ({
      ...current,
      costs: current.costs.map((cost) =>
        cost.id === id ? { ...cost, amount: parseInputNumber(value) } : cost
      ),
    }));
  }, []);

  const addCostItem = React.useCallback(() => {
    setDraft((current) => ({
      ...current,
      costs: [
        ...current.costs,
        {
          id: createId("custom-cost"),
          label: `Custom Cost ${current.costs.filter((cost) => cost.id.startsWith("custom-cost")).length + 1}`,
          amount: 0,
        },
      ],
    }));
  }, []);

  const removeCostItem = React.useCallback((id: string) => {
    setDraft((current) => ({
      ...current,
      costs: current.costs.filter((cost) => cost.id !== id),
    }));
  }, []);

  const updateTier = React.useCallback(
    (id: string, patch: Partial<WizardFinanceTierV1>) => {
      setDraft((current) => ({
        ...current,
        tiers: current.tiers.map((tier) => (tier.id === id ? { ...tier, ...patch } : tier)),
      }));
    },
    []
  );

  const addTier = React.useCallback(() => {
    setDraft((current) => ({
      ...current,
      tiers: [
        ...current.tiers,
        {
          id: createId("tier"),
          name: `Tier ${current.tiers.length + 1}`,
          price: 45,
          allocationPct: 0,
          sellThroughPct: 50,
        },
      ],
    }));
  }, []);

  const removeTier = React.useCallback((id: string) => {
    setDraft((current) => ({
      ...current,
      tiers: current.tiers.filter((tier) => tier.id !== id),
    }));
  }, []);

  return (
    <div className="w-full space-y-3">
      <div className="flex w-full justify-center">
        <Stepper state="Finance & Forecast" />
      </div>

      <section className="rounded-[16px] border border-[#181824] bg-gradient-to-b from-[#11111A] to-[#0D0D14] p-5 shadow-[0px_10px_40px_0px_rgba(0,0,0,0.4)]">
        <h2 className="text-[24px] font-bold leading-[28px] text-[#F5F5F7]">
          Finance &amp; Forecast
        </h2>
        <p className="mt-1 text-[12px] leading-4 text-[#A1A1AA]">
          Add your costs, set ticket tiers and see how your event is tracking before launch.
        </p>

        <div className="mt-4 grid gap-3 xl:grid-cols-[304px_minmax(0,1fr)_292px]">
          <section className="rounded-[12px] border border-[#232330] bg-[#0F0F17] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#F5F5F7]">
                  Costs
                </p>
                <p className="mt-1 text-[11px] text-[#71717A]">
                  Artist fees stay synced to your lineup.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-3 rounded-[10px] border border-[#181824] bg-[#11111A] px-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1E1B4B] text-[11px] font-semibold text-[#C4B5FD]">
                  AF
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] text-[#F5F5F7]">Artist Fees</p>
                  <p className="text-[11px] text-[#71717A]">Derived from your booked schedule</p>
                </div>
                <div className="text-[14px] font-semibold text-[#F5F5F7]">
                  {formatCurrency(artistFees)}
                </div>
              </div>

              {draft.costs.map((cost) => {
                const isCustom = cost.id.startsWith("custom-cost");

                return (
                  <div
                    key={cost.id}
                    className="flex items-center gap-3 rounded-[10px] border border-[#181824] bg-[#11111A] px-3 py-2.5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#181824] text-[11px] font-semibold text-[#A78BFA]">
                      {getInitials(cost.label)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] text-[#F5F5F7]">{cost.label}</p>
                    </div>

                    <label className="flex min-w-[108px] items-center gap-1 rounded-md border border-[#3F3F46] bg-[#0B0B10] px-2 py-1.5 text-[14px] text-[#F5F5F7]">
                      <span className="text-[#71717A]">$</span>
                      <input
                        type="number"
                        min={0}
                        step={50}
                        value={cost.amount}
                        onChange={(event) => updateCostAmount(cost.id, event.target.value)}
                        className="w-full bg-transparent text-right outline-none"
                        aria-label={`${cost.label} amount`}
                      />
                    </label>

                    {isCustom ? (
                      <button
                        type="button"
                        onClick={() => removeCostItem(cost.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#71717A] transition-colors hover:bg-[#181824] hover:text-[#F5F5F7]"
                        aria-label={`Remove ${cost.label}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addCostItem}
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#8B5CF6] transition-colors hover:text-[#A78BFA]"
            >
              <Plus className="h-4 w-4" />
              Add Cost Item
            </button>

            <div className="mt-5 border-t border-[#232330] pt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#F5F5F7]">
                  Total Costs
                </span>
                <span className="text-[24px] font-bold leading-[28px] text-[#F5F5F7]">
                  {formatCurrency(totalCosts)}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-[12px] border border-[#232330] bg-[#0F0F17] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#F5F5F7]">
                  Ticket Tiers &amp; Allocation
                </p>
                <p className="mt-1 text-[11px] text-[#71717A]">
                  Balance your release strategy and adjust sell-through assumptions.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-[12px] text-[#A1A1AA]">
                  <span className="whitespace-nowrap">Inventory</span>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={draft.ticketInventory}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        ticketInventory: Math.max(0, Math.round(parseInputNumber(event.target.value))),
                      }))
                    }
                    className="w-[92px] rounded-md border border-[#3F3F46] bg-[#11111A] px-2 py-1.5 text-right text-[13px] text-[#F5F5F7] outline-none transition-colors hover:border-[#71717A] focus:border-[#8B5CF6]"
                    aria-label="Total ticket inventory"
                  />
                </label>

                <button
                  type="button"
                  onClick={addTier}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#8B5CF6] transition-colors hover:text-[#A78BFA]"
                >
                  <Plus className="h-4 w-4" />
                  Add Tier
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto rounded-[12px] border border-[#181824]">
              <table className="min-w-[760px] w-full border-collapse">
                <thead className="bg-[#11111A]">
                  <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-[#A1A1AA]">
                    <th className="px-3 py-3 font-medium">Tier</th>
                    <th className="px-3 py-3 font-medium">Price</th>
                    <th className="px-3 py-3 font-medium">Allocation</th>
                    <th className="px-3 py-3 font-medium">Sell-through</th>
                    <th className="px-3 py-3 font-medium">Expected Sold</th>
                    <th className="px-3 py-3 font-medium">Est. Revenue</th>
                    <th className="px-3 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {tierRows.map((tier) => (
                    <tr key={tier.id} className="border-t border-[#181824] bg-[#0B0B10]">
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={tier.name}
                          onChange={(event) => updateTier(tier.id, { name: event.target.value })}
                          className="w-full rounded-md border border-[#3F3F46] bg-[#11111A] px-2.5 py-2 text-[13px] text-[#F5F5F7] outline-none transition-colors hover:border-[#71717A] focus:border-[#8B5CF6]"
                          aria-label="Tier name"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <label className="flex min-w-[92px] items-center gap-1 rounded-md border border-[#3F3F46] bg-[#11111A] px-2.5 py-2 text-[13px] text-[#F5F5F7]">
                          <span className="text-[#71717A]">$</span>
                          <input
                            type="number"
                            min={0}
                            step={5}
                            value={tier.price}
                            onChange={(event) =>
                              updateTier(tier.id, { price: parseInputNumber(event.target.value) })
                            }
                            className="w-full bg-transparent text-right outline-none"
                            aria-label={`${tier.name} price`}
                          />
                        </label>
                      </td>
                      <td className="px-3 py-3">
                        <label className="flex min-w-[108px] items-center gap-1 rounded-md border border-[#3F3F46] bg-[#11111A] px-2.5 py-2 text-[13px] text-[#F5F5F7]">
                          <input
                            type="number"
                            min={0}
                            step={5}
                            value={tier.allocationPct}
                            onChange={(event) =>
                              updateTier(tier.id, {
                                allocationPct: parseInputNumber(event.target.value),
                              })
                            }
                            className="w-full bg-transparent text-right outline-none"
                            aria-label={`${tier.name} allocation percentage`}
                          />
                          <span className="text-[#71717A]">%</span>
                        </label>
                        <p className="mt-1 text-[11px] text-[#71717A]">
                          {tier.allocatedTickets} tickets
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <label className="flex min-w-[108px] items-center gap-1 rounded-md border border-[#3F3F46] bg-[#11111A] px-2.5 py-2 text-[13px] text-[#F5F5F7]">
                          <input
                            type="number"
                            min={0}
                            step={5}
                            value={tier.sellThroughPct}
                            onChange={(event) =>
                              updateTier(tier.id, {
                                sellThroughPct: parseInputNumber(event.target.value),
                              })
                            }
                            className="w-full bg-transparent text-right outline-none"
                            aria-label={`${tier.name} sell-through percentage`}
                          />
                          <span className="text-[#71717A]">%</span>
                        </label>
                      </td>
                      <td className="px-3 py-3 text-[13px] text-[#F5F5F7]">
                        {tier.expectedSold} ({formatPercent(tier.sellThroughPct)})
                      </td>
                      <td className="px-3 py-3 text-[13px] font-medium text-[#F5F5F7]">
                        {formatCurrency(tier.expectedRevenue)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeTier(tier.id)}
                          disabled={draft.tiers.length <= 1}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#71717A] transition-colors hover:bg-[#181824] hover:text-[#F5F5F7] disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Remove ${tier.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13px] text-[#A1A1AA]">
              <div className="flex items-center gap-2">
                <span>Total Allocation</span>
                <span className={allocationBalanced ? "text-[#86EFAC]" : "text-[#FCA5A5]"}>
                  {formatPercent(allocationTotal)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span>Expected Sold</span>
                <span className="text-[#86EFAC]">
                  {totalExpectedSold} ({formatPercent(expectedSellThroughPct)})
                </span>
              </div>
            </div>

            <div
              className={`mt-4 flex items-start gap-3 rounded-[10px] border px-4 py-3 ${
                allocationBalanced
                  ? "border-[#14532D] bg-[#0F2417]"
                  : "border-[#7F1D1D] bg-[#2B0F14]"
              }`}
            >
              {allocationBalanced ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#86EFAC]" />
              ) : (
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#FCA5A5]" />
              )}
              <div>
                <p className="text-[14px] font-medium text-[#F5F5F7]">
                  {allocationBalanced
                    ? "Allocation totals are balanced"
                    : "Allocation should equal 100%"}
                </p>
                <p className="mt-1 text-[12px] text-[#A1A1AA]">
                  {allocationBalanced
                    ? "Your ticket mix is split cleanly across the full release plan."
                    : "Adjust the tier percentages so your ticket strategy accounts for the full inventory."}
                </p>
              </div>
            </div>
          </section>

          <aside className="rounded-[12px] border border-[#232330] bg-[#0F0F17] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#F5F5F7]">
                Forecast Summary
              </p>
            </div>

            <div className="mt-4 space-y-4">
              <SummaryRow label="Potential Revenue" value={formatCurrency(potentialRevenue)} />
              <SummaryRow label="Expected Revenue" value={formatCurrency(expectedRevenue)} />
              <SummaryRow label="Total Costs" value={formatCurrency(totalCosts)} />
              <SummaryRow
                label="Projected Profit / Loss"
                value={formatCurrency(projectedProfit)}
                valueClassName={projectedProfit >= 0 ? "text-[#86EFAC]" : "text-[#FCA5A5]"}
              />
              <SummaryRow
                label="Break-even Point"
                value={breakEvenTickets > 0 ? `${breakEvenTickets} tickets` : "â€”"}
              />
              <SummaryRow
                label="Expected Sold"
                value={`${totalExpectedSold} tickets (${formatPercent(expectedSellThroughPct)})`}
              />
            </div>

            <div className="my-5 h-px w-full bg-[#232330]" />

            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#F05A5A]">
                Risk Level
              </p>
              <div className="mt-3 flex items-start justify-between gap-3">
                <p className="max-w-[140px] text-[13px] leading-5 text-[#A1A1AA]">{risk.copy}</p>
                <span className={`rounded-full border px-2.5 py-1 text-[12px] font-medium ${risk.tone}`}>
                  {risk.label}
                </span>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-4 rounded-[12px] border border-[#181824] bg-[#0F0F17] px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#7C3AED1F] text-[#A78BFA]">
              <Info className="h-5 w-5" />
            </div>

            <div className="space-y-1">
              <p className="text-[16px] font-medium leading-5 text-[#F5F5F7]">
                What do these numbers mean?
              </p>
              <p className="text-[13px] leading-5 text-[#A1A1AA]">
                Your forecast uses ticket inventory, tier allocation and sell-through assumptions to
                estimate revenue. Artist fees are pulled from the lineup step, and your current schedule
                runtime is {formatDurationMinutes(lineupRuntimeMinutes)}.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 border-t border-[#181824] pt-4">
          <Button
            variant="ghost"
            size="md"
            type="button"
            onClick={() => router.push("/event-wizard/lineup-&-schedule")}
            className="px-6"
          >
            <span className="inline-flex items-center gap-2">
              <ArrowLeft className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              Back
            </span>
          </Button>

          <div className="ml-auto">
            <Button
              variant="primary"
              size="md"
              type="button"
              onClick={() => {
                saveWizardFinanceDraft({
                  ticketInventory: draft.ticketInventory,
                  costs: draft.costs,
                  tiers: draft.tiers,
                });
                router.push("/event-wizard/review-&-create");
              }}
            >
              <span className="inline-flex items-center gap-2">
                Continue
                <ArrowRight className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              </span>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClassName = "text-[#F5F5F7]",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-[14px]">
      <span className="text-[#A1A1AA]">{label}</span>
      <span className={`text-right font-medium ${valueClassName}`}>{value}</span>
    </div>
  );
}
