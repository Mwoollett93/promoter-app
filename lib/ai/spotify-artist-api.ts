const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API = "https://api.spotify.com/v1";

let cachedToken: { value: string; expiresAt: number } | null = null;

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameSimilarity(query: string, candidate: string): number {
  const a = normalizeName(query);
  const b = normalizeName(candidate);
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (b.includes(a) || a.includes(b)) return 80;
  const aParts = new Set(a.split(" "));
  const bParts = b.split(" ").filter(Boolean);
  const overlap = bParts.filter((p) => aParts.has(p)).length;
  return Math.round((overlap / Math.max(aParts.size, bParts.length)) * 70);
}

async function getSpotifyAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });
    if (!response.ok) return null;

    const data = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;

    cachedToken = {
      value: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    };
    return data.access_token;
  } catch {
    return null;
  }
}

export type SpotifyArtistMatch = {
  id: string;
  name: string;
  imageUrl?: string;
  externalUrl?: string;
};

/** Search + fetch full artist object; use artist.images only (not oEmbed/album art). */
export async function fetchSpotifyArtistPortrait(
  artistName: string,
  knownSpotifyUrl?: string,
): Promise<SpotifyArtistMatch | null> {
  const token = await getSpotifyAccessToken();
  if (!token) return null;

  let artistId: string | null = null;

  const urlMatch = knownSpotifyUrl?.match(/spotify\.com\/artist\/([a-zA-Z0-9]+)/i);
  if (urlMatch?.[1]) artistId = urlMatch[1];

  if (!artistId) {
    const searchRes = await fetch(
      `${SPOTIFY_API}/search?q=${encodeURIComponent(artistName)}&type=artist&limit=8`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!searchRes.ok) return null;

    const search = (await searchRes.json()) as {
      artists?: { items?: Array<{ id: string; name: string; images?: Array<{ url: string }> }> };
    };

    const items = search.artists?.items ?? [];
    if (items.length === 0) return null;

    const ranked = items
      .map((item) => ({ item, score: nameSimilarity(artistName, item.name) }))
      .sort((a, b) => b.score - a.score);

    if (ranked[0].score < 40) return null;
    artistId = ranked[0].item.id;
  }

  const artistRes = await fetch(`${SPOTIFY_API}/artists/${artistId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!artistRes.ok) return null;

  const artist = (await artistRes.json()) as {
    id: string;
    name: string;
    images?: Array<{ url: string; height?: number; width?: number }>;
    external_urls?: { spotify?: string };
  };

  const imageUrl = artist.images?.[0]?.url;
  if (!imageUrl) return null;

  return {
    id: artist.id,
    name: artist.name,
    imageUrl,
    externalUrl: artist.external_urls?.spotify,
  };
}
