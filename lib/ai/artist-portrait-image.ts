import type {
  ArtistImageConfidence,
  ArtistImageResult,
  ArtistImageSource,
} from "@/lib/ai/artist-portrait-types";
import { fetchBandcampArtistPortrait } from "@/lib/ai/bandcamp-artist-api";
import { fetchDeezerArtistPortrait, isDeezerArtistPhotoUrl } from "@/lib/ai/deezer-artist-api";
import type { ArtistExternalLinks } from "@/lib/ai/artist-musicbrainz-links";
import {
  isSpotifyOembedThumbnail,
  scorePortraitHeuristics,
} from "@/lib/ai/artist-portrait-heuristics";
import { fetchSpotifyArtistPortrait } from "@/lib/ai/spotify-artist-api";

const MUSICBRAINZ_UA = "PromoSync/1.0 (promoter-app; contact@promosync.app)";

const BLOCKED_HOSTS = [
  "example.com",
  "example.org",
  "placeholder.com",
  "via.placeholder.com",
  "placehold.co",
  "picsum.photos",
];

const ALBUM_URL_RE =
  /album|cover|release|single|\bep\b|\blp\b|artwork|track|record|vinyl|discography|merch|store/i;

const CATALOGUE_HOST_RE =
  /dzcdn\.net|deezer|mzstatic\.com|itunes\.apple|music\.apple|coverartarchive/i;

const FILENAME_ALBUM_RE = /cover|artwork|album|release|single|track/i;

/** CDNs that serve artist portraits but often reject HEAD or return non-image types. */
const TRUSTED_PORTRAIT_HOSTS = [
  "i.scdn.co",
  "mosaic.scdn.co",
  "image-cdn-ak.spotifycdn.com",
  "upload.wikimedia.org",
  "commons.wikimedia.org",
  "cdninstagram.com",
  "fbcdn.net",
  "cdn-images.dzcdn.net",
  "bcbits.com",
  "f4.bcbits.com",
];

const PRESS_PATHS = ["/press", "/media", "/epk", "/photos", "/bio", "/about", "/contact"];

type ImageCandidate = {
  url: string;
  source: ArtistImageSource;
  score: number;
  warnings: string[];
  attribution?: string;
  pageUrl?: string;
  filename?: string;
};

function normalizeUrl(url: string): string | undefined {
  const trimmed = url.trim();
  if (!trimmed.startsWith("http")) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (BLOCKED_HOSTS.some((h) => parsed.hostname.endsWith(h))) return undefined;
    if (/example|placeholder|dummy|fake/i.test(trimmed)) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function applyScorePenalties(candidate: ImageCandidate): ImageCandidate {
  const lower = candidate.url.toLowerCase();
  if (
    candidate.source === "deezer_artist" ||
    candidate.source === "bandcamp_artist" ||
    isDeezerArtistPhotoUrl(lower)
  ) {
    return candidate;
  }
  if (lower.includes("coverartarchive.org")) {
    candidate.score -= 50;
    candidate.warnings.push("Cover Art Archive is release artwork only");
  }
  if (CATALOGUE_HOST_RE.test(lower)) {
    candidate.score -= 40;
    candidate.warnings.push("Music catalogue source (often album art)");
  }
  if (FILENAME_ALBUM_RE.test(lower)) {
    candidate.score -= 30;
    candidate.warnings.push("Filename suggests album/release artwork");
  }
  const squareMatch = lower.match(/(\d{2,4})x(\d{2,4})/);
  if (squareMatch && squareMatch[1] === squareMatch[2] && CATALOGUE_HOST_RE.test(lower)) {
    candidate.score -= 20;
    candidate.warnings.push("Square image from music catalogue");
  }
  return candidate;
}

function urlLooksLikeAlbumArt(url: string, source: ArtistImageSource): boolean {
  const lower = url.toLowerCase();
  if (source === "manual_required") return true;
  if (source === "deezer_artist" || source === "bandcamp_artist" || isDeezerArtistPhotoUrl(lower)) {
    return false;
  }
  if (lower.includes("coverartarchive.org")) return true;
  if (lower.includes("dzcdn.net") || lower.includes("deezer")) return true;
  if (lower.includes("mzstatic.com") || lower.includes("itunes.apple")) return true;
  if (ALBUM_URL_RE.test(lower)) return true;
  return false;
}

function isTrustedPortraitHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return TRUSTED_PORTRAIT_HOSTS.some((trusted) => host === trusted || host.endsWith(`.${trusted}`));
  } catch {
    return false;
  }
}

