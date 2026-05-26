import type { ArtistMatch } from "@/lib/ai/artistSchema";

function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

/** Merge preview (image/links) into full profile (bio/genres) without losing early portrait. */
export function mergeArtistMatches(
  previous: ArtistMatch[],
  incoming: ArtistMatch[],
): ArtistMatch[] {
  if (incoming.length === 0) return previous;
  if (previous.length === 0) return incoming;

  return incoming.map((full, index) => {
    const preview =
      previous.find((p) => normalizeName(p.artistName) === normalizeName(full.artistName)) ??
      previous[index];

    if (!preview) return full;

    return {
      ...full,
      imageUrl: full.imageUrl ?? preview.imageUrl,
      imageSource: full.imageSource ?? preview.imageSource,
      imageConfidence: full.imageConfidence ?? preview.imageConfidence,
      imageWarnings: full.imageWarnings?.length ? full.imageWarnings : preview.imageWarnings,
      imageCandidates: full.imageCandidates?.length ? full.imageCandidates : preview.imageCandidates,
      imageAttribution: full.imageAttribution ?? preview.imageAttribution,
      spotify: full.spotify ?? preview.spotify,
      instagram: full.instagram ?? preview.instagram,
      website: full.website ?? preview.website,
      soundcloud: full.soundcloud ?? preview.soundcloud,
      enrichStatus: full.enrichStatus ?? preview.enrichStatus,
    };
  });
}
