import { discoverArtistContacts } from "@/lib/ai/artist-contact-discovery";
import type { ArtistMatchWithContacts } from "@/lib/ai/artist-contact-enrich";
import { enrichArtistMatchPortraits } from "@/lib/ai/artist-portrait-image";
import { fetchArtistExternalLinks } from "@/lib/ai/artist-musicbrainz-links";
import type { ArtistMatch } from "@/lib/ai/artistSchema";

/** Portrait + contact enrichment with one MusicBrainz lookup per match (rate-limit safe). */
export async function enrichArtistMatches(matches: ArtistMatch[]): Promise<ArtistMatchWithContacts[]> {
  const results: ArtistMatchWithContacts[] = [];

  for (const match of matches) {
    const externalLinks = await fetchArtistExternalLinks(match.artistName);

    const [withPortrait] = await enrichArtistMatchPortraits([
      {
        ...match,
        spotify: match.spotify ?? externalLinks?.spotify,
        website: match.website ?? externalLinks?.website,
        instagram: match.instagram ?? externalLinks?.instagram,
        externalLinks,
      },
    ]);

    const discovery = await discoverArtistContacts({
      artistName: match.artistName,
      website: withPortrait.website ?? externalLinks?.website,
      instagram: withPortrait.instagram ?? externalLinks?.instagram,
      soundcloud: match.soundcloud ?? externalLinks?.soundcloud,
      spotify: withPortrait.spotify ?? externalLinks?.spotify,
      externalLinks,
    });

    results.push({
      ...withPortrait,
      website: withPortrait.website ?? discovery.website,
      instagram: withPortrait.instagram ?? discovery.instagram,
      soundcloud: withPortrait.soundcloud ?? discovery.soundcloud,
      contactDiscovery: discovery,
      sources: [
        ...(withPortrait.sources ?? []),
        ...discovery.sources.map((s) => `Contact: ${s}`),
      ].filter((value, index, arr) => arr.indexOf(value) === index),
    });
  }

  return results;
}
