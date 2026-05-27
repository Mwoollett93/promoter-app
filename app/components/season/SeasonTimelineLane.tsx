"use client";

import SeasonRoadmapEventCard from "@/app/components/season/SeasonRoadmapEventCard";
import CurrencyText from "@/app/components/ui/CurrencyText";
import type { TimelineMonthGroup } from "@/lib/season/season-insights";
import {
  buildWeekTicks,
  positionEventsOnLane,
} from "@/lib/season/timeline-layout";
import type { SeasonRecord } from "@/lib/data/seasons";
import {
  resolveVenueImage,
  type buildVenueImageLookup,
} from "@/lib/supabase/venue-summaries";

const LANE_HEIGHT = 108;
const CARD_HALF = 134;

type SeasonTimelineLaneProps = {
  group: TimelineMonthGroup;
  seasons: SeasonRecord[];
  venueLookup: ReturnType<typeof buildVenueImageLookup>;
  onSeasonChange?: () => void;
};

export default function SeasonTimelineLane({
  group,
  seasons,
  venueLookup,
  onSeasonChange,
}: SeasonTimelineLaneProps) {
  const ticks = buildWeekTicks(group.monthKey);
  const positioned = positionEventsOnLane(group.events, group.monthKey);
  const maxStack = positioned.reduce((m, p) => Math.max(m, p.stackIndex), 0);
  const railHeight = LANE_HEIGHT + maxStack * 12;
  const profitPositive = group.profit >= 0;

  return (
    <div className="grid grid-cols-[100px_minmax(0,1fr)_72px] items-start gap-2 border-b border-[#232330]/80 pb-2 last:border-0">
      <div className="pt-1">
        <p className="text-[12px] font-semibold leading-tight text-[#F5F5F7]">
          {group.label.split(" ")[0]}
        </p>
        <p className="text-[10px] text-[#71717A]">{group.label.split(" ").slice(1).join(" ")}</p>
        <p className="mt-1 text-[10px] text-[#52525B]">
          {group.eventCount} show{group.eventCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="relative min-w-0" style={{ minHeight: railHeight + CARD_HALF }}>
        <div
          className="absolute left-0 right-0 top-[calc(50%+8px)] h-px bg-[#3F3F46]"
          aria-hidden
        />
        <div
          className="absolute left-0 right-0 top-[calc(50%+8px)] h-px bg-gradient-to-r from-transparent via-[#8B5CF6]/40 to-transparent"
          aria-hidden
        />

        {ticks.map((tick) => (
          <div
            key={tick.day}
            className="absolute top-[calc(50%-2px)] -translate-x-1/2"
            style={{ left: `${tick.pct}%` }}
          >
            <div className="h-2 w-px bg-[#52525B]" aria-hidden />
            <span className="mt-1 block text-center text-[9px] tabular-nums text-[#52525B]">
              {tick.label}
            </span>
          </div>
        ))}

        {positioned.map(({ event, leftPct, stackIndex }) => (
          <div
            key={event.id}
            className="absolute -translate-x-1/2"
            style={{
              left: `${leftPct}%`,
              top: 8 + stackIndex * 10,
            }}
          >
            <SeasonRoadmapEventCard
              event={event}
              seasons={seasons}
              imageSrc={resolveVenueImage(event, venueLookup)}
              onSeasonChange={onSeasonChange}
              compact
            />
          </div>
        ))}

        {group.events.length === 0 ? (
          <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[11px] text-[#52525B]">
            No shows scheduled
          </p>
        ) : null}
      </div>

      <div className="pt-1 text-right">
        <p
          className={[
            "text-[13px] font-bold tabular-nums",
            profitPositive ? "text-emerald-400" : "text-[#FCA5A5]",
          ].join(" ")}
        >
          <CurrencyText value={group.profit} />
        </p>
        <p className="text-[9px] text-[#52525B]">month</p>
      </div>
    </div>
  );
}
