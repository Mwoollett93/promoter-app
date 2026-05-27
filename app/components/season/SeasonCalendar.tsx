"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import EventStatusBadge from "@/app/components/ui/EventStatusBadge";
import type { ManagedEventRecord } from "@/lib/data/events";
import { parseDateKey } from "@/lib/data/seasons";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type SeasonCalendarProps = {
  events: ManagedEventRecord[];
  seasonStart: string;
  seasonEnd: string;
  onSelectEvent?: (eventId: string) => void;
};

function monthStart(year: number, month: number) {
  return new Date(year, month, 1);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

/** Monday-based offset (0 = Monday). */
function mondayOffset(d: Date) {
  const day = d.getDay();
  return day === 0 ? 6 : day - 1;
}

export default function SeasonCalendar({
  events,
  seasonStart,
  seasonEnd,
  onSelectEvent,
}: SeasonCalendarProps) {
  const start = parseDateKey(seasonStart) ?? new Date();
  const [viewYear, setViewYear] = React.useState(start.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(start.getMonth());

  const eventsByDay = React.useMemo(() => {
    const map = new Map<string, ManagedEventRecord[]>();
    for (const event of events) {
      if (!event.dateKey) continue;
      const list = map.get(event.dateKey) ?? [];
      list.push(event);
      map.set(event.dateKey, list);
    }
    return map;
  }, [events]);

  const first = monthStart(viewYear, viewMonth);
  const totalDays = daysInMonth(viewYear, viewMonth);
  const offset = mondayOffset(first);
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = first.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  return (
    <div className="rounded-xl border border-[#232330] bg-[#11111A] p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[15px] font-semibold text-[#F5F5F7]">{monthLabel}</h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-md border border-[#3F3F46] p-1.5 text-[#A1A1AA] hover:bg-[#18181F] hover:text-[#F5F5F7]"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-md border border-[#3F3F46] p-1.5 text-[#A1A1AA] hover:bg-[#18181F] hover:text-[#F5F5F7]"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-[#71717A]">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (day == null) {
            return <div key={`empty-${index}`} className="min-h-[72px] rounded-md bg-transparent" />;
          }

          const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const inSeason = dateKey >= seasonStart && dateKey <= seasonEnd;
          const dayEvents = eventsByDay.get(dateKey) ?? [];

          return (
            <div
              key={dateKey}
              className={[
                "min-h-[72px] rounded-md border p-1 text-left",
                inSeason ? "border-[#232330] bg-[#0B0B10]" : "border-transparent bg-[#08080C]/40 opacity-50",
              ].join(" ")}
            >
              <span className="text-[11px] font-medium text-[#A1A1AA]">{day}</span>
              <ul className="mt-0.5 space-y-0.5">
                {dayEvents.slice(0, 2).map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => onSelectEvent?.(event.id)}
                      className="w-full truncate rounded px-1 py-0.5 text-left text-[9px] font-medium text-[#E4E4E7] hover:bg-[#1A1630]"
                      title={event.name}
                    >
                      {event.name}
                    </button>
                  </li>
                ))}
                {dayEvents.length > 2 ? (
                  <li className="px-1 text-[9px] text-[#71717A]">+{dayEvents.length - 2} more</li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>

      {events.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-[#232330] pt-3">
          {events
            .filter((e) => e.dateKey)
            .sort((a, b) => (a.dateKey! < b.dateKey! ? -1 : 1))
            .map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onSelectEvent?.(event.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#232330] bg-[#0B0B10] px-3 py-2 text-left hover:border-[#3F3F46]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-[#F5F5F7]">{event.name}</p>
                    <p className="text-[11px] text-[#71717A]">
                      {event.dateKey} · {event.venueName}
                    </p>
                  </div>
                  <EventStatusBadge status={event.status} />
                </button>
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}
