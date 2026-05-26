import { enrichArtistMatchesFull } from "@/lib/ai/artist-lookup-enrich";
import { fetchArtistMatchesFast } from "@/lib/ai/artist-lookup-fast";
import type { ArtistFillResponse } from "@/lib/ai/artistSchema";
import type { ArtistMatch } from "@/lib/ai/artistSchema";

/** Stage A — fast artist lookup (< 8s target). */
export async function fetchArtistMatches(artistName: string): Promise<ArtistFillResponse> {
  const fast = await fetchArtistMatchesFast(artistName);
  return { matches: fast.matches };
}

/** Stage B — background enrichment. */
export async function enrichArtistMatches(matches: ArtistMatch[]) {
  return enrichArtistMatchesFull(matches);
}
