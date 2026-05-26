import type { PortraitImageCandidate } from "@/lib/ai/artist-portrait-candidate-types";
import {
  mapPortraitSourceToArtistSource,
  portraitScoreToConfidence,
  scorePortraitCandidate,
} from "@/lib/ai/artist-portrait-scoring";
import type {
  ArtistImageConfidence,
  ArtistImageSource,
} from "@/lib/ai/artist-portrait-types";
import { scorePortraitHeuristics } from "@/lib/ai/artist-portrait-heuristics";
import type { SpotifyArtistMatch } from "@/lib/ai/spotify-artist-api";

let candidateCounter = 0;

function nextId(): string {
  candidateCounter += 1;
  return `fast-${candidateCounter}`;
}

export function buildFastPortraitCandidates(input: {
  artistName: string;
  spotify?: SpotifyArtistMatch | null;
  deezerImageUrl?: string | null;
}): PortraitImageCandidate[] {
  candidateCounter = 0;
  const candidates: PortraitImageCandidate[] = [];

  if (input.spotify?.imageUrl && !input.spotify.fromOembed) {
    candidates.push({
      id: nextId(),
      imageUrl: input.spotify.imageUrl,
      sourceUrl: input.spotify.externalUrl ?? "",
      sourceType: "spotify_artist",
      pageTitle: input.spotify.name,
      surroundingText: "Spotify Web API artist object",
      width: undefined,
      height: undefined,
      score: 0,
      warnings: [],
    });
  }

  if (input.deezerImageUrl) {
    candidates.push({
      id: nextId(),
      imageUrl: input.deezerImageUrl,
      sourceUrl: `https://www.deezer.com/search/${encodeURIComponent(input.artistName)}`,
      sourceType: "deezer_artist",
      pageTitle: input.artistName,
      surroundingText: "Deezer artist profile image",
      score: 0,
      warnings: [],
    });
  }

  const scored: PortraitImageCandidate[] = [];
  for (const candidate of candidates) {
    const mapped = mapPortraitSourceToArtistSource(candidate.sourceType);
    const heuristic = scorePortraitHeuristics(candidate.imageUrl, mapped);
    if (heuristic.reject) continue;

    const { score, warnings, reject } = scorePortraitCandidate(
      { ...candidate, warnings: heuristic.warnings },
      { artistName: input.artistName },
    );
    if (reject || score < 45) continue;

    scored.push({
      ...candidate,
      score: score + heuristic.scoreDelta,
      warnings: [...warnings, ...heuristic.warnings],
    });
  }

  return scored.sort((a, b) => b.score - a.score);
}

export function resolveFastPortrait(input: {
  artistName: string;
  spotify?: SpotifyArtistMatch | null;
  deezerImageUrl?: string | null;
}): {
  imageUrl?: string;
  imageSource: ArtistImageSource;
  imageConfidence: ArtistImageConfidence;
  imageWarnings: string[];
  imageCandidates: PortraitImageCandidate[];
  requiresImageChoice: boolean;
} {
  const candidates = buildFastPortraitCandidates(input);
  if (candidates.length === 0) {
    return {
      imageSource: "manual_required",
      imageConfidence: "low",
      imageWarnings: ["Finding image…"],
      imageCandidates: [],
      requiresImageChoice: false,
    };
  }

  const top = candidates[0];
  const confidence =
    top.sourceType === "spotify_artist" ? "high" : portraitScoreToConfidence(top.score);
  const showImage = top.sourceType === "spotify_artist" || top.score >= 55;

  return {
    imageUrl: showImage ? top.imageUrl : undefined,
    imageSource: mapPortraitSourceToArtistSource(top.sourceType),
    imageConfidence: confidence,
    imageWarnings: top.warnings,
    imageCandidates: candidates.slice(0, 3),
    requiresImageChoice: candidates.length > 1 && top.score < 70,
  };
}
