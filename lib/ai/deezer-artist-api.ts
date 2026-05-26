/** Deezer public API — artist profile photos only (not album covers). No API key required. */

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function isDeezerArtistPhotoUrl(url: string): boolean {
  return /dzcdn\.net\/images\/artist\//i.test(url);
}

export async function fetchDeezerArtistPortrait(artistName: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.deezer.com/search/artist?q=${encodeURIComponent(artistName)}&limit=8`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      data?: Array<{ name: string; picture_xl?: string }>;
    };

    const items = data.data ?? [];
    if (items.length === 0) return null;

    const query = normalizeName(artistName);
    const ranked = items
      .map((item) => ({
        item,
        score: normalizeName(item.name) === query ? 100 : normalizeName(item.name).includes(query) ? 80 : 0,
      }))
      .sort((a, b) => b.score - a.score);

    const best = ranked[0]?.item;
    const url = best?.picture_xl;
    if (!url || !isDeezerArtistPhotoUrl(url)) return null;
    return url;
  } catch {
    return null;
  }
}