function contentTypeIsImage(type: string): boolean {
  const lower = type.toLowerCase();
  return lower.startsWith("image/") || lower.includes("octet-stream");
}

async function validateImageUrl(
  url: string,
  source: ArtistImageSource,
): Promise<{ ok: boolean; warning?: string }> {
  const normalized = normalizeUrl(url);
  if (!normalized) return { ok: false, warning: "Invalid URL" };
  if (urlLooksLikeAlbumArt(normalized, source)) {
    return { ok: false, warning: "URL looks like album/release artwork" };
  }

  if (isTrustedPortraitHost(normalized)) {
    return { ok: true };
  }

  try {
    const head = await fetch(normalized, {
      method: "HEAD",
      redirect: "follow",
      cache: "no-store",
    });
    const headType = head.headers.get("content-type") ?? "";
    if (head.ok && contentTypeIsImage(headType)) return { ok: true };
  } catch {
    /* fall through to GET probe */
  }

  try {
    const probe = await fetch(normalized, {
      method: "GET",
      headers: { Range: "bytes=0-1023" },
      redirect: "follow",
      cache: "no-store",
    });
    const type = probe.headers.get("content-type") ?? "";
    if (probe.ok && contentTypeIsImage(type)) return { ok: true };
    return { ok: false, warning: `Not an image (${type || `HTTP ${probe.status}`})` };
  } catch {
    return { ok: false, warning: "Could not verify image" };
  }
}

function scoreToConfidence(score: number): ArtistImageConfidence {
  if (score >= 40) return "high";
  if (score >= 20) return "medium";
  return "low";
}

const TRUSTED_PRESS_SOURCES: ArtistImageSource[] = ["bandcamp_artist", "deezer_artist"];

function pickBestPortraitCandidate(candidates: ImageCandidate[]): ImageCandidate | null {
  if (candidates.length === 0) return null;

  const trusted = candidates.filter(
    (c) =>
      TRUSTED_PRESS_SOURCES.includes(c.source) ||
      (c.source === "spotify_artist" && !isSpotifyOembedThumbnail(c.url)),
  );
  if (trusted.length > 0) {
    return [...trusted].sort((a, b) => b.score - a.score)[0];
  }

  const fallback = candidates.filter(
    (c) =>
      c.source !== "official_site" &&
      !isSpotifyOembedThumbnail(c.url) &&
      !c.warnings.some((w) => w.includes("release artwork") || w.includes("illustration")),
  );
  if (fallback.length > 0) {
    return [...fallback].sort((a, b) => b.score - a.score)[0];
  }

  return null;
}

function addCandidate(list: ImageCandidate[], candidate: ImageCandidate) {
  const url = normalizeUrl(candidate.url);
  if (!url) return;
  list.push({ ...candidate, url });
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store", ...init });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type WikimediaImage = {
  url: string;
  filename: string;
  width?: number;
  height?: number;
};

