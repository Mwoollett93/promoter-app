"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Archive,
  BadgeDollarSign,
  Beer,
  Building2,
  Camera,
  CircleAlert,
  CheckCircle2,
  Construction,
  Disc3,
  FileCheck,
  Fuel,
  Hotel,
  Info,
  Landmark,
  Lightbulb,
  Megaphone,
  MonitorPlay,
  Package,
  Paintbrush,
  Plane,
  Plus,
  Printer,
  Receipt,
  Settings2,
  Shirt,
  Shield,
  ShieldCheck,
  Sparkles,
  Speaker,
  Ticket,
  Trash2,
  Truck,
  UserCog,
  Users,
  UtensilsCrossed,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { FinancePermissionBanner } from "@/app/components/collaboration/PermissionBanner";
import Button from "@/app/components/ui/Button";
import CurrencyText from "@/app/components/ui/CurrencyText";
import Stepper from "@/app/components/ui/Stepper";
import { getInitialScheduleSlots, loadWizardEventDraft } from "@/lib/data";
import {
  buildFinanceDraft,
  calculateFinanceSummary,
  clampInventoryToVenueCapacity,
  clampTierAllocationsToInventory,
} from "@/lib/data/wizard-finance-logic";
import {
  getInventoryCap,
  getVenueFee,
  loadVenueFinanceContext,
  type VenueFinanceContext,
} from "@/lib/data/venue-finance-context";
import {
  loadWizardFinanceDraft,
  saveWizardFinanceDraft,
  type WizardFinanceCostItemV1,
  type WizardFinanceDraftV1,
  type WizardFinanceTierV1,
} from "@/lib/data/wizard-finance-draft";
import { loadWizardScheduleSlots } from "@/lib/data/wizard-schedule-persist";
import { formatDurationMinutes } from "@/lib/schedule";

type FinanceDraftState = Omit<WizardFinanceDraftV1, "v">;

type CostOption = {
  id: string;
  label: string;
  icon: LucideIcon;
  kind: "fixed" | "additional";
};

const ADDITIONAL_COST_OPTIONS: CostOption[] = [
  { id: "venue-hire", label: "Venue Hire", icon: Building2, kind: "fixed" },
  { id: "artist-fees", label: "Artist Fees", icon: Users, kind: "fixed" },
  { id: "flights", label: "Flights", icon: Plane, kind: "additional" },
  { id: "accommodation", label: "Accommodation", icon: Hotel, kind: "additional" },
  { id: "hospitality-catering", label: "Hospitality / Catering", icon: UtensilsCrossed, kind: "additional" },
  { id: "production", label: "Production", icon: Settings2, kind: "additional" },
  { id: "lighting", label: "Lighting", icon: Lightbulb, kind: "additional" },
  { id: "audio-sound-system", label: "Audio / Sound System", icon: Speaker, kind: "additional" },
  { id: "visuals-led-screens", label: "Visuals / LED Screens", icon: MonitorPlay, kind: "additional" },
  { id: "dj-equipment", label: "DJ Equipment", icon: Disc3, kind: "additional" },
  { id: "stage-hire", label: "Stage Hire", icon: Construction, kind: "additional" },
  { id: "security", label: "Security", icon: Shield, kind: "additional" },
  { id: "staff-crew", label: "Staff / Crew", icon: UserCog, kind: "additional" },
  { id: "bar-staff", label: "Bar Staff", icon: Beer, kind: "additional" },
  { id: "cleaning", label: "Cleaning", icon: Sparkles, kind: "additional" },
  { id: "marketing", label: "Marketing", icon: Megaphone, kind: "additional" },
  { id: "social-ads", label: "Social Ads", icon: BadgeDollarSign, kind: "additional" },
  { id: "printing", label: "Printing", icon: Printer, kind: "additional" },
  { id: "photographer-videographer", label: "Photographer / Videographer", icon: Camera, kind: "additional" },
  { id: "insurance", label: "Insurance", icon: ShieldCheck, kind: "additional" },
  { id: "equipment-hire", label: "Equipment Hire", icon: Package, kind: "additional" },
  { id: "transport-logistics", label: "Transport / Logistics", icon: Truck, kind: "additional" },
  { id: "fuel", label: "Fuel", icon: Fuel, kind: "additional" },
  { id: "power-generators", label: "Power / Generators", icon: Zap, kind: "additional" },
  { id: "internet-wifi", label: "Internet / WiFi", icon: Wifi, kind: "additional" },
  { id: "ticketing-fees", label: "Ticketing Fees", icon: Ticket, kind: "additional" },
  { id: "licensing-permits", label: "Licensing / Permits", icon: FileCheck, kind: "additional" },
  { id: "decor-styling", label: "Decor / Styling", icon: Paintbrush, kind: "additional" },
  { id: "merchandise", label: "Merchandise", icon: Shirt, kind: "additional" },
  { id: "storage", label: "Storage", icon: Archive, kind: "additional" },
  { id: "miscellaneous-other-expenses", label: "Miscellaneous / Other Expenses", icon: Receipt, kind: "additional" },
  { id: "taxes-gst", label: "Taxes / GST", icon: Landmark, kind: "additional" },
  { id: "contingency-buffer", label: "Contingency Buffer", icon: CircleAlert, kind: "additional" },
];
const COST_OPTION_MAP = new Map(ADDITIONAL_COST_OPTIONS.map((option) => [option.id, option]));

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

