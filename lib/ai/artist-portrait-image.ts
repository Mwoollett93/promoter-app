import type {
  ArtistImageConfidence,
  ArtistImageResult,
  ArtistImageSource,
} from "@/lib/ai/artist-portrait-types";
import type {
  PortraitImageCandidate,
  PortraitResolutionResult,
} from "@/lib/ai/artist-portrait-candidate-types";
import {
  collectPortraitCandidates,
  enrichCandidatesWithDimensions,
} from "@/lib/ai/artist-portrait-collect";
import { isDeezerArtistPhotoUrl } from "@/lib/ai/deezer-artist-api";
import {
  isBandcampAlbumArtUrl,
  isSpotifyOembedThumbnail,
  scorePortraitHeuristics,
} from "@/lib/ai/artist-portrait-heuristics";
import {
  applyVisionToTopCandidates,
  isPortraitVisionEnabled,
} from "@/lib/ai/artist-portrait-vision";
import {
  canAutoApplyPortrait,
  mapPortraitSourceToArtistSource,
  portraitScoreToConfidence,
  scorePortraitCandidate,
} from "@/lib/ai/artist-portrait-scoring";
import type { ArtistExternalLinks } from "@/lib/ai/artist-musicbrainz-links";

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
  "images.ra.co",
  "static.ra.co",
];

