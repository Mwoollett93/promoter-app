"use client";

import Link from "next/link";
import * as React from "react";
import { ChevronDown, Plus } from "lucide-react";

import StartNewEventLink from "@/app/components/events/StartNewEventLink";
import PageContent from "@/app/components/layout/PageContent";
import RunFinancialsPanel from "@/app/components/run/RunFinancialsPanel";
import RunInsightsSidebar from "@/app/components/run/RunInsightsSidebar";
import RunSummaryStrip from "@/app/components/run/RunSummaryStrip";
import RunTimeline from "@/app/components/run/RunTimeline";
import { loadManagedEvents } from "@/lib/data/events";
import { buildRunInsights } from "@/lib/run/run-insights";
import {
  buildTimeframeOptions,
  defaultTimeframeId,
  findTimeframeOption,
  formatTimeframeRange,
  type TimeframeId,
} from "@/lib/run/timeframe";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { GRID_CARD_GAP } from "@/lib/layout/page-layout";
import { getStoredSession, getSupabaseConfig } from "@/lib/supabase/browser";
import { buildVenueImageLookup, listVenueSummaries } from "@/lib/supabase/venue-summaries";
import { PAGE_EYEBROW, SELECT_SURFACE } from "@/lib/ui/page-surfaces";

const TIMEFRAME_STORAGE_KEY = "promosync:run-timeframe";

export default function RunPageContent() {
  const { workspace, events, ready } = useWorkspace();
  const timeframeOptions = React.useMemo(() => buildTimeframeOptions(), []);
  const [timeframeId, setTimeframeId] = React.useState<TimeframeId>(() => {
    if (typeof window === "undefined") return defaultTimeframeId(timeframeOptions);
    return window.localStorage.getItem(TIMEFRAME_STORAGE_KEY) ?? defaultTimeframeId(timeframeOptions);
  });
  const [showFinancials, setShowFinancials] = React.useState(false);
  const [venueLookup, setVenueLookup] = React.useState(() => buildVenueImageLookup([]));
  const [refreshKey, setRefreshKey] = React.useState(0);

  const timeframe =
    findTimeframeOption(timeframeId, timeframeOptions) ?? timeframeOptions[0]!;

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TIMEFRAME_STORAGE_KEY, timeframeId);
  }, [timeframeId]);

  React.useEffect(() => {
    const onUpdate = () => setRefreshKey((k) => k + 1);
    window.addEventListener("promosync:events-updated", onUpdate);
    return () => window.removeEventListener("promosync:events-updated", onUpdate);
  }, []);

  React.useEffect(() => {
    const session = getStoredSession();
    if (!session || !getSupabaseConfig() || !workspace?.id) return;
    void listVenueSummaries(session, workspace.id).then((venues) => {
      setVenueLookup(buildVenueImageLookup(venues));
    });
  }, [workspace?.id]);

  const managedEvents = React.useMemo(() => {
    void refreshKey;
    return loadManagedEvents();
  }, [events, refreshKey]);

  const insights = React.useMemo(
    () => buildRunInsights(managedEvents, timeframe),
    [managedEvents, timeframe],
  );

  if (!ready || !workspace) {
    return (
      <PageContent>
        <p className="text-[#A1A1AA]">Loading run overview…</p>
      </PageContent>
    );
  }

  return (
    <PageContent fill>
      <div className="flex min-h-0 flex-1 flex-col gap-2.5">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#232330] pb-2.5">
          <div className="flex min-w-0 flex-wrap items-start gap-3">
            <div>
              <p className={PAGE_EYEBROW}>Promoter workspace</p>
              <h1 className="text-[18px] font-semibold tracking-tight text-[#F5F5F7]">
                Run Overview
              </h1>
              <p className="text-[13px] font-medium text-[#C4B5FD]">{timeframe.shortLabel}</p>
              <p className="text-[12px] text-[#71717A]">
                {formatTimeframeRange(timeframe.bounds)}
              </p>
              <p className="mt-1 max-w-xl text-[11px] leading-4 text-[#52525B]">
                Track upcoming shows, financial health, and operational risks across the selected
                timeframe.
              </p>
            </div>
            <div className="relative min-w-[200px] pt-1">
              <label className="sr-only" htmlFor="timeframe-select">
                Timeframe
              </label>
              <select
                id="timeframe-select"
                value={timeframeId}
                onChange={(e) => setTimeframeId(e.target.value)}
                className={`${SELECT_SURFACE} w-full appearance-none pr-8`}
              >
                {timeframeOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-[calc(50%+2px)] size-4 -translate-y-1/2 text-[#71717A]"
                aria-hidden
              />
            </div>
          </div>

          <StartNewEventLink
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[rgba(139,92,246,0.45)] bg-[#7C3AED] px-4 text-[13px] font-medium text-white hover:bg-[#6D28D9]"
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            Add event
          </StartNewEventLink>
        </header>

        <RunSummaryStrip snapshot={insights.snapshot} />

        <div
          className={`grid min-h-0 flex-1 grid-cols-1 gap-2.5 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px] ${GRID_CARD_GAP}`}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-2.5">
            <RunTimeline
              monthGroups={insights.monthGroups}
              venueLookup={venueLookup}
              showFinancials={showFinancials}
              onToggleFinancials={() => setShowFinancials((v) => !v)}
            />
            {showFinancials ? (
              <RunFinancialsPanel snapshot={insights.snapshot} months={insights.months} />
            ) : null}
          </div>

          <RunInsightsSidebar
            snapshot={insights.snapshot}
            alerts={insights.alerts}
            months={insights.months}
          />
        </div>
      </div>
    </PageContent>
  );
}
