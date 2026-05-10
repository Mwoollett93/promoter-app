import type {
  Artist,
  EnrichedSlot,
  ScheduleSlot,
  ScheduledArtist,
} from "../types/event-schedule";

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function toScheduledArtist(
  artistsById: Map<string, Artist>,
  artistId: string
): ScheduledArtist {
  const artist = artistsById.get(artistId);
  if (!artist) {
    return { artistId, name: "Unknown artist" };
  }
  return {
    artistId,
    name: artist.name,
    avatarUrl: artist.avatarUrl,
  };
}

/**
 * Pure: sequential slots from `eventStart`.
 * - Single slot: one artist, consumes its duration.
 * - B2B slot: one shared window for all artists in the group.
 *
 * `order` is 1-based for display ("ORDER" column).
 */
export function calculateScheduleTimes(
  eventStart: Date,
  slots: ScheduleSlot[],
  artistsById: Map<string, Artist>
): EnrichedSlot[] {
  let cursor = new Date(eventStart.getTime());
  const result: EnrichedSlot[] = [];

  slots.forEach((slot, index) => {
    const order = index + 1;

    if (slot.durationMinutes <= 0) {
      throw new Error(
        `Slot ${slot.slotId} has invalid durationMinutes (${slot.durationMinutes})`
      );
    }

    const start = new Date(cursor.getTime());
    const end = addMinutes(start, slot.durationMinutes);

    if (slot.kind === "single") {
      result.push({
        kind: "single",
        slotId: slot.slotId,
        artistId: slot.artistId,
        durationMinutes: slot.durationMinutes,
        feeCents: slot.feeCents,
        artist: toScheduledArtist(artistsById, slot.artistId),
        start,
        end,
        order,
      });
    } else {
      result.push({
        kind: "b2b",
        slotId: slot.slotId,
        artistIds: [...slot.artistIds],
        artists: slot.artistIds.map((id) => toScheduledArtist(artistsById, id)),
        durationMinutes: slot.durationMinutes,
        feeCents: slot.feeCents,
        start,
        end,
        order,
      });
    }

    cursor = end;
  });

  return result;
}
