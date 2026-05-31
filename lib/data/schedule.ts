import type { ScheduleSlot } from "../types/event-schedule";

/** Legacy fixture loader — wizard starts with an empty lineup. */
export async function getInitialScheduleSlots(): Promise<ScheduleSlot[]> {
  return [];
}