async function wikimediaCommonsImage(filename: string): Promise<WikimediaImage | undefined> {
  const fileTitle = `File:${filename.replace(/ /g, "_")}`;
  const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url|size&iiurlwidth=800&format=json`;

  const data = await fetchJson<{
    query?: {
      pages?: Record<
        string,
        {
          imageinfo?: Array<{
            thumburl?: string;
            url?: string;
            thumbwidth?: number;
            thumbheight?: number;
            width?: number;
            height?: number;
          }>;
        }
      >;
    };
  }>(api, { headers: { "User-Agent": MUSICBRAINZ_UA } });

  const page = data?.query?.pages ? Object.values(data.query.pages)[0] : undefined;
  const info = page?.imageinfo?.[0];
  const url = info?.thumburl ?? info?.url;
  if (!info || !url) return undefined;

  return {
    url,
    filename,
    width: info.thumbwidth ?? info.width,
    height: info.thumbheight ?? info.height,
  };
}

async function wikidataPortraitCandidates(wikidataId: string): Promise<ImageCandidate[]> {
  const entity = await fetchJson<{
    entities?: Record<
      string,
      {
        claims?: {
          P18?: Array<{
            mainsnak?: { datavalue?: { value?: string } };
          }>;
        };
      }
    >
  }>(`https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`);

  const claims = entity?.entities?.[wikidataId]?.claims?.P18 ?? [];
  const filenames = claims
    .map((c) => c.mainsnak?.datavalue?.value)
    .filter((f): f is string => typeof f === "string" && f.length > 0);

  const candidates: ImageCandidate[] = [];

  for (const filename of filenames) {
    const image = await wikimediaCommonsImage(filename);
    if (!image) continue;

    const heuristic = scorePortraitHeuristics(image.url, "wikimedia", {
      filename,
      width: image.width,
      height: image.height,
    });
    if (heuristic.reject) continue;

    candidates.push({
      url: image.url,
      source: "wikimedia",
      score: 45 + heuristic.scoreDelta,
      warnings: heuristic.warnings,
      attribution: `Wikimedia Commons — ${filename} (CC; verify on apply)`,
      filename,
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
}

function extractOgImage(html: string): string | undefined {
  const patterns = [
    /property=["']og:image(?::secure_url)?["']\s+content=["']([^"']+)["']/i,
    /content=["']([^"']+)["']\s+property=["']og:image(?::secure_url)?["']/i,
    /name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function pressPathScore(pathname: string): number {
  const lower = pathname.toLowerCase();
  if (ALBUM_URL_RE.test(lower)) return -30;
  if (/\/press|\/media|\/epk|\/photos|\/bio\b/.test(lower)) return 20;
  if (lower === "/" || /\/about\b/.test(lower)) return 5;
  return 0;
}

async function instagramProfileImage(instagramUrl: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://api.instagram.com/oembed?url=${encodeURIComponent(instagramUrl)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return undefined;
    const data = (await res.json()) as { thumbnail_url?: string };
    return data.thumbnail_url;
  } catch {
    return undefined;
  }
}

async function officialSitePortrait(website: string): Promise<ImageCandidate | null> {
  let base: URL;
  try {
    base = new URL(website.startsWith("http") ? website : `https://${website}`);
  } catch {
    return null;
  }

  const tried = new Set<string>();
  let best: ImageCandidate | null = null;

  for (const path of PRESS_PATHS) {
    const pageUrl = new URL(path, base).toString();
    if (tried.has(pageUrl)) continue;
    tried.add(pageUrl);

    try {
      const res = await fetch(pageUrl, {
        headers: { "User-Agent": MUSICBRAINZ_UA, Accept: "text/html" },
        redirect: "follow",
        cache: "no-store",
      });
      if (!res.ok) continue;
      const type = res.headers.get("content-type") ?? "";
      if (!type.includes("text/html")) continue;

      const html = await res.text();
      const og = extractOgImage(html);
      if (!og) continue;

      const pathScore = pressPathScore(new URL(pageUrl).pathname);
      const candidate: ImageCandidate = {
        url: og.startsWith("http") ? og : new URL(og, pageUrl).toString(),
        source: "official_site",
        score: 40 + pathScore,
        warnings: [],
        pageUrl,
      };

      if (ALBUM_URL_RE.test(candidate.url)) {
        candidate.score -= 30;
        candidate.warnings.push("Press page image may be release artwork");
      }

      if (!best || candidate.score > best.score) best = candidate;
    } catch {
      /* try next path */
    }
  }

  return best;
}