function normalizeUrl(url: string): string | undefined {
  const trimmed = url.trim();
  if (!trimmed.startsWith("http")) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (BLOCKED_HOSTS.some((h) => parsed.hostname.endsWith(h))) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function urlLooksLikeAlbumArt(url: string, sourceType: PortraitImageCandidate["sourceType"]): boolean {
  const lower = url.toLowerCase();
  if (sourceType === "spotify_artist" && !isSpotifyOembedThumbnail(lower)) return false;
  if (sourceType === "deezer_artist" || isDeezerArtistPhotoUrl(lower)) return false;
  if (sourceType === "bandcamp_artist" && !isBandcampAlbumArtUrl(lower)) return false;
  if (lower.includes("coverartarchive.org")) return true;
  if (isSpotifyOembedThumbnail(lower)) return true;
  if (lower.includes("dzcdn.net") && !isDeezerArtistPhotoUrl(lower)) return true;
  if (ALBUM_URL_RE.test(lower) && sourceType !== "wikimedia") return true;
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

async function validateImageUrl(url: string): Promise<{ ok: boolean; warning?: string }> {
  const normalized = normalizeUrl(url);
  if (!normalized) return { ok: false, warning: "Invalid URL" };

  if (isTrustedPortraitHost(normalized)) return { ok: true };

  try {
    const head = await fetch(normalized, {
      method: "HEAD",
      redirect: "follow",
      cache: "no-store",
    });
    const type = head.headers.get("content-type") ?? "";
    if (head.ok && type.toLowerCase().startsWith("image/")) return { ok: true };
  } catch {
    /* GET probe */
  }

  try {
    const probe = await fetch(normalized, {
      method: "GET",
      headers: { Range: "bytes=0-1023" },
      redirect: "follow",
      cache: "no-store",
    });
    const type = probe.headers.get("content-type") ?? "";
    if (probe.ok && type.toLowerCase().startsWith("image/")) return { ok: true };
    return { ok: false, warning: `Not an image (${type || `HTTP ${probe.status}`})` };
  } catch {
    return { ok: false, warning: "Could not verify image" };
  }
}

function sourceLabel(sourceType: PortraitImageCandidate["sourceType"]): string {
  const labels: Record<PortraitImageCandidate["sourceType"], string> = {
    spotify_artist: "Spotify artist",
    official_site: "Official website",
    agency_press: "Agency / press kit",
    resident_advisor: "Resident Advisor",
    wikimedia: "Wikimedia Commons",
    bandcamp_artist: "Bandcamp",
    deezer_artist: "Deezer",
    instagram: "Instagram",
    manual_required: "Manual",
  };
  return labels[sourceType] ?? sourceType;
}

/** Resolve artist portrait with evidence scoring (never album-art fallbacks). */
export async function resolveArtistPortraitImage(input: {
  artistName: string;
  spotify?: string;
  website?: string;
  instagram?: string;
  externalLinks?: ArtistExternalLinks | null;
  mode?: "fast" | "full";
  /** Skip HEAD/GET validation and dimension probes (Stage B lazy path). */
  lazyValidation?: boolean;
  seedCandidates?: PortraitImageCandidate[];
}): Promise<PortraitResolutionResult> {
  const pipelineWarnings: string[] = [];
  const lazy = input.lazyValidation ?? input.mode === "full";
  const slowCollected = await collectPortraitCandidates({
    ...input,
    slowOnly: input.mode === "full",
  });
  const raw = [...(input.seedCandidates ?? []), ...slowCollected];
  const seen = new Set<string>();
  const deduped = raw.filter((c) => {
    if (seen.has(c.imageUrl)) return false;
    seen.add(c.imageUrl);
    return true;
  });
  const withDims = lazy ? deduped : await enrichCandidatesWithDimensions(deduped);

  const releaseDupes = new Set(
    withDims.filter((c) => c.isReleaseContext).map((c) => c.imageUrl),
  );

  const scored: PortraitImageCandidate[] = [];

  for (const candidate of withDims) {
    const mappedSource = mapPortraitSourceToArtistSource(candidate.sourceType);
    if (urlLooksLikeAlbumArt(candidate.imageUrl, candidate.sourceType)) {
      pipelineWarnings.push(`Rejected ${sourceLabel(candidate.sourceType)}: album/release pattern`);
      continue;
    }

    const legacyHeuristic = scorePortraitHeuristics(candidate.imageUrl, mappedSource, {
      filename: candidate.pageTitle,
      width: candidate.width,
      height: candidate.height,
    });
    if (legacyHeuristic.reject) {
      pipelineWarnings.push(`Rejected ${sourceLabel(candidate.sourceType)}: heuristic reject`);
      continue;
    }

    const { score, warnings, reject } = scorePortraitCandidate(
      { ...candidate, warnings: [...candidate.warnings, ...legacyHeuristic.warnings] },
      {
        artistName: input.artistName,
        alsoOnReleasePages: releaseDupes.has(candidate.imageUrl),
      },
    );

    if (reject || score < 45) continue;

    if (!lazy) {
      const check = await validateImageUrl(candidate.imageUrl);
      if (!check.ok) {
        pipelineWarnings.push(`Rejected ${sourceLabel(candidate.sourceType)}: ${check.warning ?? "invalid"}`);
        continue;
      }
    }

    scored.push({
      ...candidate,
      score: score + legacyHeuristic.scoreDelta,
      warnings: [...warnings],
    });
  }

  scored.sort((a, b) => b.score - a.score);

  const topForVision = scored.slice(0, 3);
  const withVision = lazy
    ? topForVision
    : await applyVisionToTopCandidates(topForVision, 3);
  const visionById = new Map(withVision.map((c) => [c.id, c]));

  const ranked = scored.map((c) => visionById.get(c.id) ?? c);
  const pickerCandidates = ranked.filter((c) => c.score >= 45).slice(0, 3);

  if (pickerCandidates.length === 0) {
    return {
      imageSource: "manual_required",
      imageConfidence: "low",
      imageWarnings: [
        ...pipelineWarnings,
        "No portrait met the minimum score (45). Upload a press photo manually.",
        ...(process.env.SPOTIFY_CLIENT_ID
          ? []
          : ["Add SPOTIFY_CLIENT_ID/SECRET for higher-confidence Spotify artist images."]),
      ],
      imageCandidates: [],
      requiresImageChoice: true,
    };
  }

  const top = pickerCandidates[0];
  const visionOn = isPortraitVisionEnabled();
  const autoApply = canAutoApplyPortrait(top, visionOn);

  const topSource = mapPortraitSourceToArtistSource(top.sourceType);
  const topConfidence = portraitScoreToConfidence(top.score);
  const showPreview =
    top.sourceType === "spotify_artist" || top.score >= 55 || topConfidence !== "low";

  const needsChoice =
    !autoApply ||
    (pickerCandidates.length > 1 && top.score < 85) ||
    (visionOn && !autoApply);

  return {
    imageUrl: showPreview ? top.imageUrl : undefined,
    imageSource: topSource,
    imageConfidence: autoApply ? "high" : topConfidence,
    imageWarnings: [
      ...pipelineWarnings,
      ...top.warnings,
      ...(needsChoice && pickerCandidates.length > 1
        ? ["Multiple image options — confirm when saving."]
        : []),
    ],
    imageAttribution: top.attribution,
    imageCandidates: pickerCandidates,
    requiresImageChoice: needsChoice && pickerCandidates.length > 0,
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
    imageCandidates?: PortraitImageCandidate[];
    requiresImageChoice?: boolean;
  })[]
> {
  const { sanitizeArtistImageUrl } = await import("@/lib/ai/artist-portrait-image-legacy");
  const results: (T & {
    imageUrl?: string;
    imageSource: ArtistImageSource;
    imageConfidence: ArtistImageConfidence;
    imageWarnings: string[];
    imageAttribution?: string;
    imageCandidates?: PortraitImageCandidate[];
    requiresImageChoice?: boolean;
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
      imageCandidates: portrait.imageCandidates,
      requiresImageChoice: portrait.requiresImageChoice,
    });
  }

  return results;
}

export type { ArtistImageResult };
