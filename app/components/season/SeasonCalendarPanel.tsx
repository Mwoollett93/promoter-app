"use client";

import SeasonCalendar from "@/app/components/season/SeasonCalendar";
import SeasonViewToggle, { type SeasonViewMode } from "@/app/components/season/SeasonViewToggle";
import type { ManagedEventRecord } from "@/lib/data/events";
import type { SeasonRecord } from "@/lib/data/seasons";
import { SECTION_CARD } from "@/lib/ui/page-surfaces";

type SeasonCalendarPanelProps = {
  season: SeasonRecord;
  events: ManagedEventRecord[];
  viewMode: SeasonViewMode;
  onViewModeChange: (mode: SeasonViewMode) => void;
};

export default function SeasonCalendarPanel({
  season,
  events,
  viewMode,
  onViewModeChange,
}: SeasonCalendarPanelProps) {
  const scheduled = events.filter((e) => e.dateKey);

  return (
    <div className={[SECTION_CARD, "flex min-h-0 flex-1 flex-col overflow-hidden p-3"].join(" ")}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-semibold text-[#F5F5F7]">Season calendar</h2>
          <p className="text-[11px] text-[#71717A]">Month grid view for date planning.</p>
        </div>
        <SeasonViewToggle value={viewMode} onChange={onViewModeChange} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <SeasonCalendar
          events={scheduled}
          seasonStart={season.startDateKey}
          seasonEnd={season.endDateKey}
        />
      </div>
    </div>
  );
}
