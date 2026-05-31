"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import {
  CalendarDays,
  CalendarPlus,
  Clock3,
  MapPin,
  ReceiptText,
  Search,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";

import StartNewEventLink from "@/app/components/events/StartNewEventLink";
import EventStatusBadge from "@/app/components/ui/EventStatusBadge";
import PageContent from "@/app/components/layout/PageContent";
import {
  ManagementTableCard,
  ManagementTableCell,
  ManagementTableEmptyState,
  ManagementTableHead,
  ManagementTableHeaderCell,
  ManagementTablePagination,
  ManagementTableViewport,
  managementTableRowClass,
} from "@/app/components/management/ManagementTable";
import CurrencyText from "@/app/components/ui/CurrencyText";
import { formatDateLabel, formatTimeLabel } from "@/lib/data/format";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import AddedByLine from "@/app/components/ui/AddedByLine";
import { prepareEventForWizardEdit } from "@/lib/event-wizard/open-event-in-wizard";
import {
  getManagedEventSeedCount,
  loadManagedEvents,
  seedManagedEvents,
  type ManagedEventRecord,
  type ManagedEventStatus,
} from "@/lib/data/events";
import { GRID_CARD_GAP, MANAGEMENT_TABLE_PAGE_SIZE_EVENTS, PAGE_STACK_GAP } from "@/lib/layout/page-layout";

const showSeedAction = process.env.NODE_ENV !== "production";
const managedEventSeedCount = getManagedEventSeedCount();

const statusFilters: Array<ManagedEventStatus | "all"> = [
  "all",
  "active",
  "draft",
  "canceled",
  "completed",
];

const pageSize = MANAGEMENT_TABLE_PAGE_SIZE_EVENTS;

