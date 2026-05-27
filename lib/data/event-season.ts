import { loadManagedEvents, publishManagedEvents, type ManagedEventRecord } from "@/lib/data/events";

export function assignEventSeason(eventId: string, seasonId: string | undefined) {
  const events = loadManagedEvents();
  const now = new Date().toISOString();
  const next = events.map((event) =>
    event.id === eventId ? { ...event, seasonId, updatedAt: now } : event,
  );
  publishManagedEvents(next);
}

export function eventsForSeason(
  events: ManagedEventRecord[],
  seasonId: string,
  startDateKey: string,
  endDateKey: string,
) {
  return events.filter((event) => {
    if (event.status === "canceled") return false;
    if (event.seasonId === seasonId) return true;
    if (!event.dateKey) return false;
    return event.dateKey >= startDateKey && event.dateKey <= endDateKey;
  });
}
