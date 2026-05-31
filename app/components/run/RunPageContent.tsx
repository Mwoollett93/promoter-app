"use client";

import * as React from "react";
import { CalendarPlus, ChevronDown } from "lucide-react";

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
import { GRID_CARD_GAP, PAGE_STACK_GAP } from "@/lib/layout/page-layout";
import { getStoredSession, getSupabaseConfig } from "@/lib/supabase/browser";
import { buildVenueImageLookup, listVenueSummaries } from "@/lib/supabase/venue-summaries";
import { SELECT_SURFACE } from "@/lib/ui/page-surfaces";

const TIMEFRAME_STORAGE_KEY = "promosync:run-timeframe";

const CREATE_EVENT_BUTTON =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[8px] border border-[rgba(139,92,246,0.45)] bg-[#7C3AED] px-6 text-[16px] font-medium leading-5 tracking-[0.08px] text-white transition-all hover:border-[#A855F7] hover:bg-[linear-gradient(178.683deg,#7C3AED_4.7705%,rgba(71,33,135,0.76)_96.232%)] hover:shadow-[0_0_24px_0_rgba(139,92,246,0.3)] active:bg-[rgba(124,58,237,0.44)]";

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
      <div className={`flex h-full min-h-0 flex-col overflow-hidden ${PAGE_STACK_GAP}`}>
        <header
          className={`flex shrink-0 flex-col ${PAGE_STACK_GAP} lg:flex-row lg:items-start lg:justify-between`}
        >
          <div>
            <h1 className="text-[32px] font-bold leading-9 tracking-tight text-[#F5F5F7]">Run</h1>
            <p className="mt-1 text-[14px] leading-5 text-[#A1A1AA]">
              Track upcoming shows, financial health, and operational risks across the selected
              timeframe.
            </p>
            <p className="mt-0.5 text-[12px] text-[#71717A]">
              {timeframe.label} · {formatTimeframeRange(timeframe.bounds)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px]">
              <label className="sr-only" htmlFor="timeframe-select">
                Timeframe
              </label>
              <select
                id="timeframe-select"
                value={timeframeId}
                onChange={(e) => setTimeframeId(e.target.value)}
                className={`${SELECT_SURFACE} h-11 w-full appearance-none pr-8`}
              >
                {timeframeOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#71717A]"
                aria-hidden
              />
            </div>
            <StartNewEventLink className={CREATE_EVENT_BUTTON}>
              <CalendarPlus className="size-5 shrink-0" strokeWidth={2} aria-hidden />
              Create New Event
            </StartNewEventLink>
          </div>
        </header>

        <div className="shrink-0">
          <RunSummaryStrip snapshot={insights.snapshot} />
        </div>

        <div
          className={`grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px] lg:items-stretch ${GRID_CARD_GAP}`}
        >
          <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
            <RunTimeline
              monthGroups={insights.monthGroups}
              venueLookup={venueLookup}
              showFinancials={showFinancials}
              onToggleFinancials={() => setShowFinancials((v) => !v)}
            />
            {showFinancials ? (
              <div className="max-h-[min(240px,32vh)] shrink-0 overflow-y-auto overscroll-contain">
                <RunFinancialsPanel snapshot={insights.snapshot} months={insights.months} />
              </div>
            ) : null}
          </div>

          <RunInsightsSidebar alerts={insights.alerts} months={insights.months} />
        </div>
      </div>
    </PageContent>
  );
}
