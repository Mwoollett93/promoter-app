"use client";

import UpcomingEventRow, {
  type UpcomingEventRowProps,
} from "@/app/components/dashboard/UpcomingEventRow";
import { PAGE_STACK_GAP } from "@/lib/layout/page-layout";

type UpcomingEventsListProps = {
  events: UpcomingEventRowProps[];
};

/** Evenly spaced upcoming events — scrolls inside its panel when the list is long. */
export default function UpcomingEventsList({ events }: UpcomingEventsListProps) {
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-[#3F3F46] px-4 py-8 text-center text-[13px] text-[#A1A1AA]">
        No upcoming events yet. Create one to see it here.
      </div>
    );
  }

  return (
    <ul className={`m-0 flex list-none flex-col ${PAGE_STACK_GAP} p-0`}>
      {events.map((event, index) => (
        <li key={`${event.href ?? event.title}-${index}`} className="shrink-0">
          <UpcomingEventRow {...event} />
        </li>
      ))}
    </ul>
  );
}
