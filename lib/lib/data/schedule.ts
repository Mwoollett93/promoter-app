import type { ScheduleSlot } from "../types/event-schedule";
import { fixtureScheduleSlots } from "./fixtures/schedule";

/**
 * Eventual: load slots for `eventId` from Supabase.
 * Today: fixtures (or pass `[]` from fixtures file if you prefer empty default).
 */
export async function getInitialScheduleSlots(): Promise<ScheduleSlot[]> {
  return fixtureScheduleSlots;
}
