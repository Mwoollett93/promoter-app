"use client";

import UpcomingEventRow, {
  type UpcomingEventRowProps,
} from "@/app/components/dashboard/UpcomingEventRow";
import { cn } from "@/lib/utils";

/** Visible peek of each stacked card below the first (px). */
const CARD_OVERLAP_PX = 52;

type UpcomingEventsStackProps = {
  events: UpcomingEventRowProps[];
};

/**
 * Overlapping event card stack — cards share vertical space instead of
 * stretching the panel with empty gaps at 100% zoom.
 */
export default function UpcomingEventsStack({ events }: UpcomingEventsStackProps) {
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-[#3F3F46] px-4 py-8 text-center text-[13px] text-[#A1A1AA]">
        No upcoming events yet. Create one to see it here.
      </div>
    );
  }

  return (
    <ul className="relative m-0 list-none p-0 pb-1">
      {events.map((event, index) => (
        <li
          key={`${event.href ?? event.title}-${index}`}
          className={cn(
            "relative transition-[transform,box-shadow] duration-200 ease-out",
            "hover:z-30 hover:-translate-y-1 focus-within:z-30 focus-within:-translate-y-1",
            index > 0 && "mt-0",
          )}
          style={{
            zIndex: index + 1,
            marginTop: index === 0 ? 0 : -CARD_OVERLAP_PX,
          }}
        >
          <UpcomingEventRow
            {...event}
            className="shadow-[0_8px_28px_rgba(0,0,0,0.45)] hover:border-[#8B5CF6]/35 hover:shadow-[0_12px_36px_rgba(0,0,0,0.55)]"
          />
        </li>
      ))}
    </ul>
  );
}
