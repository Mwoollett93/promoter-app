import { withTimeout } from "@/lib/api/fetch-with-timeout";
import {
  CACHE_TTL,
  getCached,
  normalizeArtistCacheKey,
  setCached,
} from "@/lib/ai/artist-lookup-cache";
import { resolveFastPortrait } from "@/lib/ai/artist-portrait-fast";
import { fetchArtistExternalLinks } from "@/lib/ai/artist-musicbrainz-links";
import { fetchDeezerArtistPortrait } from "@/lib/ai/deezer-artist-api";
import { fetchSpotifyArtistPortrait } from "@/lib/ai/spotify-artist-api";
import type { ArtistExternalLinks } from "@/lib/ai/artist-musicbrainz-links";
import type { ArtistMatch } from "@/lib/ai/artistSchema";
import { parseArtistFillResponse } from "@/lib/ai/artistSchema";
import { sanitizeArtistImageUrl } from "@/lib/ai/artist-portrait-image-legacy";
import type { SpotifyArtistMatch } from "@/lib/ai/spotify-artist-api";

const OPENAI_TIMEOUT_MS = 10000;
/** Spotify needs token + search + artist fetch — 3s was too tight. */
const SPOTIFY_TIMEOUT_MS = 7000;
const MUSICBRAINZ_TIMEOUT_MS = 4500;
const DEEZER_TIMEOUT_MS = 3500;

const MATCH_SCHEMA = `{
  "matches": [
    {
      "artistName": string,
      "description": string,
      "genres": string[],
      "location": string | null,
      "imageUrl": string | null,
      "website": string | null,
      "instagram": string | null,
      "soundcloud": string | null,
      "spotify": string | null,
      "bookingEmail": string | null,
      "classification": "Emerging" | "Established" | "Headliner" | "Legacy" | null,
      "agencyName": string | null,
      "managementCompany": string | null,
      "contactName": string | null,
      "contactRole": string | null,
      "contactPhone": string | null,
      "confidence": "low" | "medium" | "high",
      "sources": string[] | null
    }
  ]
}`;

function parseAiJsonContent(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(raw) as unknown;
}

async function fetchOpenAiMatchesSafe(artistName: string): Promise<ArtistMatch[]> {
  try {
    return await fetchOpenAiMatches(artistName);
  } catch {
    return [];
  }
}

