import type { Artist } from "../types/event-schedule";

/**
 * Legacy fixture loader — wizard uses Supabase artists when a workspace is available.
 */
export async function getArtists(): Promise<Artist[]> {
  return [];
}