function normalizeCurrencyInput(raw: string) {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const [whole = "", ...decimalParts] = cleaned.split(".");
  const decimal = decimalParts.join("").slice(0, 2);
  return decimal.length > 0 ? `${whole}.${decimal}` : whole;
}

function parseWholeNumber(raw: string) {
  return Math.max(0, Math.round(parseInputNumber(raw)));
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildAdditionalCost(option: CostOption): WizardFinanceCostItemV1 {
  return {
    id: option.id,
    label: option.label,
    amount: 0,
  };
}

function getInventoryStatusCopy(ticketInventory: number, totalAllocatedTickets: number) {
  const difference = ticketInventory - totalAllocatedTickets;
  if (difference === 0) {
    return {
      title: "Ticket inventory is fully allocated",
      copy: "Each tier now has a concrete ticket quantity, and the plan covers the full on-sale inventory.",
    };
  }

  if (difference > 0) {
    return {
      title: "Allocate the remaining ticket inventory",
      copy: `${difference} ticket${difference === 1 ? "" : "s"} still need to be assigned before continuing.`,
    };
  }

  return {
    title: "Reduce over-allocation before continuing",
    copy: `Your tier plan is over by ${Math.abs(difference)} ticket${Math.abs(difference) === 1 ? "" : "s"}. Bring the total back to your inventory target.`,
  };
}

export default function FinanceForecastPage() {
  const router = useRouter();
  const [draft, setDraft] = React.useState<FinanceDraftState>(() => {
    const initial = buildFinanceDraft({ stored: null });
    return {
      ticketInventory: initial.ticketInventory,
      costs: initial.costs,
      tiers: initial.tiers,
    };
  });
  const [artistFees, setArtistFees] = React.useState(0);
  const [lineupRuntimeMinutes, setLineupRuntimeMinutes] = React.useState(0);
  const [eventContext, setEventContext] = React.useState<VenueFinanceContext>({});
  const [isCostPickerOpen, setIsCostPickerOpen] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      const stored = loadWizardFinanceDraft();
      const slots = loadWizardScheduleSlots() ?? (await getInitialScheduleSlots());
      const eventDraft = loadWizardEventDraft();

      let venueContext: VenueFinanceContext = {
        venueId: eventDraft?.venueId,
        venueName: eventDraft?.venueName,
        venueCapacity: eventDraft?.venueCapacity,
      };

      if (eventDraft?.venueId) {
        try {
          venueContext = {
            ...venueContext,
            ...(await loadVenueFinanceContext(eventDraft.venueId)),
          };
        } catch {
          /* fall back to stored event basics context */
        }
      }

      if (cancelled) return;

      const initialDraft = buildFinanceDraft({
        stored,
        venueCapacity: venueContext.venueCapacity,
      });

      setDraft({
        ticketInventory: initialDraft.ticketInventory,
        costs: initialDraft.costs,
        tiers: initialDraft.tiers,
      });
      setArtistFees(Math.round(slots.reduce((sum, slot) => sum + slot.feeCents, 0) / 100));
      setLineupRuntimeMinutes(slots.reduce((sum, slot) => sum + slot.durationMinutes, 0));
      setEventContext(venueContext);
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

  const inventoryCap = React.useMemo(() => getInventoryCap(eventContext), [eventContext]);
  const venueFee = React.useMemo(() => getVenueFee(eventContext), [eventContext]);
  const summary = React.useMemo(
    () => calculateFinanceSummary(draft, { artistFees, venueFee }),
    [draft, artistFees, venueFee]
  );
  const canContinue = summary.inventoryBalanced && draft.tiers.length > 0;
  const inventoryStatus = getInventoryStatusCopy(draft.ticketInventory, summary.totalAllocatedTickets);
  const selectedAdditionalCostIds = React.useMemo(
    () => new Set(draft.costs.map((cost) => cost.id)),
    [draft.costs]
  );
  const hasAdditionalCosts = draft.costs.length > 0;
  const shouldScrollAdditionalCosts = draft.costs.length > 5;

  const updateCostAmount = React.useCallback((id: string, value: string) => {
    setDraft((current) => ({
      ...current,
      costs: current.costs.map((cost) =>
        cost.id === id ? { ...cost, amount: parseInputNumber(value) } : cost
      ),
    }));
  }, []);

  const addCostItem = React.useCallback((option: CostOption) => {
    if (option.kind !== "additional") return;

    setDraft((current) => {
      if (current.costs.some((cost) => cost.id === option.id)) return current;
      return {
        ...current,
        costs: [...current.costs, buildAdditionalCost(option)],
      };
    });
    setIsCostPickerOpen(false);
  }, []);

  const removeCostItem = React.useCallback((id: string) => {
    setDraft((current) => ({
      ...current,
      costs: current.costs.filter((cost) => cost.id !== id),
    }));
  }, []);

  const updateTier = React.useCallback((id: string, patch: Partial<WizardFinanceTierV1>) => {
    setDraft((current) => ({
      ...current,
      tiers: current.tiers.map((tier) => (tier.id === id ? { ...tier, ...patch } : tier)),
    }));
  }, []);

  const updateInventory = React.useCallback(
    (raw: string) => {
      setDraft((current) => {
        const nextInventory = clampInventoryToVenueCapacity(parseWholeNumber(raw), inventoryCap);
        return {
          ...current,
          ticketInventory: nextInventory,
          tiers: clampTierAllocationsToInventory(current.tiers, nextInventory),
        };
      });
    },
    [inventoryCap]
  );

  const updateTierAllocationQty = React.useCallback((id: string, raw: string) => {
    setDraft((current) => {
      const requestedQty = parseWholeNumber(raw);
      const otherAllocated = current.tiers.reduce(
        (sum, tier) => (tier.id === id ? sum : sum + Math.max(0, Math.round(tier.allocationQty))),
        0
      );
      const maxForTier = Math.max(0, current.ticketInventory - otherAllocated);

      return {
        ...current,
        tiers: current.tiers.map((tier) =>
          tier.id === id
            ? {
                ...tier,
                allocationQty: Math.min(requestedQty, maxForTier),
              }
            : tier
        ),
      };
    });
  }, []);

  const addTier = React.useCallback(() => {
    setDraft((current) => ({
      ...current,
      tiers: [
        ...current.tiers,
        {
          id: createId("tier"),
          name: `Tier ${current.tiers.length + 1}`,
          price: 45,
          allocationQty: 0,
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
      <FinancePermissionBanner />

      <section className="rounded-[16px] border border-[#181824] bg-gradient-to-b from-[#11111A] to-[#0D0D14] p-5 shadow-[0px_10px_40px_0px_rgba(0,0,0,0.4)]">
        <h2 className="text-[24px] font-bold leading-[28px] text-[#F5F5F7]">
          Finance &amp; Forecast
        </h2>
        <p className="mt-1 text-[12px] leading-4 text-[#A1A1AA]">
          Turn your lineup, venue, and ticket plan into a real revenue forecast before launch.
        </p>

        <div className="mt-4 grid items-start gap-3 xl:grid-cols-[292px_minmax(0,1fr)_276px]">
          <section className="self-start rounded-[12px] border border-[#232330] bg-[#0F0F17] p-3.5">
            <div className="space-y-2.5">
              <FixedCostCard
                title="Artist Fees"
                description="Pulled from booked artists"
                value={summary.artistFees}
                icon={Users}
              />
              <FixedCostCard
                title="Venue Fee"
                description={
                  eventContext.venueName
                    ? `Pulled from ${eventContext.venueName}`
                    : "Pulled from selected venue"
                }
                value={summary.venueFee}
                icon={Building2}
              />
            </div>

            <div className="mt-3.5 rounded-[10px] border border-[#181824] bg-[#11111A] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#F5F5F7]">
                    Additional Costs
                  </p>
                  <p className="mt-1 text-[11px] text-[#71717A]">
                    Add and manage the extra event costs you want included in the forecast.
                  </p>
                </div>
              </div>

              {hasAdditionalCosts ? (
                <>
                  <div
                    className={[
                      "mt-3 overflow-hidden rounded-[10px] border border-[#232330] bg-[#0B0B10]",
                      shouldScrollAdditionalCosts ? "max-h-[204px] overflow-y-auto" : "",
                    ].join(" ")}
                  >
                    {draft.costs.map((cost) => (
                      <AdditionalCostCard
                        key={cost.id}
                        cost={cost}
                        onAmountChange={updateCostAmount}
                        onRemove={removeCostItem}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCostPickerOpen(true)}
                    className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#8B5CF6] transition-colors hover:text-[#A78BFA]"
                  >
                    <Plus className="h-4 w-4" />
                    Add Cost Item
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCostPickerOpen(true)}
                  className="mt-3 flex w-full flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#8B5CF6]/60 bg-[#11111A] px-3 py-4 text-center transition-colors hover:border-[#A78BFA] hover:bg-[#181824]"
                >
                  <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#8B5CF6]">
                    <Plus className="h-4 w-4" />
                    Add Cost Item
                  </span>
                </button>
              )}
            </div>

            <div className="mt-4 border-t border-[#232330] pt-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#F5F5F7]">
                  Total Costs
                </span>
                <span className="text-[20px] font-bold leading-6 text-[#F5F5F7]">
                  <CurrencyText value={summary.totalCosts} />
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
                  Set ticket quantities per tier. Allocation percentages are derived from the total allocated plan.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-[12px] text-[#A1A1AA]">
                  <span className="whitespace-nowrap">Inventory</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={draft.ticketInventory}
                    onChange={(event) => updateInventory(event.target.value)}
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

            {inventoryCap ? (
              <p className="mt-3 text-[12px] text-[#71717A]">
                {eventContext.venueName
                  ? `${eventContext.venueName} caps ticket inventory at ${inventoryCap} based on venue capacity.`
                  : `Venue capacity caps ticket inventory at ${inventoryCap}.`}
              </p>
            ) : null}

            <div className="mt-4 overflow-x-auto rounded-[12px] border border-[#181824]">
              <table className="min-w-[900px] w-full border-separate border-spacing-[6px]">
                <thead className="bg-[#11111A]">
                  <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-[#A1A1AA]">
                    <th className="px-2 py-2 font-medium">Tier</th>
                    <th className="px-2 py-2 font-medium">Price</th>
                    <th className="px-2 py-2 font-medium">Allocation Qty</th>
                    <th className="px-2 py-2 font-medium">Allocation %</th>
                    <th className="px-2 py-2 font-medium">Sell-through</th>
                    <th className="px-2 py-2 font-medium">Expected Sold</th>
                    <th className="px-2 py-2 font-medium">Est. Revenue</th>
                    <th className="px-2 py-2 font-medium">Potential Revenue</th>
                    <th className="px-2 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {summary.tierRows.map((tier) => (
                    <tr key={tier.id} className="bg-[#0B0B10]">
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={tier.name}
                          onChange={(event) => updateTier(tier.id, { name: event.target.value })}
                          className="w-full min-w-[72px] rounded-md border border-[#3F3F46] bg-[#11111A] px-2 py-1.5 text-[12px] text-[#F5F5F7] outline-none transition-colors hover:border-[#71717A] focus:border-[#8B5CF6]"
                          aria-label="Tier name"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <label className="flex min-w-[86px] items-center gap-1 rounded-md border border-[#3F3F46] bg-[#11111A] px-2 py-1.5 text-[12px] text-[#F5F5F7]">
                          <span className="text-[#71717A]">$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={tier.price}
                            onChange={(event) =>
                              updateTier(tier.id, { price: parseInputNumber(event.target.value) })
                            }
                            className="w-full bg-transparent text-right outline-none"
                            aria-label={`${tier.name} price`}
                          />
                        </label>
                      </td>
                      <td className="px-2 py-2">
                        <label className="flex min-w-[104px] items-center gap-1 rounded-md border border-[#3F3F46] bg-[#11111A] px-2 py-1.5 text-[12px] text-[#F5F5F7]">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={tier.allocationQty}
                            onChange={(event) => updateTierAllocationQty(tier.id, event.target.value)}
                            className="w-full bg-transparent text-right outline-none"
                            aria-label={`${tier.name} allocation quantity`}
                          />
                          <span className="text-[#71717A]">tk</span>
                        </label>
                      </td>
                      <td className="px-2 py-2 text-[12px] text-[#F5F5F7]">
                        {formatPercent(tier.allocationPct)}
                      </td>
                      <td className="px-2 py-2">
                        <label className="flex min-w-[100px] items-center gap-1 rounded-md border border-[#3F3F46] bg-[#11111A] px-2 py-1.5 text-[12px] text-[#F5F5F7]">
                          <input
                            type="text"
                            inputMode="decimal"
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
                      <td className="px-2 py-2 text-[12px] text-[#F5F5F7]">
                        {tier.expectedSold} ({formatPercent(tier.sellThroughPct)})
                      </td>
                      <td className="px-2 py-2 text-[12px] font-medium text-[#F5F5F7]">
                        <CurrencyText value={tier.expectedRevenue} />
                      </td>
                      <td className="px-2 py-2 text-[12px] text-[#A1A1AA]">
                        <CurrencyText value={tier.potentialRevenue} />
                      </td>
                      <td className="px-2 py-2 text-right">
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

            <div className="mt-4 grid gap-3 text-[13px] text-[#A1A1AA] sm:grid-cols-3">
              <MetricChip
                label="Allocated Inventory"
                value={`${summary.totalAllocatedTickets} / ${draft.ticketInventory} tickets`}
                valueClassName={summary.inventoryBalanced ? "text-[#86EFAC]" : "text-[#FCA5A5]"}
              />
              <MetricChip
                label="Coverage"
                value={formatPercent(summary.allocationCoveragePct)}
                valueClassName={summary.inventoryBalanced ? "text-[#86EFAC]" : "text-[#FCA5A5]"}
              />
              <MetricChip
                label="Expected Sold"
                value={`${summary.totalExpectedSold} (${formatPercent(summary.expectedSellThroughPct)})`}
                valueClassName="text-[#86EFAC]"
              />
            </div>

            <div
              className={`mt-4 flex items-start gap-3 rounded-[10px] border px-4 py-3 ${
                summary.inventoryBalanced
                  ? "border-[#14532D] bg-[#0F2417]"
                  : "border-[#7F1D1D] bg-[#2B0F14]"
              }`}
            >
              {summary.inventoryBalanced ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#86EFAC]" />
              ) : (
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#FCA5A5]" />
              )}
              <div>
                <p className="text-[14px] font-medium text-[#F5F5F7]">{inventoryStatus.title}</p>
                <p className="mt-1 text-[12px] text-[#A1A1AA]">{inventoryStatus.copy}</p>
              </div>
            </div>
          </section>

          <aside className="rounded-[12px] border border-[#232330] bg-[#0F0F17] p-3.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#F5F5F7]">
                Forecast Summary
              </p>
            </div>

            <div className="mt-3.5 space-y-3">
              <SummaryRow
                label="Potential Revenue"
                value={<CurrencyText value={summary.potentialRevenue} />}
              />
              <SummaryRow
                label="Expected Revenue"
                value={<CurrencyText value={summary.expectedRevenue} />}
              />
              <SummaryRow
                label="Total Costs"
                value={<CurrencyText value={summary.totalCosts} />}
              />
              <SummaryRow
                label="Projected Profit / Loss"
                value={<CurrencyText value={summary.projectedProfit} />}
                valueClassName={summary.projectedProfit >= 0 ? "text-[#86EFAC]" : "text-[#FCA5A5]"}
              />
              <SummaryRow
                label="Break-even Point"
                value={summary.breakEvenTickets > 0 ? `${summary.breakEvenTickets} tickets` : "—"}
              />
              <SummaryRow
                label="Average Ticket Price"
                value={
                  summary.averageTicketPrice > 0 ? (
                    <CurrencyText value={summary.averageTicketPrice} />
                  ) : (
                    "—"
                  )
                }
              />
              <SummaryRow
                label="Expected Sold"
                value={`${summary.totalExpectedSold} tickets (${formatPercent(summary.expectedSellThroughPct)})`}
              />
            </div>

            <div className="my-4 h-px w-full bg-[#232330]" />

            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#F05A5A]">
                Risk Level
              </p>
              <div className="mt-2.5 flex items-start justify-between gap-3">
                <p className="max-w-[132px] text-[12px] leading-5 text-[#A1A1AA]">
                  {summary.risk.copy}
                </p>
                <span className={`rounded-full border px-2.5 py-1 text-[12px] font-medium ${summary.risk.tone}`}>
                  {summary.risk.label}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-[12px] border border-[#232330] bg-[#11111A] px-3 py-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#7C3AED1F] text-[#A78BFA]">
                  <Info className="h-4 w-4" />
                </div>

                <div className="space-y-1">
                  <p className="text-[14px] font-medium leading-5 text-[#F5F5F7]">
                    What do these numbers mean?
                  </p>
                  <p className="text-[12px] leading-5 text-[#A1A1AA]">
                    Default fees come from your lineup and venue. Expected sold comes from ticket allocation and sell-through.
                  </p>
                </div>
              </div>
            </div>
          </aside>
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

          {!canContinue ? (
            <p className="text-[12px] text-[#A1A1AA]">
              Allocate the full ticket inventory before continuing to review.
            </p>
          ) : null}

          <div className="ml-auto">
            <Button
              variant="primary"
              size="md"
              type="button"
              disabled={!canContinue}
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

      <CostPickerOverlay
        open={isCostPickerOpen}
        selectedCostIds={selectedAdditionalCostIds}
        onClose={() => setIsCostPickerOpen(false)}
        onSelect={addCostItem}
      />
    </div>
  );
}

function FixedCostCard({
  title,
  description,
  value,
  icon: Icon,
}: {
  title: string;
  description: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[10px] border border-[#181824] bg-[#11111A] px-3 py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1E1B4B] text-[#C4B5FD]">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold uppercase tracking-[0.08em] text-[#F5F5F7]">
            {title}
          </p>
          <p className="text-[11px] text-[#71717A]">{description}</p>
        </div>
        <p className="shrink-0 text-[16px] font-bold leading-5 text-[#F5F5F7]">
          <CurrencyText value={value} />
        </p>
      </div>
    </div>
  );
}

function AdditionalCostCard({
  cost,
  onAmountChange,
  onRemove,
}: {
  cost: WizardFinanceCostItemV1;
  onAmountChange: (id: string, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const option = COST_OPTION_MAP.get(cost.id);
  const Icon = option?.icon ?? Receipt;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isEditingAmount, setIsEditingAmount] = React.useState(false);
  const [draftAmount, setDraftAmount] = React.useState(() => String(cost.amount));

  React.useEffect(() => {
    if (!isEditingAmount) {
      setDraftAmount(String(cost.amount));
    }
  }, [cost.amount, isEditingAmount]);

  React.useEffect(() => {
    if (!isEditingAmount) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditingAmount]);

  const commitAmount = React.useCallback(() => {
    const nextValue = draftAmount.trim() === "" ? "0" : draftAmount;
    onAmountChange(cost.id, nextValue);
    setDraftAmount(String(parseInputNumber(nextValue)));
    setIsEditingAmount(false);
  }, [cost.id, draftAmount, onAmountChange]);

  const cancelAmountEdit = React.useCallback(() => {
    setDraftAmount(String(cost.amount));
    setIsEditingAmount(false);
  }, [cost.amount]);

  return (
    <div className="grid grid-cols-[20px_minmax(0,1fr)_68px_20px] items-center gap-[6px] border-b border-[#232330] px-4 py-2.5 last:border-b-0">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#232330] bg-transparent text-[#A1A1AA]">
        <Icon className="h-[19px] w-[19px]" />
      </div>
      <p className="min-w-0 whitespace-normal break-normal pr-1 text-[12px] font-medium leading-4 text-[#F5F5F7]">
        {cost.label}
      </p>
      <div className="flex min-h-[20px] shrink-0 items-center justify-end">
        {isEditingAmount ? (
          <label className="inline-flex items-center gap-1 rounded-[6px] border border-[#3F3F46] bg-[#11111A] px-1.5 py-0.5 text-[12px] font-medium leading-4 text-[#F5F5F7]">
            <span className="text-[#A1A1AA]">$</span>
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={draftAmount}
              onChange={(event) => setDraftAmount(normalizeCurrencyInput(event.target.value))}
              onBlur={commitAmount}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitAmount();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  cancelAmountEdit();
                }
              }}
              className="min-w-[1ch] bg-transparent text-right text-[12px] font-medium leading-4 text-[#F5F5F7] outline-none"
              style={{ width: `${Math.max(1, draftAmount.length)}ch` }}
              aria-label={`${cost.label} amount`}
            />
          </label>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingAmount(true)}
            className="inline-flex min-h-[20px] items-center justify-end rounded-[6px] px-1 text-[12px] font-medium leading-4 text-[#F5F5F7]"
            aria-label={`Edit ${cost.label} amount`}
          >
            ${cost.amount.toLocaleString()}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onRemove(cost.id)}
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[#71717A] transition-colors hover:bg-[#181824] hover:text-[#F5F5F7]"
        aria-label={`Remove ${cost.label}`}
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

function CostPickerOverlay({
  open,
  selectedCostIds,
  onClose,
  onSelect,
}: {
  open: boolean;
  selectedCostIds: Set<string>;
  onClose: () => void;
  onSelect: (option: CostOption) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
      <section
        className="w-full max-w-4xl rounded-[16px] border border-[#232330] bg-[#11111A] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[22px] font-bold leading-7 text-[#F5F5F7]">Add Cost Item</h3>
            <p className="mt-1 text-[13px] text-[#A1A1AA]">
              Choose an additional cost category to add to this event forecast.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#71717A] transition-colors hover:bg-[#181824] hover:text-[#F5F5F7]"
            aria-label="Close cost picker"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid max-h-[65vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
          {ADDITIONAL_COST_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isFixed = option.kind === "fixed";
            const isAdded = selectedCostIds.has(option.id);
            const disabled = isFixed || isAdded;

            return (
              <button
                key={option.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(option)}
                className={[
                  "flex items-start gap-3 rounded-[12px] border px-4 py-3 text-left transition-colors",
                  disabled
                    ? "cursor-not-allowed border-[#232330] bg-[#0B0B10] opacity-70"
                    : "border-[#232330] bg-[#0F0F17] hover:border-[#8B5CF6]/60 hover:bg-[#181824]",
                ].join(" ")}
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1E1B4B] text-[#C4B5FD]">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-[#F5F5F7]">{option.label}</p>
                  <p className="mt-1 text-[11px] text-[#71717A]">
                    {isFixed ? "Included as a fixed default cost." : isAdded ? "Already added." : "Add this as a variable event cost."}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function MetricChip({
  label,
  value,
  valueClassName = "text-[#F5F5F7]",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-[10px] border border-[#181824] bg-[#11111A] px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-[0.08em] text-[#71717A]">{label}</p>
      <p className={`mt-1 text-[14px] font-medium ${valueClassName}`}>{value}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClassName = "text-[#F5F5F7]",
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-[13px]">
      <span className="text-[#A1A1AA]">{label}</span>
      <span className={`text-right text-[13px] font-medium ${valueClassName}`}>{value}</span>
    </div>
  );
}
