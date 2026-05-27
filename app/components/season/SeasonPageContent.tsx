"use client";

import Link from "next/link";
import * as React from "react";
import { ChevronDown, Plus } from "lucide-react";

import PageContent from "@/app/components/layout/PageContent";
import CreateSeasonModal from "@/app/components/season/CreateSeasonModal";
import SeasonInsightsSidebar from "@/app/components/season/SeasonInsightsSidebar";
import SeasonTimelineRoadmap from "@/app/components/season/SeasonTimelineRoadmap";
import Button from "@/app/components/ui/Button";
import { loadManagedEvents } from "@/lib/data/events";
import {
  createSeason,
  currentQuarter,
  dateKeyFromDate,
  ensureDefaultSeason,
  loadSeasons,
  type SeasonRecord,
} from "@/lib/data/seasons";
import { buildSeasonInsights, formatSeasonDateRange } from "@/lib/season/season-insights";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { GRID_CARD_GAP } from "@/lib/layout/page-layout";
import { getStoredSession, getSupabaseConfig } from "@/lib/supabase/browser";
import { buildVenueImageLookup, listVenueSummaries } from "@/lib/supabase/venue-summaries";
import { PAGE_EYEBROW, SELECT_SURFACE } from "@/lib/ui/page-surfaces";

export default function SeasonPageContent() {
  const { workspace, events, ready } = useWorkspace();
  const [seasons, setSeasons] = React.useState<SeasonRecord[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newStart, setNewStart] = React.useState("");
  const [newEnd, setNewEnd] = React.useState("");
  const [venueLookup, setVenueLookup] = React.useState(
    () => buildVenueImageLookup([]),
  );
  const [refreshKey, setRefreshKey] = React.useState(0);

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
    const onUpdate = () => {
      refreshSeasons();
      setRefreshKey((k) => k + 1);
    };
    window.addEventListener("promosync:seasons-updated", onUpdate);
    window.addEventListener("promosync:events-updated", onUpdate);
    return () => {
      window.removeEventListener("promosync:seasons-updated", onUpdate);
      window.removeEventListener("promosync:events-updated", onUpdate);
    };
  }, [refreshSeasons]);

  React.useEffect(() => {
    const session = getStoredSession();
    if (!session || !getSupabaseConfig()) return;
    void listVenueSummaries(session).then((venues) => {
      setVenueLookup(buildVenueImageLookup(venues));
    });
  }, [workspace?.id]);

  const selected = seasons.find((s) => s.id === selectedId) ?? seasons[0] ?? null;

  const managedEvents = React.useMemo(() => {
    void refreshKey;
    return loadManagedEvents();
  }, [events, refreshKey]);

  const insights = React.useMemo(() => {
    if (!selected) return null;
    return buildSeasonInsights(managedEvents, selected);
  }, [managedEvents, selected]);

  function bumpEvents() {
    setRefreshKey((k) => k + 1);
  }

  function handleCreateSeason() {
    if (!workspace || !newName.trim() || !newStart || !newEnd) return;
    const season = createSeason({
      workspaceId: workspace.id,
      name: newName.trim(),
      startDateKey: newStart,
      endDateKey: newEnd,
    });
    setSelectedId(season.id);
    setCreateOpen(false);
    setNewName("");
    setNewStart("");
    setNewEnd("");
    refreshSeasons();
  }

  function handleQuickCreateQuarter() {
    if (!workspace) return;
    const { year, quarter } = currentQuarter();
    const startMonth = (quarter - 1) * 3;
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 3, 0);
    if (createOpen) {
      setNewName(`Q${quarter} ${year}`);
      setNewStart(dateKeyFromDate(start));
      setNewEnd(dateKeyFromDate(end));
      return;
    }
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
        <p className="text-[#A1A1AA]">Loading season command center…</p>
      </PageContent>
    );
  }

  return (
    <PageContent fill>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#232330] pb-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <div>
              <p className={PAGE_EYEBROW}>Season command center</p>
              <p className="text-[13px] text-[#71717A]">
                {selected ? formatSeasonDateRange(selected) : "Select a season"}
              </p>
            </div>
            <div className="relative min-w-[180px]">
              <label className="sr-only" htmlFor="season-select">
                Season
              </label>
              <select
                id="season-select"
                value={selected?.id ?? ""}
                onChange={(e) => setSelectedId(e.target.value)}
                className={`${SELECT_SURFACE} w-full appearance-none pr-8`}
              >
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#71717A]"
                aria-hidden
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setCreateOpen(true)}>
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
              Add event
            </Link>
          </div>
        </header>

        {selected && insights ? (
          <div
            className={`grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px] ${GRID_CARD_GAP}`}
          >
            <SeasonTimelineRoadmap
              monthGroups={insights.monthGroups}
              unscheduled={insights.unscheduled}
              seasons={seasons}
              venueLookup={venueLookup}
              onSeasonChange={bumpEvents}
            />

            <SeasonInsightsSidebar
              snapshot={insights.snapshot}
              alerts={insights.alerts}
              trendValues={insights.trendValues}
              targetProfit={selected.targetProfit}
            />
          </div>
        ) : null}
      </div>

      <CreateSeasonModal
        open={createOpen}
        name={newName}
        startDate={newStart}
        endDate={newEnd}
        onNameChange={setNewName}
        onStartChange={setNewStart}
        onEndChange={setNewEnd}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreateSeason}
        onQuickQuarter={handleQuickCreateQuarter}
      />
    </PageContent>
  );
}
