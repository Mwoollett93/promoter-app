import type { ArtistImageConfidence, ArtistImageSource } from "@/lib/ai/artist-portrait-types";

export type PortraitSourceType = ArtistImageSource | "resident_advisor" | "agency_press";

export type PortraitImageCandidate = {
  id: string;
  imageUrl: string;
  sourceUrl: string;
  sourceType: PortraitSourceType;
  pageTitle?: string;
  altText?: string;
  surroundingText?: string;
  width?: number;
  height?: number;
  score: number;
  warnings: string[];
  attribution?: string;
  isReleaseContext?: boolean;
  vision?: {
    isLikelyArtistPhoto: boolean;
    reason: string;
    confidence: ArtistImageConfidence;
  };
};

export type PortraitResolutionResult = {
  imageUrl?: string;
  imageSource: ArtistImageSource;
  imageConfidence: ArtistImageConfidence;
  imageWarnings: string[];
  imageAttribution?: string;
  imageCandidates: PortraitImageCandidate[];
  requiresImageChoice: boolean;
};
