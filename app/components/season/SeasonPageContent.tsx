"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { CalendarRange, Plus } from "lucide-react";

import PageContent from "@/app/components/layout/PageContent";
import SeasonCalendar from "@/app/components/season/SeasonCalendar";
import SeasonQuarterlyPanel from "@/app/components/season/SeasonQuarterlyPanel";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import { assignEventSeason } from "@/lib/data/event-season";
import { loadManagedEvents } from "@/lib/data/events";
import {
  buildQuarterlyPerformance,
  buildSeasonMonthPerformance,
  seasonRollup,
} from "@/lib/data/season-performance";
import {
  createSeason,
  currentQuarter,
  dateKeyFromDate,
  ensureDefaultSeason,
  loadSeasons,
  parseDateKey,
  type SeasonRecord,
} from "@/lib/data/seasons";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { GRID_CARD_GAP, PAGE_STACK_GAP } from "@/lib/layout/page-layout";
import { PAGE_DESCRIPTION, PAGE_EYEBROW, PAGE_TITLE } from "@/lib/ui/page-surfaces";

export default function SeasonPageContent() {
  const router = useRouter();
  const { workspace, events, ready } = useWorkspace();
  const [seasons, setSeasons] = React.useState<SeasonRecord[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newStart, setNewStart] = React.useState("");
  const [newEnd, setNewEnd] = React.useState("");

  const refreshSeasons = React.useCallback(() => {
    if (!workspace) return;
    const list = loadSeasons(workspace.id);
    if (list.length === 0) {
      const defaultSeason = ensureDefaultSeason(workspace.id);
      setSeasons([defaultSeason]);
      setSelectedId((prev) => prev ?? defaultSeason.id);
      return;
    }
    setSeasons(list);
    setSelectedId((prev) => prev ?? list[list.length - 1]?.id ?? null);
  }, [workspace]);

  React.useEffect(() => {
    refreshSeasons();
  }, [refreshSeasons]);

  React.useEffect(() => {
    const onUpdate = () => refreshSeasons();
    window.addEventListener("promosync:seasons-updated", onUpdate);
    window.addEventListener("promosync:events-updated", onUpdate);
    return () => {
      window.removeEventListener("promosync:seasons-updated", onUpdate);
      window.removeEventListener("promosync:events-updated", onUpdate);
    };
  }, [refreshSeasons]);

  const selected = seasons.find((s) => s.id === selectedId) ?? seasons[0] ?? null;
  const managedEvents = React.useMemo(() => loadManagedEvents(), [events, seasons]);

  const rollup = React.useMemo(() => {
    if (!selected) return null;
    return seasonRollup(managedEvents, selected);
  }, [managedEvents, selected]);

  const months = React.useMemo(() => {
    if (!selected) return [];
    return buildSeasonMonthPerformance(managedEvents, selected);
  }, [managedEvents, selected]);

  const quarters = React.useMemo(() => {
    const year = selected ? parseDateKey(selected.startDateKey)?.getFullYear() : new Date().getFullYear();
    return buildQuarterlyPerformance(managedEvents, year ?? new Date().getFullYear());
  }, [managedEvents, selected]);

  function handleCreateSeason() {
    if (!workspace || !newName.trim() || !newStart || !newEnd) return;
    const season = createSeason({
      workspaceId: workspace.id,
      name: newName.trim(),
      startDateKey: newStart,
      endDateKey: newEnd,
    });
    setSelectedId(season.id);
    setShowCreate(false);
    setNewName("");
    refreshSeasons();
  }

  function handleQuickCreateQuarter() {
    if (!workspace) return;
    const { year, quarter } = currentQuarter();
    const startMonth = (quarter - 1) * 3;
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 3, 0);
    const season = createSeason({
      workspaceId: workspace.id,
      name: `Q${quarter} ${year}`,
      startDateKey: dateKeyFromDate(start),
      endDateKey: dateKeyFromDate(end),
    });
    setSelectedId(season.id);
    refreshSeasons();
  }

  if (!ready || !workspace) {
    return (
      <PageContent>
        <p className="text-[#A1A1AA]">Loading season planner…</p>
      </PageContent>
    );
  }

  return (
    <PageContent fill>
      <header className={`flex flex-col ${PAGE_STACK_GAP} sm:flex-row sm:items-start sm:justify-between`}>
        <div>
          <p className={PAGE_EYEBROW}>Season planning</p>
          <h1 className={PAGE_TITLE}>Your run</h1>
          <p className={`${PAGE_DESCRIPTION} max-w-2xl`}>
            Plan multiple shows as a season — calendar timeline, monthly rollups, and quarterly performance in one view.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => setShowCreate((v) => !v)}>
            New season
          </Button>
          <Link
            href={
              selected
                ? `/event-wizard/event-basics?seasonId=${encodeURIComponent(selected.id)}`
                : "/event-wizard/event-basics"
            }
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[rgba(139,92,246,0.45)] bg-[#7C3AED] px-4 text-[13px] font-medium text-white hover:bg-[#6D28D9]"
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            Add event to season
          </Link>
        </div>
      </header>

      <div className={`flex flex-col ${PAGE_STACK_GAP}`}>
        <div className="flex flex-wrap items-center gap-3">
          <CalendarRange className="size-5 text-[#8B5CF6]" aria-hidden />
          <label className="sr-only" htmlFor="season-select">
            Season
          </label>
          <select
            id="season-select"
            value={selected?.id ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
            className="min-w-[200px] rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 py-2 text-[13px] text-[#F5F5F7] outline-none focus:border-[#8B5CF6]"
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.startDateKey} → {s.endDateKey})
              </option>
            ))}
          </select>
          {selected ? (
            <span className="text-[12px] text-[#71717A]">
              {rollup?.eventCount ?? 0} events in this season
            </span>
          ) : null}
        </div>

        {showCreate ? (
          <section className="rounded-xl border border-[#8B5CF6]/30 bg-[#11111A] p-4">
            <h2 className="text-[15px] font-semibold text-[#F5F5F7]">Create a season</h2>
            <p className="mt-1 text-[12px] text-[#71717A]">
              Group shows into a run (tour, residency, or quarter) to track performance together.
            </p>
            <div className={`mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${GRID_CARD_GAP}`}>
              <Input
                state="default"
                label="Season name"
                value={newName}
                onChange={setNewName}
              />
              <div>
                <label className="mb-1 block text-[12px] font-medium text-[#A1A1AA]">Start date</label>
                <input
                  type="date"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 py-2 text-[13px] text-[#F5F5F7]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-[#A1A1AA]">End date</label>
                <input
                  type="date"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 py-2 text-[13px] text-[#F5F5F7]"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button type="button" variant="primary" size="sm" onClick={handleCreateSeason}>
                  Save season
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={handleQuickCreateQuarter}>
                  Quick: this quarter
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {selected && rollup ? (
          <section className={`grid grid-cols-1 xl:grid-cols-3 ${GRID_CARD_GAP}`}>
            <div className="xl:col-span-2">
              <SeasonCalendar
                events={rollup.events}
                seasonStart={selected.startDateKey}
                seasonEnd={selected.endDateKey}
                onSelectEvent={(id) => router.push(`/events/${id}/workspace`)}
              />
            </div>
            <SeasonQuarterlyPanel
              months={months}
              quarters={quarters}
              seasonProfit={rollup.profit}
              targetProfit={selected.targetProfit}
            />
          </section>
        ) : null}

        {selected && rollup ? (
          <section className="rounded-xl border border-[#232330] bg-[#11111A] p-4">
            <h2 className="text-[15px] font-semibold text-[#F5F5F7]">Assign events to this season</h2>
            <p className="mt-1 text-[12px] text-[#71717A]">
              Link existing events or create new ones — dates outside the season range still appear if explicitly assigned.
            </p>
            <ul className="mt-4 space-y-2">
              {managedEvents
                .filter((e) => e.status !== "canceled")
                .map((event) => (
                  <li
                    key={event.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#232330] bg-[#0B0B10] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-[#F5F5F7]">{event.name}</p>
                      <p className="text-[11px] text-[#71717A]">
                        {event.dateKey ?? "No date"} · {event.venueName}
                      </p>
                    </div>
                    <select
                      value={event.seasonId ?? ""}
                      onChange={(e) => {
                        const next = e.target.value || undefined;
                        assignEventSeason(event.id, next);
                      }}
                      className="rounded-md border border-[#3F3F46] bg-[#11111A] px-2 py-1 text-[12px] text-[#E4E4E7]"
                    >
                      <option value="">No season</option>
                      {seasons.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
            </ul>
          </section>
        ) : null}
      </div>
    </PageContent>
  );
}
