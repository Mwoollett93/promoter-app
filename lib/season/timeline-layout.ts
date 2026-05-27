import type { ManagedEventRecord } from "@/lib/data/events";

export type WeekTick = {
  day: number;
  label: string;
  pct: number;
};

export type PositionedEvent = {
  event: ManagedEventRecord;
  leftPct: number;
  stackIndex: number;
};

/** Day-of-month position as 0–100% across the month lane. */
export function dayPositionInMonth(dateKey: string, monthKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [my, mm] = monthKey.split("-").map(Number);
  if (y !== my || m !== mm || !d) return 50;

  const daysInMonth = new Date(y, m, 0).getDate();
  if (daysInMonth <= 1) return 50;
  return Math.min(96, Math.max(4, ((d - 1) / (daysInMonth - 1)) * 100));
}

export function buildWeekTicks(monthKey: string): WeekTick[] {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return [];

  const daysInMonth = new Date(y, m, 0).getDate();
  const tickDays = [1, 8, 15, 22, daysInMonth].filter(
    (day, i, arr) => arr.indexOf(day) === i,
  );

  return tickDays.map((day) => ({
    day,
    label: String(day),
    pct: daysInMonth <= 1 ? 50 : ((day - 1) / (daysInMonth - 1)) * 100,
  }));
}

export function positionEventsOnLane(
  events: ManagedEventRecord[],
  monthKey: string,
): PositionedEvent[] {
  const byDay = new Map<string, ManagedEventRecord[]>();
  for (const event of events) {
    if (!event.dateKey) continue;
    const list = byDay.get(event.dateKey) ?? [];
    list.push(event);
    byDay.set(event.dateKey, list);
  }

  const positioned: PositionedEvent[] = [];
  for (const [, dayEvents] of byDay) {
    dayEvents
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((event, stackIndex) => {
        positioned.push({
          event,
          leftPct: dayPositionInMonth(event.dateKey!, monthKey),
          stackIndex,
        });
      });
  }

  return positioned.sort((a, b) => a.leftPct - b.leftPct || a.stackIndex - b.stackIndex);
}
