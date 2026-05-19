"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  MapPin,
  ReceiptText,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import Button from "@/app/components/ui/Button";
import CurrencyText from "@/app/components/ui/CurrencyText";
import Stepper from "@/app/components/ui/Stepper";
import EventStatusBadge from "@/app/components/ui/EventStatusBadge";
import {
  clearWizardEventDraft,
  clearWizardScheduleSlots,
  getEventStartForWizard,
  loadWizardEventDraft,
  loadWizardScheduleSlots,
  tryWizardEventStartFromStorage,
} from "@/lib/data";
import { buildFinanceDraft, calculateFinanceSummary } from "@/lib/data/wizard-finance-logic";
import {
  clearWizardFinanceDraft,
  loadWizardFinanceDraft,
  type WizardFinanceDraftV1,
} from "@/lib/data/wizard-finance-draft";
import { upsertManagedEvent, type ManagedEventRecord, type ManagedEventStatus } from "@/lib/data/events";
import { getVenueFee, loadVenueFinanceContext, type VenueFinanceContext } from "@/lib/data/venue-finance-context";
import { buildScheduleSummary, calculateScheduleTimes, formatClock, formatDurationMinutes } from "@/lib/schedule";
import { getStoredSession, getSupabaseConfig, listArtists } from "@/lib/supabase/browser";
import type { ScheduleSlot } from "@/lib/types/event-schedule";

type ReviewState = {
  eventDraft: ReturnType<typeof loadWizardEventDraft>;
  venueContext: VenueFinanceContext;
  scheduleSlots: ScheduleSlot[];
  financeDraft: WizardFinanceDraftV1;
  uniqueArtistCount: number;
  artistFees: number;
  financeSummary: ReturnType<typeof calculateFinanceSummary>;
  lineupPreview: Array<{
    id: string;
    title: string;
    timeRange: string;
    durationLabel: string;
    fee: number;
  }>;
  totalRuntimeLabel: string;
  b2bCount: number;
};

