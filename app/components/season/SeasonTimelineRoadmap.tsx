"use client";

import { CalendarOff } from "lucide-react";

import SeasonRoadmapEventCard from "@/app/components/season/SeasonRoadmapEventCard";
import SeasonTimelineLane from "@/app/components/season/SeasonTimelineLane";
import SeasonViewToggle, { type SeasonViewMode } from "@/app/components/season/SeasonViewToggle";
import type { ManagedEventRecord } from "@/lib/data/events";
import type { TimelineMonthGroup } from "@/lib/season/season-insights";
import type { SeasonRecord } from "@/lib/data/seasons";
import {
  resolveVenueImage,
  type buildVenueImageLookup,
} from "@/lib/supabase/venue-summaries";
import { SECTION_CARD } from "@/lib/ui/page-surfaces";

type SeasonTimelineRoadmapProps = {
  monthGroups: TimelineMonthGroup[];
  unscheduled: ManagedEventRecord[];
  seasons: SeasonRecord[];
  venueLookup: ReturnType<typeof buildVenueImageLookup>;
  viewMode: SeasonViewMode;
  onViewModeChange: (mode: SeasonViewMode) => void;
  onSeasonChange?: () => void;
};

export default function SeasonTimelineRoadmap({
  monthGroups,
  unscheduled,
  seasons,
  venueLookup,
  viewMode,
  onViewModeChange,
  onSeasonChange,
}: SeasonTimelineRoadmapProps) {
  const hasEvents =
    monthGroups.some((g) => g.events.length > 0) || unscheduled.length > 0;

  return (
    <div className={[SECTION_CARD, "flex min-h-0 flex-1 flex-col overflow-hidden p-3"].join(" ")}>
      <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-semibold text-[#F5F5F7]">Season roadmap</h2>
          <p className="text-[11px] text-[#71717A]">
            Timeline lanes by month — cards positioned on event date.
          </p>
        </div>
        <SeasonViewToggle value={viewMode} onChange={onViewModeChange} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
        {!hasEvents ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#3F3F46] py-12 text-center">
            <CalendarOff className="size-8 text-[#52525B]" strokeWidth={1.5} />
            <p className="mt-3 text-[14px] font-medium text-[#A1A1AA]">No events in this season</p>
            <p className="mt-1 text-[12px] text-[#71717A]">
              Add an event or assign existing shows from the card menu.
            </p>
          </div>
        ) : null}

        {unscheduled.length > 0 ? (
          <section className="mb-3 border-b border-[#232330]/80 pb-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#F59E0B]">
                Unscheduled
              </span>
              <span className="text-[10px] text-[#71717A]">{unscheduled.length} shows</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {unscheduled.map((event) => (
                <SeasonRoadmapEventCard
                  key={event.id}
                  event={event}
                  seasons={seasons}
                  imageSrc={resolveVenueImage(event, venueLookup)}
                  onSeasonChange={onSeasonChange}
                />
              ))}
            </div>
          </section>
        ) : null}

        <div className="space-y-1">
          {monthGroups.map((group) => (
            <SeasonTimelineLane
              key={group.monthKey}
              group={group}
              seasons={seasons}
              venueLookup={venueLookup}
              onSeasonChange={onSeasonChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