function getStatusLabel(status: ManagedEventStatus | "all") {
  if (status === "all") return "All";
  if (status === "canceled") return "Canceled";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function EventManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const venueIdFilter = searchParams.get("venueId")?.trim() || null;
  const venueNameFilter = searchParams.get("venueName")?.trim() || null;
  const artistQuery = searchParams.get("q")?.trim() || null;
  const {
    session,
    workspace,
    members,
    events: workspaceEvents,
    refreshEvents: refreshWorkspaceEvents,
  } = useWorkspace();
  const [events, setEvents] = React.useState<ManagedEventRecord[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<ManagedEventStatus | "all">("all");
  const [page, setPage] = React.useState(1);
  const [seeding, setSeeding] = React.useState(false);
  const [openingDraftId, setOpeningDraftId] = React.useState<string | null>(null);

  const refreshEvents = React.useCallback(() => {
    const rows = workspaceEvents.length > 0 ? workspaceEvents : loadManagedEvents();
    setEvents(rows);
    setSelectedId((prev) => (prev && rows.some((r) => r.id === prev) ? prev : rows[0]?.id ?? null));
  }, [workspaceEvents]);

  React.useEffect(() => {
    refreshEvents();
  }, [refreshEvents, workspaceEvents]);

  React.useEffect(() => {
    function onUpdated() {
      refreshEvents();
    }
    window.addEventListener("promosync:events-updated", onUpdated);
    return () => window.removeEventListener("promosync:events-updated", onUpdated);
  }, [refreshEvents]);

  async function handleContinueEditing(event: ManagedEventRecord) {
    if (!session || !workspace || openingDraftId) return;

    setOpeningDraftId(event.id);
    try {
      const ready = await prepareEventForWizardEdit(session, workspace.id, event.id, {
        name: event.name,
        dateKey: event.dateKey,
        startTime: event.startTime,
        venueId: event.venueId,
        venueName: event.venueName,
        description: event.description,
      });
      if (ready) {
        router.push("/event-wizard/event-basics");
      }
    } finally {
      setOpeningDraftId(null);
    }
  }

  function handleSeedEvents() {
    if (seeding) return;

    setSeeding(true);
    try {
      seedManagedEvents();
      refreshEvents();
    } finally {
      setSeeding(false);
    }
  }

  const counts = React.useMemo(() => {
    return {
      all: events.length,
      active: events.filter((event) => event.status === "active").length,
      draft: events.filter((event) => event.status === "draft").length,
      canceled: events.filter((event) => event.status === "canceled").length,
      completed: events.filter((event) => event.status === "completed").length,
    };
  }, [events]);

  const filteredEvents = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    const artistNeedle = artistQuery?.toLowerCase() ?? null;

    return events.filter((event) => {
      const matchesStatus = status === "all" || event.status === status;
      const matchesVenue =
        !venueIdFilter ||
        event.venueId === venueIdFilter ||
        (venueNameFilter ? event.venueName === venueNameFilter : false);
      const haystack = [event.name, event.venueName, event.description ?? ""].join(" ").toLowerCase();
      const matchesSearch = !needle || haystack.includes(needle);
      const matchesArtist = !artistNeedle || haystack.includes(artistNeedle);
      return matchesStatus && matchesVenue && matchesSearch && matchesArtist;
    });
  }, [events, query, status, venueIdFilter, venueNameFilter, artistQuery]);

  React.useEffect(() => {
    setPage(1);
  }, [query, status, venueIdFilter, venueNameFilter, artistQuery]);

  const hasExternalFilter = Boolean(venueIdFilter || artistQuery);

  React.useEffect(() => {
    if (selectedId && filteredEvents.some((event) => event.id === selectedId)) return;
    setSelectedId(filteredEvents[0]?.id ?? null);
  }, [filteredEvents, selectedId]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const paginatedEvents = filteredEvents.slice((page - 1) * pageSize, page * pageSize);
  const selectedEvent =
    (selectedId ? filteredEvents.find((event) => event.id === selectedId) : null) ??
    filteredEvents[0] ??
    null;

  return (
    <PageContent>
      <header className={`flex flex-col ${PAGE_STACK_GAP} lg:flex-row lg:items-start lg:justify-between`}>
        <div>
          <h1 className="text-[32px] font-bold leading-9 tracking-tight text-[#F5F5F7]">Events</h1>
          <p className="mt-1 text-[14px] leading-5 text-[#A1A1AA]">
            Track every draft, active, canceled, and completed event from one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {showSeedAction ? (
            <button
              type="button"
              onClick={handleSeedEvents}
              disabled={seeding}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#232330] bg-[#11111A] px-4 text-sm font-medium text-[#E4E4E7] hover:border-[#8B5CF6]/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {seeding ? "Adding..." : `Seed ${managedEventSeedCount} Events`}
            </button>
          ) : null}
          <StartNewEventLink
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[8px] border border-[rgba(139,92,246,0.45)] bg-[#7C3AED] px-6 text-[16px] font-medium leading-5 tracking-[0.08px] text-white transition-all hover:border-[#A855F7] hover:bg-[linear-gradient(178.683deg,#7C3AED_4.7705%,rgba(71,33,135,0.76)_96.232%)] hover:shadow-[0_0_24px_0_rgba(139,92,246,0.3)]"
          >
            <CalendarPlus className="size-5 shrink-0" strokeWidth={2} aria-hidden />
            Create New Event
          </StartNewEventLink>
        </div>
      </header>

      <section className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 ${GRID_CARD_GAP}`}>
        <StatusCard label="Active" count={counts.active} tone="active" />
        <StatusCard label="Draft" count={counts.draft} tone="draft" />
        <StatusCard label="Canceled" count={counts.canceled} tone="canceled" />
        <StatusCard label="Completed" count={counts.completed} tone="completed" />
      </section>

      {hasExternalFilter ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#8B5CF6]/30 bg-[#1A1630]/40 px-4 py-3 text-[13px] text-[#D4D4D8]">
          <span>
            {venueNameFilter
              ? `Showing events at ${venueNameFilter}`
              : artistQuery
                ? `Showing events matching “${artistQuery}”`
                : "Filtered event list"}
          </span>
          <Link href="/events" className="text-[#8B5CF6] hover:text-[#C4B5FD]">
            Clear filter
          </Link>
        </div>
      ) : null}

      <section className={`grid xl:grid-cols-[minmax(0,1fr)_340px] ${GRID_CARD_GAP}`}>
        <ManagementTableCard>
          <div className="mb-4 flex flex-col gap-3 border-b border-[#232330] pb-4 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex min-w-0 items-center gap-2 rounded-[12px] border border-[#3F3F46] bg-[#0B0B10] px-3 py-2 text-[13px] text-[#A1A1AA] lg:w-[320px]">
              <Search className="size-4 shrink-0 text-[#71717A]" strokeWidth={2} aria-hidden />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search events, venues, or notes"
                className="w-full bg-transparent text-[13px] text-[#F5F5F7] outline-none placeholder:text-[#71717A]"
                aria-label="Search events"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {statusFilters.map((filterValue) => {
                const isActive = status === filterValue;
                const total = counts[filterValue];

                return (
                  <button
                    key={filterValue}
                    type="button"
                    onClick={() => setStatus(filterValue)}
                    className={[
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                      isActive
                        ? "border-[#8B5CF6]/60 bg-[#8B5CF6]/15 text-[#F5F5F7]"
                        : "border-[#3F3F46] bg-[#0B0B10] text-[#A1A1AA] hover:border-[#71717A] hover:text-[#F5F5F7]",
                    ].join(" ")}
                  >
                    <span>{getStatusLabel(filterValue)}</span>
                    <span className="rounded-full bg-[#181824] px-1.5 py-0.5 text-[11px] text-[#D4D4D8]">
                      {total}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <ManagementTableViewport minWidth={880}>
            <colgroup>
              <col className="w-[32%]" />
              <col className="w-[22%]" />
              <col className="w-[16%]" />
              <col className="w-[14%]" />
              <col className="w-[16%]" />
            </colgroup>
            <ManagementTableHead>
              <ManagementTableHeaderCell>Event</ManagementTableHeaderCell>
              <ManagementTableHeaderCell>Venue</ManagementTableHeaderCell>
              <ManagementTableHeaderCell>Date</ManagementTableHeaderCell>
              <ManagementTableHeaderCell>Status</ManagementTableHeaderCell>
              <ManagementTableHeaderCell>Projected P/L</ManagementTableHeaderCell>
            </ManagementTableHead>
            <tbody>
              {paginatedEvents.length === 0 ? (
                <ManagementTableEmptyState colSpan={5}>
                  No events match those filters. Try clearing your search or create a new event.
                </ManagementTableEmptyState>
              ) : (
                paginatedEvents.map((event) => {
                  const isSelected = event.id === selectedEvent?.id;
                  return (
                    <tr
                      key={event.id}
                      onClick={() => setSelectedId(event.id)}
                      onDoubleClick={() => {
                        if (event.status === "draft") void handleContinueEditing(event);
                      }}
                      className={managementTableRowClass(isSelected)}
                    >
                      <ManagementTableCell>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#F5F5F7]">{event.name}</p>
                          <p className="truncate text-xs text-[#A1A1AA]">
                            {event.artistCount} artists {"\u00b7"} {event.slotCount} lineup slots
                          </p>
                          <AddedByLine userId={event.createdBy} members={members} />
                        </div>
                      </ManagementTableCell>
                      <ManagementTableCell className="text-[#E4E4E7]">
                        <p className="truncate">{event.venueName}</p>
                      </ManagementTableCell>
                      <ManagementTableCell>
                        <p className="text-[#E4E4E7]">{formatDateLabel(event.dateKey)}</p>
                        <p className="text-xs text-[#A1A1AA]">{formatTimeLabel(event.startTime)}</p>
                      </ManagementTableCell>
                      <ManagementTableCell>
                        <EventStatusBadge status={event.status} />
                      </ManagementTableCell>
                      <ManagementTableCell>
                        <p
                          className={`font-semibold ${event.projectedProfit >= 0 ? "text-[#86EFAC]" : "text-[#FCA5A5]"}`}
                        >
                          <CurrencyText value={event.projectedProfit} />
                        </p>
                      </ManagementTableCell>
                    </tr>
                  );
                })
              )}
            </tbody>
          </ManagementTableViewport>

          <ManagementTablePagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalCount={filteredEvents.length}
            entityLabel="events"
            onPrevious={() => setPage((current) => current - 1)}
            onNext={() => setPage((current) => current + 1)}
          />
        </ManagementTableCard>


        <aside className="rounded-xl border border-[#232330] bg-[#11111A] p-5 shadow-[0px_10px_40px_0px_rgba(0,0,0,0.35)]">
          {selectedEvent ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.08em] text-[#71717A]">Selected Event</p>
                  <h2 className="mt-2 text-[22px] font-bold leading-7 text-[#F5F5F7]">
                    {selectedEvent.name}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <EventStatusBadge status={selectedEvent.status} />
                  <Link
                    href={`/events/${selectedEvent.id}/workspace`}
                    className="rounded-lg border border-[#8B5CF6]/40 px-3 py-1 text-[12px] font-medium text-[#C4B5FD] hover:bg-[#2D2640]"
                  >
                    Team workspace
                  </Link>
                </div>
              </div>

              <p className="mt-3 text-[13px] leading-5 text-[#A1A1AA]">
                {selectedEvent.description ?? "No internal notes saved for this event yet."}
              </p>

              <div className="mt-4 space-y-3">
                <DetailRow
                  icon={MapPin}
                  label="Venue"
                  value={selectedEvent.venueName}
                />
                <DetailRow
                  icon={CalendarDays}
                  label="Date"
                  value={formatDateLabel(selectedEvent.dateKey)}
                />
                <DetailRow
                  icon={Clock3}
                  label="Start Time"
                  value={formatTimeLabel(selectedEvent.startTime)}
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <MetricCard label="Artists" value={String(selectedEvent.artistCount)} icon={Users} />
                <MetricCard label="Tickets" value={String(selectedEvent.ticketInventory)} icon={Ticket} />
                <MetricCard
                  label="Expected Revenue"
                  value={<CurrencyText value={selectedEvent.expectedRevenue} />}
                  icon={TrendingUp}
                />
                <MetricCard
                  label="Total Costs"
                  value={<CurrencyText value={selectedEvent.totalCosts} />}
                  icon={ReceiptText}
                />
              </div>

              <div className="mt-5 rounded-[16px] border border-[#232330] bg-[#0F0F17] p-4">
                <p className="text-[12px] uppercase tracking-[0.08em] text-[#71717A]">Projected Profit / Loss</p>
                <p
                  className={`mt-2 text-[24px] font-bold leading-7 ${
                    selectedEvent.projectedProfit >= 0 ? "text-[#86EFAC]" : "text-[#FCA5A5]"
                  }`}
                >
                  <CurrencyText value={selectedEvent.projectedProfit} />
                </p>
                <p className="mt-2 text-[12px] leading-5 text-[#A1A1AA]">
                  {selectedEvent.slotCount} lineup slots with {selectedEvent.b2bCount} B2B set
                  {selectedEvent.b2bCount === 1 ? "" : "s"}.
                </p>
              </div>

              {selectedEvent.status === "draft" ? (
                <button
                  type="button"
                  disabled={openingDraftId === selectedEvent.id}
                  onClick={() => void handleContinueEditing(selectedEvent)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#8B5CF6]/45 bg-[#7C3AED] px-4 py-3 text-[14px] font-medium text-white transition-colors hover:border-[#A78BFA] hover:bg-[#8B5CF6] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CalendarPlus className="size-4" strokeWidth={2} aria-hidden />
                  {openingDraftId === selectedEvent.id ? "Opening…" : "Continue editing"}
                </button>
              ) : null}

              <StartNewEventLink
                className={[
                  "inline-flex w-full items-center justify-center gap-2 rounded-[10px] border px-4 py-3 text-[14px] font-medium transition-colors",
                  selectedEvent.status === "draft"
                    ? "mt-3 border-[#3F3F46] bg-[#0F0F17] text-[#E4E4E7] hover:border-[#71717A] hover:text-white"
                    : "mt-5 border-[#8B5CF6]/45 bg-[#7C3AED] text-white hover:border-[#A78BFA] hover:bg-[#8B5CF6]",
                ].join(" ")}
              >
                <CalendarPlus className="size-4" strokeWidth={2} aria-hidden />
                Create Another Event
              </StartNewEventLink>
            </>
          ) : (
            <div className="rounded-[16px] border border-dashed border-[#3F3F46] bg-[#0F0F17] px-5 py-10 text-center">
              <p className="text-[16px] font-semibold text-[#F5F5F7]">No event selected</p>
              <p className="mt-2 text-[13px] leading-5 text-[#A1A1AA]">
                Select an event from the list to review its status, venue, and forecast summary.
              </p>
            </div>
          )}
        </aside>
      </section>
    </PageContent>
  );
}

function StatusCard({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: ManagedEventStatus;
}) {
  const toneClass: Record<ManagedEventStatus, string> = {
    active: "text-[#C4B5FD] bg-[#8B5CF6]/12 border-[#8B5CF6]/25",
    draft: "text-[#D4D4D8] bg-[#27272F]/70 border-[#3F3F46]",
    canceled: "text-[#FCA5A5] bg-red-500/10 border-red-500/20",
    completed: "text-[#86EFAC] bg-emerald-500/10 border-emerald-500/20",
  };

  return (
    <div className={`rounded-[16px] border p-4 ${toneClass[tone]}`}>
      <p className="text-[12px] uppercase tracking-[0.08em]">{label}</p>
      <p className="mt-2 text-[28px] font-bold leading-8 text-[#F5F5F7]">{count}</p>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[12px] border border-[#232330] bg-[#0F0F17] px-3 py-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#181824] text-[#A78BFA]">
        <Icon className="size-4" strokeWidth={2} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#71717A]">{label}</p>
        <p className="truncate text-[13px] font-medium text-[#F5F5F7]">{value}</p>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-[14px] border border-[#232330] bg-[#0F0F17] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#71717A]">{label}</p>
        <Icon className="size-4 text-[#8B5CF6]" strokeWidth={2} aria-hidden />
      </div>
      <p className="mt-3 text-[16px] font-semibold leading-5 text-[#F5F5F7]">{value}</p>
    </div>
  );
}