async function buildCandidates(input: {
  artistName: string;
  spotify?: string;
  website?: string;
  instagram?: string;
  externalLinks?: ArtistExternalLinks | null;
}): Promise<ImageCandidate[]> {
  const candidates: ImageCandidate[] = [];

  const bandcampUrl = input.externalLinks?.bandcamp;
  if (bandcampUrl) {
    const bandcampImage = await fetchBandcampArtistPortrait(bandcampUrl);
    if (bandcampImage) {
      const heuristic = scorePortraitHeuristics(bandcampImage, "bandcamp_artist");
      if (!heuristic.reject) {
        addCandidate(candidates, {
          url: bandcampImage,
          source: "bandcamp_artist",
          score: 49 + heuristic.scoreDelta,
          warnings: heuristic.warnings,
        });
      }
    }
  }

  const deezerUrl = await fetchDeezerArtistPortrait(input.artistName);
  if (deezerUrl) {
    const heuristic = scorePortraitHeuristics(deezerUrl, "deezer_artist");
    if (!heuristic.reject) {
      addCandidate(candidates, {
        url: deezerUrl,
        source: "deezer_artist",
        score: 48 + heuristic.scoreDelta,
        warnings: heuristic.warnings,
      });
    }
  }

  const wikidataId = input.externalLinks?.wikidataId;
  const siteUrl = input.website ?? input.externalLinks?.website;

  if (wikidataId) {
    for (const wiki of await wikidataPortraitCandidates(wikidataId)) {
      addCandidate(candidates, wiki);
    }
  }

  if (siteUrl) {
    const press = await officialSitePortrait(siteUrl);
    if (press) addCandidate(candidates, applyScorePenalties(press));
  }

  const spotifyUrl = input.spotify ?? input.externalLinks?.spotify;
  const spotify = await fetchSpotifyArtistPortrait(input.artistName, spotifyUrl);
  if (spotify?.imageUrl && !spotify.fromOembed) {
    const heuristic = scorePortraitHeuristics(spotify.imageUrl, "spotify_artist");
    if (!heuristic.reject) {
      addCandidate(candidates, {
        url: spotify.imageUrl,
        source: "spotify_artist",
        score: 50 + heuristic.scoreDelta,
        warnings: heuristic.warnings,
      });
    }
  }

  if (input.instagram) {
    const igUrl = await instagramProfileImage(input.instagram);
    if (igUrl) {
      addCandidate(
        candidates,
        applyScorePenalties({
          url: igUrl,
          source: "instagram",
          score: 30,
          warnings: [],
        }),
      );
    }
  }

  return candidates.map(applyScorePenalties);
}

