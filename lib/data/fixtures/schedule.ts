import type { ScheduleSlot } from "../../types/event-schedule";

/** Optional initial lineup for local dev — or `[]` for empty schedule. */
export const fixtureScheduleSlots: ScheduleSlot[] = [
  {
    kind: "single",
    slotId: "slot_1",
    artistId: "artist_kettama",
    durationMinutes: 90,
    feeCents: 150_000,
  },
  {
    kind: "b2b",
    slotId: "slot_2",
    artistIds: ["artist_adiel", "artist_objekt"],
    durationMinutes: 60,
    feeCents: 200_000,
  },
];
