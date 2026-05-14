import { describe, it, expect } from "vitest";
import { calculateScheduleTimes } from "./calculateScheduleTimes";
import { buildScheduleSummary } from "./buildScheduleSummary";
import type { Artist, ScheduleSlot } from "../types/event-schedule";

function mapArtists(artists: Artist[]): Map<string, Artist> {
  return new Map(artists.map((a) => [a.id, a]));
}

describe("calculateScheduleTimes", () => {
  it("chains singles back-to-back", () => {
    const eventStart = new Date("2026-05-24T22:00:00");
    const slots: ScheduleSlot[] = [
      {
        kind: "single",
        slotId: "a",
        artistId: "artist_kettama",
        durationMinutes: 60,
        feeCents: 100,
      },
      {
        kind: "single",
        slotId: "b",
        artistId: "artist_adiel",
        durationMinutes: 30,
        feeCents: 100,
      },
    ];

    const artists = mapArtists([
      {
        id: "artist_kettama",
        name: "KETTAMA",
        genres: [],
        tags: [],
        defaultFeeCents: 100,
      },
      {
        id: "artist_adiel",
        name: "Adiel",
        genres: [],
        tags: [],
        defaultFeeCents: 100,
      },
    ]);

    const enriched = calculateScheduleTimes(eventStart, slots, artists);

    expect(enriched).toHaveLength(2);
    expect(enriched[0].start.getTime()).toBe(eventStart.getTime());
    expect(enriched[0].end.getTime()).toBe(
      eventStart.getTime() + 60 * 60_000
    );
    expect(enriched[1].start.getTime()).toBe(enriched[0].end.getTime());
    expect(enriched[1].end.getTime()).toBe(
      enriched[1].start.getTime() + 30 * 60_000
    );
  });

  it("treats B2B as one shared window", () => {
    const eventStart = new Date("2026-05-24T22:00:00");
    const slots: ScheduleSlot[] = [
      {
        kind: "b2b",
        slotId: "b2b1",
        artistIds: ["artist_adiel", "artist_objekt"],
        durationMinutes: 45,
        feeCents: 200,
      },
    ];

    const artists = mapArtists([
      {
        id: "artist_adiel",
        name: "Adiel",
        genres: [],
        tags: [],
        defaultFeeCents: 100,
      },
      {
        id: "artist_objekt",
        name: "Objekt",
        genres: [],
        tags: [],
        defaultFeeCents: 100,
      },
    ]);

    const enriched = calculateScheduleTimes(eventStart, slots, artists);
    expect(enriched).toHaveLength(1);
    expect(enriched[0].kind).toBe("b2b");
    if (enriched[0].kind === "b2b") {
      expect(enriched[0].start.getTime()).toBe(eventStart.getTime());
      expect(enriched[0].end.getTime()).toBe(
        eventStart.getTime() + 45 * 60_000
      );
      expect(enriched[0].artists).toHaveLength(2);
    }
  });
});

describe("buildScheduleSummary", () => {
  it("counts B2B sets with more than one artist", () => {
    const eventStart = new Date("2026-05-24T22:00:00");
    const slots: ScheduleSlot[] = [
      {
        kind: "single",
        slotId: "s1",
        artistId: "artist_kettama",
        durationMinutes: 60,
        feeCents: 100,
      },
      {
        kind: "b2b",
        slotId: "b2b1",
        artistIds: ["artist_adiel", "artist_objekt"],
        durationMinutes: 60,
        feeCents: 200,
      },
    ];

    const artists = mapArtists([
      {
        id: "artist_kettama",
        name: "KETTAMA",
        genres: [],
        tags: [],
        defaultFeeCents: 100,
      },
      {
        id: "artist_adiel",
        name: "Adiel",
        genres: [],
        tags: [],
        defaultFeeCents: 100,
      },
      {
        id: "artist_objekt",
        name: "Objekt",
        genres: [],
        tags: [],
        defaultFeeCents: 100,
      },
    ]);

    const enriched = calculateScheduleTimes(eventStart, slots, artists);
    const summary = buildScheduleSummary(eventStart, enriched);

    expect(summary.b2bSetCount).toBe(1);
    expect(summary.totalRuntimeMinutes).toBe(120);
  });
});
