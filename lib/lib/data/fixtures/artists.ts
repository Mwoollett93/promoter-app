import type { Artist } from "../../types/event-schedule";

/** Dev / seed artists — replace with Supabase `select()` later. */
export const fixtureArtists: Artist[] = [
  {
    id: "artist_kettama",
    name: "KETTAMA",
    genres: ["Techno", "House"],
    tags: ["headline", "ireland"],
    defaultFeeCents: 150_000,
  },
  {
    id: "artist_adiel",
    name: "Adiel",
    genres: ["Techno"],
    tags: ["dj"],
    defaultFeeCents: 120_000,
  },
  {
    id: "artist_objekt",
    name: "Objekt",
    genres: ["Electro", "UK"],
    tags: ["live"],
    defaultFeeCents: 130_000,
  },
];
