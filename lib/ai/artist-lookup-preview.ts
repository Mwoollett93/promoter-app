import { withTimeout } from "@/lib/api/fetch-with-timeout";
import {
  CACHE_TTL,
  getCached,
  normalizeArtistCacheKey,
  setCached,
} from "@/lib/ai/artist-lookup-cache";
import { resolveFastPortrait } from "@/lib/ai/artist-portrait-fast";
import { fetchDeezerArtistPortrait } from "@/lib/ai/deezer-artist-api";
import { fetchSpotifyArtistPortrait } from "@/lib/ai/spotify-artist-api";
import type { ArtistMatch } from "@/lib/ai/artistSchema";
import { sanitizeArtistImageUrl } from "@/lib/ai/artist-portrait-image-legacy";

const SPOTIFY_TIMEOUT_MS = 6000;
const DEEZER_TIMEOUT_MS = 3500;

export type ArtistFillPreviewResponse = {
  matches: ArtistMatch[];
  status: "preview";
};

/** ~1–3s — Spotify/Deezer portrait only; no OpenAI or MusicBrainz. */
export async function fetchArtistPreview(artistName: string): Promise<ArtistFillPreviewResponse> {
  const cacheKey = `preview:v1:${normalizeArtistCacheKey(artistName)}`;
  const cached = getCached<ArtistFillPreviewResponse>(cacheKey);
  if (cached) return cached;

  const query = artistName.trim();
  const [spotify, deezerUrl] = await Promise.all([
    withTimeout(fetchSpotifyArtistPortrait(query), SPOTIFY_TIMEOUT_MS, null),
    withTimeout(fetchDeezerArtistPortrait(query), DEEZER_TIMEOUT_MS, null),
  ]);

  if (!spotify?.externalUrl && !deezerUrl) {
    return { matches: [], status: "preview" };
  }

  const portrait = resolveFastPortrait({
    artistName: query,
    spotify,
    deezerImageUrl: deezerUrl,
  });

  const match: ArtistMatch = {
    artistName: spotify?.name ?? query,
    description: "",
    genres: [],
    spotify: spotify?.externalUrl,
    imageUrl: sanitizeArtistImageUrl(portrait.imageUrl),
    imageSource: portrait.imageSource,
    imageConfidence: portrait.imageConfidence,
    imageWarnings: portrait.imageWarnings,
    imageCandidates: portrait.imageCandidates,
    requiresImageChoice: portrait.requiresImageChoice,
    enrichStatus: "preview",
    confidence: spotify ? "high" : "medium",
    sources: [
      ...(spotify?.externalUrl ? ["Spotify"] : []),
      ...(deezerUrl ? ["Deezer"] : []),
    ],
    contactDiscovery: undefined,
  };

  const result: ArtistFillPreviewResponse = { matches: [match], status: "preview" };
  setCached(cacheKey, result, CACHE_TTL.partial);
  return result;
}
