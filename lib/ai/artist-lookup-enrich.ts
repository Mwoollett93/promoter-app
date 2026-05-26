import { withTimeout } from "@/lib/api/fetch-with-timeout";
import {
  CACHE_TTL,
  getCached,
  normalizeArtistCacheKey,
  setCached,
} from "@/lib/ai/artist-lookup-cache";
import { discoverArtistContacts } from "@/lib/ai/artist-contact-discovery";
import type { ArtistMatchWithContacts } from "@/lib/ai/artist-contact-enrich";
import { fetchArtistExternalLinks } from "@/lib/ai/artist-musicbrainz-links";
import { resolveArtistPortraitImage } from "@/lib/ai/artist-portrait-image";
import type { ArtistMatch } from "@/lib/ai/artistSchema";
import { sanitizeArtistImageUrl } from "@/lib/ai/artist-portrait-image-legacy";

const CONTACT_TIMEOUT_MS = 6000;
const PORTRAIT_TIMEOUT_MS = 10000;
const MUSICBRAINZ_TIMEOUT_MS = 5000;

async function enrichSingleMatch(match: ArtistMatch): Promise<ArtistMatchWithContacts> {
  const externalLinks = await withTimeout(
    fetchArtistExternalLinks(match.artistName),
    MUSICBRAINZ_TIMEOUT_MS,
    null,
  );

  const portrait = await withTimeout(
    resolveArtistPortraitImage({
      artistName: match.artistName,
      spotify: match.spotify ?? externalLinks?.spotify,
      website: match.website ?? externalLinks?.website,
      instagram: match.instagram ?? externalLinks?.instagram,
      externalLinks,
      mode: "full",
      lazyValidation: true,
      seedCandidates: match.imageCandidates,
    }),
    PORTRAIT_TIMEOUT_MS,
    null,
  );

  const discovery = await withTimeout(
    discoverArtistContacts({
      artistName: match.artistName,
      website: match.website ?? externalLinks?.website,
      instagram: match.instagram ?? externalLinks?.instagram,
      soundcloud: match.soundcloud ?? externalLinks?.soundcloud,
      spotify: match.spotify ?? externalLinks?.spotify,
      externalLinks,
    }),
    CONTACT_TIMEOUT_MS,
    undefined,
  );

  const displayUrl =
    portrait?.imageUrl ??
    (match.imageUrl && match.imageSource === "spotify_artist" ? match.imageUrl : undefined);

  return {
    ...match,
    imageUrl: sanitizeArtistImageUrl(displayUrl ?? portrait?.imageUrl),
    imageSource: portrait?.imageSource ?? match.imageSource ?? "manual_required",
    imageConfidence: portrait?.imageConfidence ?? match.imageConfidence ?? "low",
    imageWarnings: portrait?.imageWarnings ?? match.imageWarnings ?? [],
    imageAttribution: portrait?.imageAttribution ?? match.imageAttribution,
    imageCandidates: portrait?.imageCandidates ?? match.imageCandidates,
    requiresImageChoice: portrait?.requiresImageChoice ?? match.requiresImageChoice,
    website: match.website ?? discovery?.website ?? externalLinks?.website,
    instagram: match.instagram ?? discovery?.instagram ?? externalLinks?.instagram,
    soundcloud: match.soundcloud ?? discovery?.soundcloud ?? externalLinks?.soundcloud,
    spotify: match.spotify ?? externalLinks?.spotify,
    contactDiscovery: discovery,
    enrichStatus: "complete",
    sources: [
      ...(match.sources ?? []),
      ...(discovery?.sources.map((s) => `Contact: ${s}`) ?? []),
    ].filter((v, i, a) => a.indexOf(v) === i),
  };
}

export type ArtistFillEnrichResponse = {
  matches: ArtistMatchWithContacts[];
  status: "complete";
};

/** Stage B — slow portrait sources, contacts, full validation. */
export async function enrichArtistMatchesFull(
  matches: ArtistMatch[],
): Promise<ArtistFillEnrichResponse> {
  const cacheKey = `enrich:${normalizeArtistCacheKey(matches.map((m) => m.artistName).join("|"))}`;
  const cached = getCached<ArtistFillEnrichResponse>(cacheKey);
  if (cached) return cached;

  const enriched = await Promise.all(matches.map((match) => enrichSingleMatch(match)));
  const result: ArtistFillEnrichResponse = { matches: enriched, status: "complete" };
  setCached(cacheKey, result, CACHE_TTL.success);
  return result;
}
