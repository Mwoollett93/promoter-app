import type { ArtistContactDiscovery } from "@/lib/ai/artist-contact-types";
import { discoverArtistContacts } from "@/lib/ai/artist-contact-discovery";
import type { ArtistMatch } from "@/lib/ai/artistSchema";

export type ArtistMatchWithContacts = ArtistMatch & {
  contactDiscovery?: ArtistContactDiscovery;
};

/** Resolve public booking/contact details after artist identity is confirmed. */
export async function enrichArtistMatchContacts(
  matches: ArtistMatch[],
): Promise<ArtistMatchWithContacts[]> {
  return Promise.all(
    matches.map(async (match) => {
      const discovery = await discoverArtistContacts({
        artistName: match.artistName,
        website: match.website,
        instagram: match.instagram,
        soundcloud: match.soundcloud,
        spotify: match.spotify,
      });

      return {
        ...match,
        website: match.website ?? discovery.website,
        instagram: match.instagram ?? discovery.instagram,
        soundcloud: match.soundcloud ?? discovery.soundcloud,
        contactDiscovery: discovery,
        sources: [
          ...(match.sources ?? []),
          ...discovery.sources.map((s) => `Contact: ${s}`),
        ].filter((value, index, arr) => arr.indexOf(value) === index),
      };
    }),
  );
}