function formatDateLabel(dateKey?: string) {
  if (!dateKey) return "TBD";

  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return dateKey;

  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTimeLabel(time24?: string) {
  if (!time24) return "Time TBD";
  const [hRaw, mRaw] = time24.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return time24;

  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

function getManagedStatus(dateKey?: string): ManagedEventStatus {
  if (!dateKey) return "draft";

  const eventDate = Date.parse(`${dateKey}T00:00:00`);
  if (!Number.isFinite(eventDate)) return "draft";
  return eventDate < Date.now() ? "completed" : "active";
}

export default function ReviewCreatePage() {
  const router = useRouter();
  const [reviewState, setReviewState] = React.useState<ReviewState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function hydrateReview() {
      setLoading(true);
      setError(null);

      try {
        const eventDraft = loadWizardEventDraft();
        const scheduleSlots = loadWizardScheduleSlots() ?? [];
        const eventStart = tryWizardEventStartFromStorage() ?? getEventStartForWizard();
        const venueContext: VenueFinanceContext = eventDraft?.venueId
          ? await loadVenueFinanceContext(eventDraft.venueId).catch(() => ({}))
          : {};
        const financeDraft = buildFinanceDraft({
          stored: loadWizardFinanceDraft(),
          venueCapacity: venueContext.venueCapacity,
        });

        const session = getStoredSession();
        const artists =
          session && getSupabaseConfig()
            ? await listArtists(session).catch(() => [])
            : [];

        const artistsById = new Map(
          artists
            .filter((artist) => artist.status !== "archived")
            .map((artist) => [
              artist.id,
              {
                id: artist.id,
                name: artist.name,
                avatarUrl: artist.promoImageUrl ?? undefined,
                genres: artist.genres,
                tags: artist.tags,
                defaultFeeCents: artist.typicalFeeCents,
              },
            ])
        );

        const enrichedSlots = calculateScheduleTimes(eventStart, scheduleSlots, artistsById);
        const scheduleSummary = buildScheduleSummary(eventStart, enrichedSlots);
        const uniqueArtistCount = new Set(
          scheduleSlots.flatMap((slot) => (slot.kind === "b2b" ? slot.artistIds : [slot.artistId]))
        ).size;
        const artistFees = scheduleSlots.reduce((sum, slot) => sum + slot.feeCents, 0) / 100;
        const financeSummary = calculateFinanceSummary(financeDraft, {
          artistFees,
          venueFee: getVenueFee(venueContext),
        });

        const lineupPreview = enrichedSlots.map((slot) => ({
          id: slot.slotId,
          title:
            slot.kind === "single"
              ? slot.artist.name
              : slot.artists.map((artist) => artist.name).join(" B2B "),
          timeRange: `${formatClock(slot.start)} - ${formatClock(slot.end)}`,
          durationLabel: formatDurationMinutes(slot.durationMinutes),
          fee: slot.feeCents / 100,
        }));

        if (cancelled) return;

        setReviewState({
          eventDraft,
          venueContext,
          scheduleSlots,
          financeDraft,
          uniqueArtistCount,
          artistFees,
          financeSummary,
          lineupPreview,
          totalRuntimeLabel: formatDurationMinutes(scheduleSummary.totalRuntimeMinutes),
          b2bCount: scheduleSummary.b2bSetCount,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load your event review.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    hydrateReview();

    return () => {
      cancelled = true;
    };
  }, []);

  const canCreate = Boolean(
    reviewState?.eventDraft?.eventName?.trim() &&
      reviewState.scheduleSlots.length > 0 &&
      reviewState.financeSummary.inventoryBalanced &&
      reviewState.financeDraft.tiers.length > 0
  );

  const readinessItems = React.useMemo(() => {
    return [
      {
        label: "Event basics saved",
        complete: Boolean(reviewState?.eventDraft?.eventName?.trim() && reviewState.eventDraft?.venueName),
      },
      {
        label: "Lineup added",
        complete: (reviewState?.scheduleSlots.length ?? 0) > 0,
      },
      {
        label: "Finance balanced",
        complete: Boolean(reviewState?.financeSummary.inventoryBalanced),
      },
      {
        label: "Ticket tiers configured",
        complete: (reviewState?.financeDraft.tiers.length ?? 0) > 0,
      },
    ];
  }, [reviewState]);

  async function handleCreateEvent() {
    if (!reviewState || !canCreate || creating) return;

    setCreating(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const record: ManagedEventRecord = {
        id: `event-${Date.now().toString(36)}`,
        name: reviewState.eventDraft?.eventName?.trim() || "Untitled Event",
        status: getManagedStatus(reviewState.eventDraft?.dateKey),
        dateKey: reviewState.eventDraft?.dateKey,
        startTime: reviewState.eventDraft?.startTime,
        venueName:
          reviewState.eventDraft?.venueName ??
          reviewState.venueContext.venueName ??
          "Venue TBD",
        description: reviewState.eventDraft?.description,
        artistCount: reviewState.uniqueArtistCount,
        slotCount: reviewState.scheduleSlots.length,
        b2bCount: reviewState.b2bCount,
        ticketInventory: reviewState.financeDraft.ticketInventory,
        expectedRevenue: reviewState.financeSummary.expectedRevenue,
        totalCosts: reviewState.financeSummary.totalCosts,
        projectedProfit: reviewState.financeSummary.projectedProfit,
        createdAt: now,
        updatedAt: now,
      };

      upsertManagedEvent(record);
      clearWizardEventDraft();
      clearWizardScheduleSlots();
      clearWizardFinanceDraft();
      router.push("/events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create event.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex w-full justify-center">
        <Stepper state="Review & Create" />
      </div>

      <section className="rounded-[16px] border border-[#181824] bg-gradient-to-b from-[#11111A] to-[#0D0D14] p-5 shadow-[0px_10px_40px_0px_rgba(0,0,0,0.4)]">
        <h2 className="text-[24px] font-bold leading-[28px] text-[#F5F5F7]">Review &amp; Create</h2>
        <p className="mt-1 max-w-[640px] text-[13px] leading-5 text-[#A1A1AA]">
          Confirm your event basics, lineup, and forecast before saving this event into your events
          dashboard.
        </p>

        {error ? (
          <div className="mt-5 rounded-[12px] border border-[#7F1D1D] bg-[#2B0F14] px-4 py-3 text-[13px] text-[#FCA5A5]">
            {error}
          </div>
        ) : null}

        {loading || !reviewState ? (
          <div className="mt-5 rounded-[12px] border border-[#232330] bg-[#0F0F17] p-4 text-[13px] leading-5 text-[#A1A1AA]">
            Loading your saved event basics, lineup, and forecast summary...
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <ReviewStat label="Lineup Slots" value={reviewState.scheduleSlots.length || "—"} />
              <ReviewStat
                label="Ticket Inventory"
                value={reviewState.financeDraft.ticketInventory || "—"}
              />
              <ReviewStat
                label="Projected Profit / Loss"
                value={<CurrencyText value={reviewState.financeSummary.projectedProfit} />}
                valueClassName={
                  reviewState.financeSummary.projectedProfit >= 0 ? "text-[#86EFAC]" : "text-[#FCA5A5]"
                }
              />
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">
                <section className="rounded-[12px] border border-[#232330] bg-[#0F0F17] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[12px] uppercase tracking-[0.08em] text-[#71717A]">Event Basics</p>
                      <h3 className="mt-2 text-[22px] font-bold leading-7 text-[#F5F5F7]">
                        {reviewState.eventDraft?.eventName?.trim() || "Untitled Event"}
                      </h3>
                    </div>
                    <EventStatusBadge status={getManagedStatus(reviewState.eventDraft?.dateKey)} />
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <InfoTile
                      icon={MapPin}
                      label="Venue"
                      value={
                        reviewState.eventDraft?.venueName ??
                        reviewState.venueContext.venueName ??
                        "Venue TBD"
                      }
                    />
                    <InfoTile
                      icon={CalendarDays}
                      label="Date"
                      value={formatDateLabel(reviewState.eventDraft?.dateKey)}
                    />
                    <InfoTile
                      icon={Clock3}
                      label="Start Time"
                      value={formatTimeLabel(reviewState.eventDraft?.startTime)}
                    />
                  </div>

                  <p className="mt-4 text-[13px] leading-5 text-[#A1A1AA]">
                    {reviewState.eventDraft?.description?.trim() ||
                      "No event description was added on the basics step."}
                  </p>
                </section>

                <section className="rounded-[12px] border border-[#232330] bg-[#0F0F17] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[12px] uppercase tracking-[0.08em] text-[#71717A]">Lineup & Schedule</p>
                      <h3 className="mt-2 text-[18px] font-semibold text-[#F5F5F7]">
                        {reviewState.uniqueArtistCount} artists across {reviewState.scheduleSlots.length} slots
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] text-[#71717A]">Runtime</p>
                      <p className="text-[15px] font-semibold text-[#F5F5F7]">
                        {reviewState.totalRuntimeLabel}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {reviewState.lineupPreview.length > 0 ? (
                      reviewState.lineupPreview.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between gap-3 rounded-[10px] border border-[#232330] bg-[#11111A] px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-[#F5F5F7]">
                              {slot.title}
                            </p>
                            <p className="mt-1 text-[12px] text-[#A1A1AA]">
                              {slot.timeRange} · {slot.durationLabel}
                            </p>
                          </div>
                          <p className="shrink-0 text-[13px] font-medium text-[#F5F5F7]">
                            <CurrencyText value={slot.fee} />
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-[10px] border border-dashed border-[#3F3F46] bg-[#11111A] px-3 py-4 text-[13px] text-[#A1A1AA]">
                        No lineup slots have been added yet.
                      </p>
                    )}
                  </div>
                </section>

                <section className="rounded-[12px] border border-[#232330] bg-[#0F0F17] p-4">
                  <p className="text-[12px] uppercase tracking-[0.08em] text-[#71717A]">Finance & Forecast</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricSummary
                      icon={Ticket}
                      label="Expected Sold"
                      value={`${reviewState.financeSummary.totalExpectedSold} tickets`}
                    />
                    <MetricSummary
                      icon={DollarSign}
                      label="Expected Revenue"
                      value={<CurrencyText value={reviewState.financeSummary.expectedRevenue} />}
                    />
                    <MetricSummary
                      icon={ReceiptText}
                      label="Total Costs"
                      value={<CurrencyText value={reviewState.financeSummary.totalCosts} />}
                    />
                    <MetricSummary
                      icon={Sparkles}
                      label="Risk Level"
                      value={reviewState.financeSummary.risk.label}
                    />
                  </div>

                  <div className="mt-4 rounded-[10px] border border-[#232330] bg-[#11111A]">
                    <div className="grid grid-cols-[minmax(0,1.4fr)_90px_90px_100px] gap-3 border-b border-[#232330] px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-[#71717A]">
                      <span>Tier</span>
                      <span className="text-right">Price</span>
                      <span className="text-right">Qty</span>
                      <span className="text-right">Expected</span>
                    </div>
                    {reviewState.financeSummary.tierRows.map((tier) => (
                      <div
                        key={tier.id}
                        className="grid grid-cols-[minmax(0,1.4fr)_90px_90px_100px] gap-3 border-b border-[#232330] px-3 py-2 text-[12px] text-[#F5F5F7] last:border-b-0"
                      >
                        <span className="truncate">{tier.name}</span>
                        <span className="text-right">
                          <CurrencyText value={tier.price} />
                        </span>
                        <span className="text-right">{tier.allocationQty}</span>
                        <span className="text-right">
                          <CurrencyText value={tier.expectedRevenue} />
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <aside className="rounded-[12px] border border-[#232330] bg-[#0F0F17] p-4">
                <p className="text-[12px] uppercase tracking-[0.08em] text-[#71717A]">Ready To Create</p>
                <div className="mt-4 space-y-3">
                  {readinessItems.map((item) => (
                    <ChecklistRow key={item.label} label={item.label} complete={item.complete} />
                  ))}
                </div>

                <div className="my-4 h-px w-full bg-[#232330]" />

                <div className="space-y-3">
                  <SidebarMetric
                    label="Artist Fees"
                    value={<CurrencyText value={reviewState.artistFees} />}
                  />
                  <SidebarMetric
                    label="Venue Fee"
                    value={<CurrencyText value={reviewState.financeSummary.venueFee} />}
                  />
                  <SidebarMetric
                    label="Additional Costs"
                    value={<CurrencyText value={reviewState.financeSummary.additionalCostsTotal} />}
                  />
                  <SidebarMetric
                    label="Break-even"
                    value={
                      reviewState.financeSummary.breakEvenTickets > 0
                        ? `${reviewState.financeSummary.breakEvenTickets} tickets`
                        : "—"
                    }
                  />
                </div>

                <div
                  className={`mt-4 rounded-[10px] border px-3 py-3 ${
                    reviewState.financeSummary.projectedProfit >= 0
                      ? "border-[#14532D] bg-[#0F2417]"
                      : "border-[#7F1D1D] bg-[#2B0F14]"
                  }`}
                >
                  <p className="text-[12px] uppercase tracking-[0.08em] text-[#A1A1AA]">
                    Final Forecast
                  </p>
                  <p
                    className={`mt-2 text-[24px] font-bold leading-7 ${
                      reviewState.financeSummary.projectedProfit >= 0 ? "text-[#86EFAC]" : "text-[#FCA5A5]"
                    }`}
                  >
                    <CurrencyText value={reviewState.financeSummary.projectedProfit} />
                  </p>
                  <p className="mt-2 text-[12px] leading-5 text-[#A1A1AA]">
                    {reviewState.financeSummary.risk.copy}
                  </p>
                </div>
              </aside>
            </div>
          </>
        )}

        <div className="mt-4 flex items-center gap-3 border-t border-[#181824] pt-4">
          <Button
            variant="ghost"
            size="md"
            type="button"
            onClick={() => router.push("/event-wizard/finance-&-forecast")}
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
              disabled={!canCreate || creating || loading}
              onClick={handleCreateEvent}
            >
              <span className="inline-flex items-center gap-2">
                {creating ? "Creating Event..." : "Create Event"}
              </span>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ReviewStat({
  label,
  value,
  valueClassName = "text-[#F5F5F7]",
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-[12px] border border-[#232330] bg-[#0F0F17] p-4">
      <p className="text-[12px] uppercase tracking-[0.08em] text-[#71717A]">{label}</p>
      <p className={`mt-2 text-[24px] font-bold leading-[28px] ${valueClassName}`}>{value}</p>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[10px] border border-[#232330] bg-[#11111A] px-3 py-3">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-full bg-[#181824] text-[#A78BFA]">
          <Icon className="size-4" strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#71717A]">{label}</p>
          <p className="truncate text-[13px] font-medium text-[#F5F5F7]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function MetricSummary({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-[10px] border border-[#232330] bg-[#11111A] px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#71717A]">{label}</p>
        <Icon className="size-4 text-[#8B5CF6]" strokeWidth={2} aria-hidden />
      </div>
      <p className="mt-3 text-[15px] font-semibold leading-5 text-[#F5F5F7]">{value}</p>
    </div>
  );
}

function ChecklistRow({ label, complete }: { label: string; complete: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-[#232330] bg-[#11111A] px-3 py-2.5">
      <div
        className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
          complete ? "bg-[#14532D] text-[#86EFAC]" : "bg-[#27272F] text-[#71717A]"
        }`}
      >
        <CheckCircle2 className="size-3.5" strokeWidth={2.5} aria-hidden />
      </div>
      <p className="text-[13px] text-[#F5F5F7]">{label}</p>
    </div>
  );
}

function SidebarMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <span className="text-[#A1A1AA]">{label}</span>
      <span className="font-medium text-[#F5F5F7]">{value}</span>
    </div>
  );
}
