"use client";

import RunEventCard from "@/app/components/run/RunEventCard";
import CurrencyText from "@/app/components/ui/CurrencyText";
import type { TimelineMonthGroup } from "@/lib/run/run-insights";
import {
  resolveVenueImage,
  type buildVenueImageLookup,
} from "@/lib/supabase/venue-summaries";

type RunMonthRowProps = {
  group: TimelineMonthGroup;
  venueLookup: ReturnType<typeof buildVenueImageLookup>;
};

export default function RunMonthRow({ group, venueLookup }: RunMonthRowProps) {
  const profitPositive = group.profit >= 0;
  const hasEvents = group.events.length > 0;

  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)_64px] items-center gap-2 border-b border-[#232330]/70 py-2 last:border-0">
      <div>
        <p className="text-[12px] font-semibold text-[#F5F5F7]">{group.shortLabel}</p>
        <p className="text-[10px] text-[#52525B]">
          {group.eventCount} show{group.eventCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="min-w-0">
        {hasEvents ? (
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {group.events.map((event) => (
              <RunEventCard
                key={event.id}
                event={event}
                imageSrc={resolveVenueImage(event, venueLookup)}
              />
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-[#52525B]">No shows</p>
        )}
      </div>

      <p
        className={[
          "text-right text-[12px] font-bold tabular-nums",
          profitPositive ? "text-emerald-400" : "text-[#FCA5A5]",
        ].join(" ")}
      >
        <CurrencyText value={group.profit} />
      </p>
    </div>
  );
}
