"use client";

import { CalendarOff } from "lucide-react";

import RunMonthRow from "@/app/components/run/RunMonthRow";
import type { TimelineMonthGroup } from "@/lib/run/run-insights";
import {
  type buildVenueImageLookup,
} from "@/lib/supabase/venue-summaries";
import { SECTION_CARD } from "@/lib/ui/page-surfaces";

type RunTimelineProps = {
  monthGroups: TimelineMonthGroup[];
  venueLookup: ReturnType<typeof buildVenueImageLookup>;
  showFinancials: boolean;
  onToggleFinancials: () => void;
};

export default function RunTimeline({
  monthGroups,
  venueLookup,
  showFinancials,
  onToggleFinancials,
}: RunTimelineProps) {
  const hasAnyEvents = monthGroups.some((g) => g.events.length > 0);
  const displayGroups = hasAnyEvents
    ? monthGroups.filter((g) => g.events.length > 0)
    : monthGroups;

  return (
    <div className={[SECTION_CARD, "flex min-h-0 flex-1 flex-col overflow-hidden p-3"].join(" ")}>
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[#F5F5F7]">Upcoming shows</h2>
          <p className="text-[11px] text-[#71717A]">By month within the selected timeframe</p>
        </div>
        <button
          type="button"
          onClick={onToggleFinancials}
          className={[
            "shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors",
            showFinancials
              ? "border-[#8B5CF6]/40 bg-[#1A1630] text-[#C4B5FD]"
              : "border-[#3F3F46] text-[#A1A1AA] hover:border-[#52525B] hover:text-[#E4E4E7]",
          ].join(" ")}
        >
          {showFinancials ? "Hide financials" : "Expanded financials"}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!hasAnyEvents ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#3F3F46] py-10 text-center">
            <CalendarOff className="size-7 text-[#52525B]" strokeWidth={1.5} />
            <p className="mt-2 text-[13px] font-medium text-[#A1A1AA]">No shows in this timeframe</p>
            <p className="mt-1 text-[11px] text-[#71717A]">
              Events appear here automatically when their date falls in the range.
            </p>
          </div>
        ) : (
          <div>
            {displayGroups.map((group) => (
              <RunMonthRow key={group.monthKey} group={group} venueLookup={venueLookup} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
