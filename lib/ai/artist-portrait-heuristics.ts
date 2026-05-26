import type { ArtistImageSource } from "@/lib/ai/artist-portrait-types";
import { isDeezerArtistPhotoUrl } from "@/lib/ai/deezer-artist-api";

const PRESS_FILENAME_RE =
  /\b(live|portrait|press|headshot|performing|dj|on stage|at |photo|artist|band)\b/i;

const ALBUM_FILENAME_RE =
  /\b(album|cover|artwork|release|single|ep|lp|vinyl|record|disk|disc|compilation|remix|original mix)\b/i;

const ILLUSTRATION_FILENAME_RE =
  /\b(logo|icon|banner|artwork|illustration|vector|poster|flyer)\b/i;

/** Spotify oEmbed thumbnails use this CDN and are often release art, not artist photos. */
export function isSpotifyOembedThumbnail(url: string): boolean {
  return /image-cdn-(?:fa\.)?spotifycdn\.com/i.test(url);
}

/** Spotify album-cover style hash segment (common on release artwork). */
export function isSpotifyAlbumStyleUrl(url: string): boolean {
  return /\/image\/ab67616d[0-9a-f]+/i.test(url) || /ab67616d0000b273/i.test(url);
}

/** Bandcamp album art paths typically include /img/a{id}. */
export function isBandcampAlbumArtUrl(url: string): boolean {
  return /bcbits\.com\/img\/a\d+/i.test(url);
}

export function isBandcampArtistPhotoUrl(url: string): boolean {
  return /bcbits\.com\/img\/\d+_\d+\./i.test(url) && !isBandcampAlbumArtUrl(url);
}

export type PortraitHeuristicResult = {
  scoreDelta: number;
  warnings: string[];
  reject: boolean;
};

export function scorePortraitHeuristics(
  url: string,
  source: ArtistImageSource,
  options?: { filename?: string; width?: number; height?: number },
): PortraitHeuristicResult {
  const lower = url.toLowerCase();
  const filename = (options?.filename ?? lower).toLowerCase();
  let scoreDelta = 0;
  const warnings: string[] = [];
  let reject = false;

  if (isDeezerArtistPhotoUrl(lower)) {
    scoreDelta += 12;
  }

  if (isBandcampArtistPhotoUrl(lower)) {
    scoreDelta += 14;
  }

  if (isBandcampAlbumArtUrl(lower)) {
    reject = true;
    warnings.push("Bandcamp album artwork path");
  }

  if (PRESS_FILENAME_RE.test(filename)) {
    scoreDelta += 10;
  }

  if (ALBUM_FILENAME_RE.test(filename) || ILLUSTRATION_FILENAME_RE.test(filename)) {
    scoreDelta -= 35;
    warnings.push("Filename suggests release artwork or graphic");
    if (source === "wikimedia" || source === "official_site") reject = true;
  }

  if (isSpotifyOembedThumbnail(lower)) {
    scoreDelta -= 28;
    warnings.push("Spotify embed thumbnail may be release artwork");
    if (isSpotifyAlbumStyleUrl(lower)) reject = true;
  }

  if (isSpotifyAlbumStyleUrl(lower) && source === "spotify_artist") {
    scoreDelta -= 40;
    reject = true;
    warnings.push("Spotify image matches album artwork pattern");
  }

  const width = options?.width;
  const height = options?.height;
  if (width && height && width > 0 && height > 0) {
    const ratio = width / height;
    const isSquare = ratio > 0.92 && ratio < 1.08;

    if (isSquare && (source === "wikimedia" || source === "official_site")) {
      if (!PRESS_FILENAME_RE.test(filename)) {
        scoreDelta -= 25;
        warnings.push("Square image without press-photo filename");
        if (ALBUM_FILENAME_RE.test(filename) || ILLUSTRATION_FILENAME_RE.test(filename)) {
          reject = true;
        }
      }
    }

    if (!isSquare && ratio >= 1.15 && ratio <= 2.2) {
      scoreDelta += 8;
      warnings.push("Landscape press-photo aspect ratio");
    }
  }

  return { scoreDelta, warnings, reject };
}
