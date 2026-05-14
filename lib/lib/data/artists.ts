import type { Artist } from "../types/event-schedule";
import { fixtureArtists } from "./fixtures/artists";

/**
 * Eventual: `supabase.from("artists").select()` mapped to `Artist`.
 * Today: fixtures from disk.
 */
export async function getArtists(): Promise<Artist[]> {
  return fixtureArtists;
}