async function fetchOpenAiMatches(artistName: string): Promise<ArtistMatch[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured on the server.");

  const rawModel = process.env.AI_EXTRACTION_MODEL?.trim() ?? "";
  const model = rawModel.replace(/^optional:\s*/i, "").trim() || "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You help event promoters research DJ/artist profiles for a CRM.",
            "Given an artist name, return 1 to 3 possible real-world artist matches.",
            "Return valid JSON only. Bio under 500 words. Leave imageUrl null.",
            "Never invent booking emails. spotify: open.spotify.com/artist/... when known.",
          ].join(" "),
        },
        {
          role: "user",
          content: `Schema:\n${MATCH_SCHEMA}\n\nArtist name:\n${artistName.trim()}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `AI lookup failed (${response.status}).`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned an empty response.");

  const parsed = parseArtistFillResponse(parseAiJsonContent(content), artistName.trim());
  return parsed.matches;
}

/** When OpenAI is slow/empty, build a match from Spotify / MusicBrainz. */
function buildProviderFallbackMatch(
  queryName: string,
  spotify: SpotifyArtistMatch | null,
  externalLinks: ArtistExternalLinks | null,
): ArtistMatch | null {
  const spotifyUrl = spotify?.externalUrl ?? externalLinks?.spotify;
  if (!spotifyUrl && !externalLinks?.website && !externalLinks?.instagram) {
    return null;
  }

  const displayName = spotify?.name ?? externalLinks?.name ?? queryName.trim();

  return {
    artistName: displayName,
    description: "",
    genres: [],
    spotify: spotifyUrl,
    website: externalLinks?.website,
    instagram: externalLinks?.instagram,
    soundcloud: externalLinks?.soundcloud,
    confidence: spotify ? "high" : "medium",
    sources: [
      ...(spotifyUrl ? ["Spotify"] : []),
      ...(externalLinks ? ["MusicBrainz"] : []),
    ],
    contactDiscovery: undefined,
  } satisfies ArtistMatch;
}

async function resolveSpotifyPortrait(
  artistName: string,
  externalLinks: ArtistExternalLinks | null,
): Promise<SpotifyArtistMatch | null> {
  let spotify = await withTimeout(
    fetchSpotifyArtistPortrait(artistName),
    SPOTIFY_TIMEOUT_MS,
    null,
  );

  if (!spotify && externalLinks?.spotify) {
    spotify = await withTimeout(
      fetchSpotifyArtistPortrait(artistName, externalLinks.spotify),
      SPOTIFY_TIMEOUT_MS,
      null,
    );
  }

  return spotify;
}

function applyFastPortraitToMatch(
  match: ArtistMatch,
  shared: {
    spotify: Awaited<ReturnType<typeof fetchSpotifyArtistPortrait>>;
    deezerUrl: string | null;
    externalLinks: Awaited<ReturnType<typeof fetchArtistExternalLinks>>;
  },
): ArtistMatch {
  const portrait = resolveFastPortrait({
    artistName: match.artistName,
    spotify: shared.spotify,
    deezerImageUrl: shared.deezerUrl,
  });

  return {
    ...match,
    spotify: match.spotify ?? shared.spotify?.externalUrl ?? shared.externalLinks?.spotify,
    website: match.website ?? shared.externalLinks?.website,
    instagram: match.instagram ?? shared.externalLinks?.instagram,
    soundcloud: match.soundcloud ?? shared.externalLinks?.soundcloud,
    imageUrl: sanitizeArtistImageUrl(portrait.imageUrl),
    imageSource: portrait.imageSource,
    imageConfidence: portrait.imageConfidence,
    imageWarnings: portrait.imageWarnings,
    imageCandidates: portrait.imageCandidates,
    requiresImageChoice: portrait.requiresImageChoice,
    enrichStatus: "partial",
    sources: [
      ...(match.sources ?? []),
      ...(shared.spotify?.externalUrl ? ["Spotify"] : []),
      ...(shared.externalLinks ? ["MusicBrainz"] : []),
    ].filter((v, i, a) => a.indexOf(v) === i),
  };
}

export type ArtistFillFastResponse = {
  matches: ArtistMatch[];
  status: "partial";
};

/** Stage A — OpenAI + parallel Spotify / MusicBrainz / Deezer portraits. */
export async function fetchArtistMatchesFast(artistName: string): Promise<ArtistFillFastResponse> {
  const cacheKey = `fast:v2:${normalizeArtistCacheKey(artistName)}`;
  const cached = getCached<ArtistFillFastResponse>(cacheKey);
  if (cached) return cached;

  const [openAiMatches, deezerUrl, externalLinks] = await Promise.all([
    withTimeout(fetchOpenAiMatchesSafe(artistName), OPENAI_TIMEOUT_MS, []),
    withTimeout(fetchDeezerArtistPortrait(artistName), DEEZER_TIMEOUT_MS, null),
    withTimeout(
      fetchArtistExternalLinks(artistName, { skipWikidata: true }),
      MUSICBRAINZ_TIMEOUT_MS,
      null,
    ),
  ]);

  const spotify = await resolveSpotifyPortrait(artistName, externalLinks);

  let matches = openAiMatches;
  if (matches.length === 0) {
    const fallback = buildProviderFallbackMatch(artistName, spotify, externalLinks);
    if (!fallback) {
      throw new Error("No artist match found. Try a more specific name.");
    }
    matches = [fallback];
  }

  const enriched = matches.map((match) =>
    applyFastPortraitToMatch(match, { spotify, deezerUrl, externalLinks }),
  );

  const result: ArtistFillFastResponse = { matches: enriched, status: "partial" };
  setCached(cacheKey, result, CACHE_TTL.partial);
  return result;
}