/** Resolve best artist portrait (never album-art fallbacks). */
export async function resolveArtistPortraitImage(input: {
  artistName: string;
  spotify?: string;
  website?: string;
  instagram?: string;
  externalLinks?: ArtistExternalLinks | null;
}): Promise<ArtistImageResult> {
  const warnings: string[] = [];
  const rawCandidates = await buildCandidates(input);

  if (rawCandidates.length === 0) {
    return {
      imageSource: "manual_required",
      imageConfidence: "low",
      imageWarnings: [
        "No confident artist portrait found. Upload a press photo manually.",
        ...(process.env.SPOTIFY_CLIENT_ID
          ? []
          : [
              "Spotify API keys not configured — using Wikimedia and official sites. Add SPOTIFY_CLIENT_ID/SECRET for best results.",
            ]),
      ],
    };
  }

  const validated: ImageCandidate[] = [];

  for (const c of rawCandidates) {
    if (urlLooksLikeAlbumArt(c.url, c.source)) {
      warnings.push(`Rejected ${c.source}: looks like album/release artwork`);
      continue;
    }

    const heuristic = scorePortraitHeuristics(c.url, c.source, { filename: c.filename });
    if (heuristic.reject) {
      warnings.push(`Rejected ${c.source}: likely release/graphic artwork`);
      continue;
    }

    const check = await validateImageUrl(c.url, c.source);
    if (!check.ok) {
      warnings.push(`Rejected ${c.source}: ${check.warning ?? "invalid"}`);
      continue;
    }

    validated.push({
      ...c,
      score: c.score + heuristic.scoreDelta,
      warnings: [...c.warnings, ...heuristic.warnings, ...(check.warning ? [check.warning] : [])],
    });
  }

  if (validated.length === 0) {
    return {
      imageSource: "manual_required",
      imageConfidence: "low",
      imageWarnings: [
        ...warnings,
        "Candidates were found but failed validation. Upload a press photo manually.",
      ],
    };
  }

  const best = pickBestPortraitCandidate(validated);
  if (!best) {
    return {
      imageSource: "manual_required",
      imageConfidence: "low",
      imageWarnings: [
        ...warnings,
        "Only release artwork or low-trust images were found. Upload a press photo manually.",
      ],
    };
  }

  const confidence = scoreToConfidence(best.score);

  if (confidence === "low") {
    return {
      imageSource: "manual_required",
      imageConfidence: "low",
      imageWarnings: [
        ...warnings,
        ...best.warnings,
        "Best match was low confidence — not applied automatically. Upload manually.",
      ],
    };
  }

  const portraitSources: ArtistImageSource[] = [
    "bandcamp_artist",
    "deezer_artist",
    "spotify_artist",
    "wikimedia",
    "official_site",
    "instagram",
  ];
  const hasPressPhotoSource = validated.some(
    (c) =>
      portraitSources.includes(c.source) &&
      c.score >= 40 &&
      !c.warnings.some((w) => w.includes("release artwork") || w.includes("embed thumbnail")),
  );

  return {
    imageUrl: best.url,
    imageSource: best.source,
    imageConfidence:
      best.warnings.some((w) => w.includes("embed thumbnail") || w.includes("release artwork")) &&
      !hasPressPhotoSource
        ? "medium"
        : confidence,
    imageWarnings: [...new Set([...warnings, ...best.warnings])],
    imageAttribution: best.attribution,
  };
}

export async function enrichArtistMatchPortraits<
  T extends {
    artistName: string;
    spotify?: string;
    website?: string;
    instagram?: string;
    imageUrl?: string;
    externalLinks?: ArtistExternalLinks | null;
  },
>(
  matches: T[],
): Promise<
  (T & {
    imageUrl?: string;
    imageSource: ArtistImageSource;
    imageConfidence: ArtistImageConfidence;
    imageWarnings: string[];
    imageAttribution?: string;
  })[]
> {
  const { sanitizeArtistImageUrl } = await import("@/lib/ai/artist-portrait-image-legacy");
  const results: (T & {
    imageUrl?: string;
    imageSource: ArtistImageSource;
    imageConfidence: ArtistImageConfidence;
    imageWarnings: string[];
    imageAttribution?: string;
  })[] = [];

  for (const match of matches) {
    const portrait = await resolveArtistPortraitImage({
      artistName: match.artistName,
      spotify: match.spotify ?? match.externalLinks?.spotify,
      website: match.website ?? match.externalLinks?.website,
      instagram: match.instagram ?? match.externalLinks?.instagram,
      externalLinks: match.externalLinks,
    });

    results.push({
      ...match,
      imageUrl: sanitizeArtistImageUrl(portrait.imageUrl),
      imageSource: portrait.imageSource,
      imageConfidence: portrait.imageConfidence,
      imageWarnings: portrait.imageWarnings,
      imageAttribution: portrait.imageAttribution,
    });
  }

  return results;
}
