import { fetchPageHtml } from "@/lib/ai/artist-contact-extract";
import { isBandcampAlbumArtUrl, isBandcampArtistPhotoUrl } from "@/lib/ai/artist-portrait-heuristics";

function extractOgImage(html: string): string | undefined {
  const patterns = [
    /property=["']og:image(?::secure_url)?["']\s+content=["']([^"']+)["']/i,
    /content=["']([^"']+)["']\s+property=["']og:image(?::secure_url)?["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

/** Bandcamp artist page og:image is usually a press photo (not /img/a* album paths). */
export async function fetchBandcampArtistPortrait(bandcampUrl: string): Promise<string | undefined> {
  try {
    const html = await fetchPageHtml(bandcampUrl);
    if (!html) return undefined;
    const og = extractOgImage(html);
    if (!og) return undefined;
    const url = og.startsWith("http") ? og : new URL(og, bandcampUrl).toString();
    if (isBandcampAlbumArtUrl(url)) return undefined;
    if (!isBandcampArtistPhotoUrl(url) && !/bcbits\.com\/img\//i.test(url)) return undefined;
    return url;
  } catch {
    return undefined;
  }
}
