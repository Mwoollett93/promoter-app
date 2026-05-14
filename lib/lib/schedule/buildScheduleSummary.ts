import type { EnrichedSlot, ScheduleSummary } from "../types/event-schedule";

export function buildScheduleSummary(
  eventStart: Date,
  enrichedSlots: EnrichedSlot[]
): ScheduleSummary {
  if (enrichedSlots.length === 0) {
    return {
      eventStart,
      eventEnd: new Date(eventStart.getTime()),
      totalRuntimeMinutes: 0,
      b2bSetCount: 0,
    };
  }

  const last = enrichedSlots[enrichedSlots.length - 1];
  const eventEnd = new Date(last.end.getTime());
  const totalRuntimeMinutes = Math.round(
    (eventEnd.getTime() - eventStart.getTime()) / 60_000
  );

  const b2bSetCount = enrichedSlots.filter(
    (s) => s.kind === "b2b" && s.artistIds.length > 1
  ).length;

  return {
    eventStart,
    eventEnd,
    totalRuntimeMinutes,
    b2bSetCount,
  };
}
