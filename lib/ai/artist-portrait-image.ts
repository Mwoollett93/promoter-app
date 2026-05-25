import type {
  ArtistImageConfidence,
  ArtistImageResult,
  ArtistImageSource,
} from "@/lib/ai/artist-portrait-types";
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
];

const PRESS_PATHS = ["/press", "/media", "/epk", "/photos", "/bio", "/about", "/"];

type ImageCandidate = {
  url: string;
  source: ArtistImageSource;
  score: number;
  warnings: string[];
  attribution?: string;
  pageUrl?: string;
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

async function validateImageUrl(url: string): Promise<{ ok: boolean; warning?: string }> {
  const normalized = normalizeUrl(url);
  if (!normalized) return { ok: false, warning: "Invalid URL" };
  if (urlLooksLikeAlbumArt(normalized, "manual_required")) {
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

type MbIdentity = {
  name: string;
  wikidataId?: string;
  website?: string;
};

async function musicBrainzIdentity(artistName: string): Promise<MbIdentity | null> {
  const search = await fetchJson<{
    artists?: Array<{ id: string; name: string; score?: number }>;
  }>(
    `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(`artist:"${artistName}"`)}&fmt=json&limit=3`,
    {
      headers: { Accept: "application/json", "User-Agent": MUSICBRAINZ_UA },
    },
  );

  const top = search?.artists?.[0];
  if (!top?.id) return null;

  const detail = await fetchJson<{
    name: string;
    relations?: Array<{ type?: string; url?: { resource?: string } }>;
  }>(`https://musicbrainz.org/ws/2/artist/${top.id}?inc=url-rels&fmt=json`, {
    headers: { Accept: "application/json", "User-Agent": MUSICBRAINZ_UA },
  });

  if (!detail) return { name: top.name };

  let wikidataId: string | undefined;
  let website: string | undefined;

  for (const rel of detail.relations ?? []) {
    const resource = rel.url?.resource ?? "";
    if (rel.type === "wikidata" && resource.includes("wikidata.org/wiki/Q")) {
      const qid = resource.match(/Q\d+/)?.[0];
      if (qid) wikidataId = qid;
    }
    if (!website && (rel.type === "official homepage" || rel.type === "official site")) {
      website = resource;
    }
  }

  return { name: detail.name, wikidataId, website };
}

async function wikimediaCommonsImageUrl(filename: string): Promise<string | undefined> {
  const fileTitle = `File:${filename.replace(/ /g, "_")}`;
  const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json`;

  const data = await fetchJson<{
    query?: {
      pages?: Record<string, { imageinfo?: Array<{ thumburl?: string; url?: string }> }>;
    };
  }>(api, { headers: { "User-Agent": MUSICBRAINZ_UA } });

  const page = data?.query?.pages ? Object.values(data.query.pages)[0] : undefined;
  return page?.imageinfo?.[0]?.thumburl ?? page?.imageinfo?.[0]?.url;
}

async function wikidataPortrait(wikidataId: string): Promise<{ url?: string; attribution?: string }> {
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

  const claims = entity?.entities?.[wikidataId]?.claims?.P18;
  const filename = claims?.[0]?.mainsnak?.datavalue?.value;
  if (!filename || typeof filename !== "string") return {};

  const directUrl = await wikimediaCommonsImageUrl(filename);
  const url =
    directUrl ??
    `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename.replace(/ /g, "_"))}?width=800`;

  return {
    url,
    attribution: `Wikimedia Commons — ${filename} (CC; verify on apply)`,
  };
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
}): Promise<ImageCandidate[]> {
  const candidates: ImageCandidate[] = [];

  const spotify = await fetchSpotifyArtistPortrait(input.artistName, input.spotify);
  if (spotify?.imageUrl) {
    addCandidate(candidates, {
      url: spotify.imageUrl,
      source: "spotify_artist",
      score: 50,
      warnings: [],
    });
  }

  const mb = await musicBrainzIdentity(input.artistName);
  const siteUrl = input.website ?? mb?.website;

  if (mb?.wikidataId) {
    const wiki = await wikidataPortrait(mb.wikidataId);
    if (wiki.url) {
      addCandidate(candidates, {
        url: wiki.url,
        source: "wikimedia",
        score: 45,
        warnings: [],
        attribution: wiki.attribution,
      });
    }
  }

  if (siteUrl) {
    const press = await officialSitePortrait(siteUrl);
    if (press) addCandidate(candidates, applyScorePenalties(press));
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
          : ["Tip: add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET for better results."]),
      ],
    };
  }

  const validated: ImageCandidate[] = [];

  for (const c of rawCandidates) {
    if (urlLooksLikeAlbumArt(c.url, c.source)) {
      warnings.push(`Rejected ${c.source}: looks like album/release artwork`);
      continue;
    }

    const check = await validateImageUrl(c.url);
    if (!check.ok) {
      warnings.push(`Rejected ${c.source}: ${check.warning ?? "invalid"}`);
      continue;
    }

    validated.push({
      ...c,
      warnings: [...c.warnings, ...(check.warning ? [check.warning] : [])],
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

  validated.sort((a, b) => b.score - a.score);
  const best = validated[0];
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

  return {
    imageUrl: best.url,
    imageSource: best.source,
    imageConfidence: confidence,
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
  },
>(matches: T[]): Promise<
  (T & {
    imageUrl?: string;
    imageSource: ArtistImageSource;
    imageConfidence: ArtistImageConfidence;
    imageWarnings: string[];
    imageAttribution?: string;
  })[]
> {
  return Promise.all(
    matches.map(async (match) => {
      const portrait = await resolveArtistPortraitImage({
        artistName: match.artistName,
        spotify: match.spotify,
        website: match.website,
        instagram: match.instagram,
      });

      const { sanitizeArtistImageUrl } = await import("@/lib/ai/artist-portrait-image-legacy");

      return {
        ...match,
        imageUrl: sanitizeArtistImageUrl(portrait.imageUrl),
        imageSource: portrait.imageSource,
        imageConfidence: portrait.imageConfidence,
        imageWarnings: portrait.imageWarnings,
        imageAttribution: portrait.imageAttribution,
      };
    }),
  );
}
