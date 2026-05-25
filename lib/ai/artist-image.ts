/** Block placeholder / hallucinated image URLs from OpenAI. */
const BLOCKED_IMAGE_HOSTS = [
  "example.com",
  "example.org",
  "placeholder.com",
  "via.placeholder.com",
  "placehold.co",
  "picsum.photos",
  "lorempixel.com",
  "dummyimage.com",
  "fakeimg.pl",
];

const TRUSTED_IMAGE_HOSTS = [
  "scdn.co",
  "spotifycdn.com",
  "dzcdn.net",
  "deezer.com",
  "mzstatic.com",
  "apple.com",
  "itunes.apple.com",
  "wikimedia.org",
  "wikipedia.org",
  "coverartarchive.org",
  "archive.org",
  "discogs.com",
  "bandcamp.com",
  "ytimg.com",
  "cdninstagram.com",
  "fbcdn.net",
];

const MUSICBRAINZ_USER_AGENT = "PromoSync/1.0 (promoter-app; contact@promosync.app)";

export function sanitizeArtistImageUrl(url: string | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  const trimmed = url.trim();
  if (!/^https:\/\//i.test(trimmed)) return undefined;

  let host = "";
  try {
    host = new URL(trimmed).hostname.toLowerCase();
  } catch {
    return undefined;
  }

  if (BLOCKED_IMAGE_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`))) {
    return undefined;
  }

  if (/example|placeholder|dummy|fake|sample|test/i.test(trimmed)) {
    return undefined;
  }

  return trimmed;
}

export function isDisplayableArtistImageUrl(url: string | undefined): boolean {
  return Boolean(sanitizeArtistImageUrl(url));
}

function isTrustedCdnUrl(url: string): boolean {
  return TRUSTED_IMAGE_HOSTS.some((host) => url.toLowerCase().includes(host));
}

function upgradeArtworkResolution(url: string): string {
  return url
    .replace(/100x100bb\.jpg/i, "600x600bb.jpg")
    .replace(/\/\d+x\d+bb\./i, "/600x600bb.")
    .replace(/-small\.jpg/i, "-large.jpg")
    .replace(/250x250/, "600x600");
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: "no-store", ...init });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function spotifyOEmbedThumbnail(spotifyUrl: string): Promise<string | undefined> {
  const normalized = spotifyUrl.trim();
  if (!normalized.includes("spotify.com")) return undefined;

  const data = await fetchJson<{ thumbnail_url?: string }>(
    `https://open.spotify.com/oembed?url=${encodeURIComponent(normalized)}`,
    { headers: { Accept: "application/json" } },
  );
  return sanitizeArtistImageUrl(data?.thumbnail_url);
}

async function deezerArtistImage(artistName: string): Promise<string | undefined> {
  const data = await fetchJson<{
    data?: Array<{ picture_xl?: string; picture_big?: string; picture_medium?: string }>;
  }>(`https://api.deezer.com/search/artist?q=${encodeURIComponent(artistName)}&limit=3`);

  const top = data?.data?.[0];
  const url = top?.picture_xl ?? top?.picture_big ?? top?.picture_medium;
  return sanitizeArtistImageUrl(url);
}

async function itunesArtistImage(artistName: string): Promise<string | undefined> {
  const data = await fetchJson<{
    results?: Array<{ artworkUrl100?: string; artistName?: string }>;
  }>(
    `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=musicArtist&limit=5`,
  );

  const normalizedQuery = artistName.trim().toLowerCase();
  const best =
    data?.results?.find((r) => r.artistName?.toLowerCase().includes(normalizedQuery.split(" ")[0] ?? "")) ??
    data?.results?.[0];

  const raw = best?.artworkUrl100;
  if (!raw) return undefined;
  return sanitizeArtistImageUrl(upgradeArtworkResolution(raw));
}

async function musicBrainzCoverImage(artistName: string): Promise<string | undefined> {
  const search = await fetchJson<{
    artists?: Array<{ id?: string; name?: string; score?: number }>;
  }>(
    `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(`artist:"${artistName}"`)}&fmt=json&limit=3`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": MUSICBRAINZ_USER_AGENT,
      },
    },
  );

  const artistId = search?.artists?.[0]?.id;
  if (!artistId) return undefined;

  try {
    const response = await fetch(`https://coverartarchive.org/artist/${artistId}/front-500`, {
      headers: { "User-Agent": MUSICBRAINZ_USER_AGENT },
      redirect: "follow",
      cache: "no-store",
    });
    if (!response.ok) return undefined;
    return sanitizeArtistImageUrl(response.url);
  } catch {
    return undefined;
  }
}

/** Resolve a displayable artist photo from multiple public music APIs. */
export async function resolveArtistImageUrl(input: {
  artistName: string;
  imageUrl?: string;
  spotify?: string;
}): Promise<string | undefined> {
  const fromAi = sanitizeArtistImageUrl(input.imageUrl);
  if (fromAi && isTrustedCdnUrl(fromAi)) return fromAi;

  const sources = await Promise.all([
    input.spotify ? spotifyOEmbedThumbnail(input.spotify) : Promise.resolve(undefined),
    deezerArtistImage(input.artistName),
    itunesArtistImage(input.artistName),
    musicBrainzCoverImage(input.artistName),
  ]);

  for (const url of sources) {
    if (url) return url;
  }

  return fromAi;
}

export async function enrichArtistMatchImages<
  T extends { artistName: string; imageUrl?: string; spotify?: string },
>(matches: T[]): Promise<T[]> {
  return Promise.all(
    matches.map(async (match) => ({
      ...match,
      imageUrl: await resolveArtistImageUrl({
        artistName: match.artistName,
        imageUrl: match.imageUrl,
        spotify: match.spotify,
      }),
    })),
  );
}
