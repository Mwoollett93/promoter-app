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
  "spotify.com",
  "cdninstagram.com",
  "fbcdn.net",
  "wikimedia.org",
  "wikipedia.org",
  "cloudfront.net",
  "googleusercontent.com",
  "discogs.com",
  "bandcamp.com",
  "ytimg.com",
];

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

async function spotifyOEmbedThumbnail(spotifyUrl: string): Promise<string | undefined> {
  const normalized = spotifyUrl.trim();
  if (!normalized.includes("spotify.com")) return undefined;

  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(normalized)}`;
    const response = await fetch(oembedUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return undefined;

    const data = (await response.json()) as { thumbnail_url?: string };
    return sanitizeArtistImageUrl(data.thumbnail_url);
  } catch {
    return undefined;
  }
}

function isTrustedCdnUrl(url: string): boolean {
  return TRUSTED_IMAGE_HOSTS.some((host) => url.toLowerCase().includes(host));
}

/** Prefer Spotify oEmbed art when AI returns missing or fake image URLs. */
export async function resolveArtistImageUrl(input: {
  imageUrl?: string;
  spotify?: string;
}): Promise<string | undefined> {
  if (input.spotify) {
    const fromSpotify = await spotifyOEmbedThumbnail(input.spotify);
    if (fromSpotify) return fromSpotify;
  }

  const fromAi = sanitizeArtistImageUrl(input.imageUrl);
  if (fromAi && isTrustedCdnUrl(fromAi)) return fromAi;

  return undefined;
}

export async function enrichArtistMatchImages<T extends { imageUrl?: string; spotify?: string }>(
  matches: T[],
): Promise<T[]> {
  return Promise.all(
    matches.map(async (match) => ({
      ...match,
      imageUrl: await resolveArtistImageUrl({
        imageUrl: match.imageUrl,
        spotify: match.spotify,
      }),
    })),
  );
}
