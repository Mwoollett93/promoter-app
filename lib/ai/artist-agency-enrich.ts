import type { ArtistMatchWithContacts } from "@/lib/ai/artist-contact-enrich";
import { enrichArtistMatchContacts } from "@/lib/ai/artist-contact-enrich";
import type { ArtistMatch } from "@/lib/ai/artistSchema";

export async function enrichArtistMatches(matches: ArtistMatch[]): Promise<ArtistMatchWithContacts[]> {
  const { enrichArtistMatchImages } = await import("@/lib/ai/artist-image");
  const withImages = await enrichArtistMatchImages(matches);
  return enrichArtistMatchContacts(withImages);
}
