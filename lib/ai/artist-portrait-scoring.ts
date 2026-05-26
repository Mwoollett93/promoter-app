import type { PortraitImageCandidate, PortraitSourceType } from "@/lib/ai/artist-portrait-candidate-types";
import {
  isBandcampAlbumArtUrl,
  isSpotifyAlbumStyleUrl,
  isSpotifyOembedThumbnail,
} from "@/lib/ai/artist-portrait-heuristics";
import { isDeezerArtistPhotoUrl } from "@/lib/ai/deezer-artist-api";

const PRESS_CONTEXT_RE =
  /\b(press photo|press shot|artist photo|promo photo|portrait|biography|about|media kit|epk|publicity|headshot)\b/i;

const RELEASE_CONTEXT_RE =
  /\b(album|single|ep|lp|release|track|artwork|cover|merch|vinyl|cassette|digital album|buy)\b/i;

const RELEASE_PAGE_RE =
  /\/album\/|\/track\/|\/release\/|\/product\/|\/merch\b|\/store\b/i;

const PREFERRED_RATIOS: Array<{ w: number; h: number; tolerance: number }> = [
  { w: 4, h: 5, tolerance: 0.12 },
  { w: 3, h: 4, tolerance: 0.12 },
  { w: 16, h: 9, tolerance: 0.12 },
  { w: 3, h: 2, tolerance: 0.12 },
  { w: 4, h: 3, tolerance: 0.12 },
];

const BASE_SCORE: Record<PortraitSourceType, number> = {
  spotify_artist: 60,
  official_site: 70,
  agency_press: 65,
  resident_advisor: 55,
  wikimedia: 50,
  bandcamp_artist: 35,
  deezer_artist: 30,
  instagram: 25,
  manual_required: 0,
};

function contextBlob(candidate: PortraitImageCandidate): string {
  return [
    candidate.imageUrl,
    candidate.sourceUrl,
    candidate.pageTitle ?? "",
    candidate.altText ?? "",
    candidate.surroundingText ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

function isExactSquare(width?: number, height?: number): boolean {
  if (!width || !height || width < 1 || height < 1) return false;
  const ratio = width / height;
  return ratio > 0.98 && ratio < 1.02;
}

function matchesPreferredRatio(width: number, height: number): boolean {
  const ratio = width / height;
  return PREFERRED_RATIOS.some(({ w, h, tolerance }) => {
    const target = w / h;
    return Math.abs(ratio - target) <= tolerance || Math.abs(1 / ratio - target) <= tolerance;
  });
}

function hasMajorWarning(warnings: string[]): boolean {
  return warnings.some(
    (w) =>
      w.includes("Cover Art") ||
      w.includes("album API") ||
      w.includes("oEmbed") ||
      w.includes("release page") ||
      w.includes("Rejected"),
  );
}

export function scorePortraitCandidate(
  candidate: Omit<PortraitImageCandidate, "score" | "warnings"> & { warnings?: string[] },
  options: {
    artistName: string;
    alsoOnReleasePages?: boolean;
  },
): { score: number; warnings: string[]; reject: boolean } {
  const warnings = [...(candidate.warnings ?? [])];
  let score = BASE_SCORE[candidate.sourceType] ?? 0;
  const blob = contextBlob(candidate as PortraitImageCandidate);
  const lowerUrl = candidate.imageUrl.toLowerCase();

  if (isSpotifyOembedThumbnail(lowerUrl) || isSpotifyAlbumStyleUrl(lowerUrl)) {
    score -= 100;
    warnings.push("Spotify oEmbed or album-style CDN — rejected");
    return { score, warnings, reject: true };
  }

  if (lowerUrl.includes("coverartarchive.org")) {
    score -= 100;
    warnings.push("Cover Art Archive — release artwork only");
    return { score, warnings, reject: true };
  }

  if (candidate.isReleaseContext || RELEASE_PAGE_RE.test(candidate.sourceUrl)) {
    score -= 50;
    warnings.push("Source page is a release/store page");
    if (candidate.sourceType === "bandcamp_artist") {
      return { score, warnings, reject: true };
    }
  }

  if (PRESS_CONTEXT_RE.test(blob)) score += 25;
  if (RELEASE_CONTEXT_RE.test(blob)) score -= 50;

  const width = candidate.width;
  const height = candidate.height;
  if (width && height) {
    if (width < 300 || height < 300) {
      score -= 25;
      warnings.push("Image below 300px — too small");
      if (width < 300) return { score, warnings, reject: true };
    }
    if (width >= 600) score += 15;

    if (isExactSquare(width, height)) {
      if (candidate.sourceType === "spotify_artist") {
        /* Spotify artist portraits may be square — allowed */
      } else if (
        candidate.sourceType === "deezer_artist" ||
        candidate.sourceType === "bandcamp_artist" ||
        candidate.sourceType === "wikimedia" ||
        candidate.sourceType === "official_site"
      ) {
        score -= 35;
        warnings.push(`Square image from ${candidate.sourceType} — check before saving`);
      }
    } else {
      score += 10;
      if (matchesPreferredRatio(width, height)) score += 5;
    }
  }

  if (/cover|artwork|album|release/i.test(lowerUrl)) {
    score -= 30;
    warnings.push("Filename/URL suggests cover or release artwork");
  }

  if (isBandcampAlbumArtUrl(lowerUrl)) {
    return { score: score - 100, warnings: [...warnings, "Bandcamp album artwork path"], reject: true };
  }

  if (!isDeezerArtistPhotoUrl(lowerUrl) && /dzcdn\.net/i.test(lowerUrl)) {
    score -= 50;
    warnings.push("Deezer non-artist image path");
  }

  if (options.alsoOnReleasePages) {
    score -= 40;
    warnings.push("Same image URL also found on a release page");
  }

  const artistLower = options.artistName.trim().toLowerCase();
  if (artistLower && (candidate.pageTitle ?? "").toLowerCase().includes(artistLower)) {
    score += 10;
  }

  if (
    candidate.sourceType === "bandcamp_artist" &&
    isExactSquare(width, height) &&
    !PRESS_CONTEXT_RE.test(blob)
  ) {
    score = Math.min(score, 55);
    if (!warnings.some((w) => w.includes("Square"))) {
      warnings.push("Bandcamp square image without press/bio context — medium confidence at best");
    }
  }

  const reject = score < 45 || hasMajorWarning(warnings);
  return { score, warnings, reject };
}

export function portraitScoreToConfidence(score: number): "low" | "medium" | "high" {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

export function canAutoApplyPortrait(
  top: PortraitImageCandidate,
  visionEnabled: boolean,
): boolean {
  if (top.score < 70 || hasMajorWarning(top.warnings)) return false;
  if (!visionEnabled) return true;
  const vision = top.vision;
  if (!vision) return false;
  return (
    vision.isLikelyArtistPhoto &&
    (vision.confidence === "medium" || vision.confidence === "high")
  );
}

export function mapPortraitSourceToArtistSource(
  sourceType: PortraitSourceType,
): import("@/lib/ai/artist-portrait-types").ArtistImageSource {
  if (sourceType === "resident_advisor") return "official_site";
  if (sourceType === "agency_press") return "official_site";
  if (sourceType === "manual_required") return "manual_required";
  return sourceType;
}
