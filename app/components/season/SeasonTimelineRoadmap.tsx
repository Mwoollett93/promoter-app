"use client";

import { CalendarOff } from "lucide-react";

import SeasonRoadmapEventCard from "@/app/components/season/SeasonRoadmapEventCard";
import CurrencyText from "@/app/components/ui/CurrencyText";
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
  onSeasonChange?: () => void;
};

export default function SeasonTimelineRoadmap({
  monthGroups,
  unscheduled,
  seasons,
  venueLookup,
  onSeasonChange,
}: SeasonTimelineRoadmapProps) {
  const hasEvents =
    monthGroups.some((g) => g.events.length > 0) || unscheduled.length > 0;

  return (
    <div className={[SECTION_CARD, "flex min-h-0 flex-1 flex-col overflow-hidden p-4"].join(" ")}>
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-semibold text-[#F5F5F7]">Season roadmap</h2>
          <p className="text-[12px] text-[#71717A]">
            Shows grouped by month — scroll horizontally within each lane.
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {!hasEvents ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#3F3F46] py-16 text-center">
            <CalendarOff className="size-8 text-[#52525B]" strokeWidth={1.5} />
            <p className="mt-3 text-[14px] font-medium text-[#A1A1AA]">No events in this season</p>
            <p className="mt-1 text-[12px] text-[#71717A]">
              Add an event or assign existing shows from the card menu.
            </p>
          </div>
        ) : null}

        {unscheduled.length > 0 ? (
          <section>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#F59E0B]">
                Unscheduled
              </span>
              <span className="text-[11px] text-[#71717A]">{unscheduled.length} shows</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
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

        {monthGroups.map((group) => (
          <section key={group.monthKey} className="relative">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-l-2 border-[#8B5CF6] pl-3">
              <div>
                <h3 className="text-[13px] font-semibold text-[#F5F5F7]">{group.label}</h3>
                <p className="text-[11px] text-[#71717A]">
                  {group.eventCount} show{group.eventCount === 1 ? "" : "s"}
                </p>
              </div>
              <p
                className={[
                  "text-[12px] font-semibold tabular-nums",
                  group.profit >= 0 ? "text-emerald-400" : "text-[#FCA5A5]",
                ].join(" ")}
              >
                <CurrencyText value={group.profit} />
              </p>
            </div>

            {group.events.length > 0 ? (
              <div className="relative ml-3 border-l border-[#232330] pl-4">
                <div className="flex gap-3 overflow-x-auto pb-2 pt-1">
                  {group.events.map((event) => (
                    <SeasonRoadmapEventCard
                      key={event.id}
                      event={event}
                      seasons={seasons}
                      imageSrc={resolveVenueImage(event, venueLookup)}
                      onSeasonChange={onSeasonChange}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="ml-6 text-[11px] text-[#52525B]">No shows this month</p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
