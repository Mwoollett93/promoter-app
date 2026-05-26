export type ArtistImageSource =
  | "spotify_artist"
  | "wikimedia"
  | "official_site"
  | "instagram"
  | "deezer_artist"
  | "manual_required";

export type ArtistImageConfidence = "low" | "medium" | "high";

export type ArtistImageResult = {
  imageUrl?: string;
  imageSource: ArtistImageSource;
  imageConfidence: ArtistImageConfidence;
  imageWarnings: string[];
  imageAttribution?: string;
};

export function imageConfidenceLabel(confidence: ArtistImageConfidence): string {
  if (confidence === "high") return "Likely artist image";
  if (confidence === "medium") return "Check image before saving";
  return "Possible mismatch — upload manually";
}

export function imageConfidenceClasses(confidence: ArtistImageConfidence): string {
  if (confidence === "high") return "border-[#14532D]/50 bg-[#0F2417] text-[#86EFAC]";
  if (confidence === "medium") return "border-[#8B5CF6]/30 bg-[#1A1630]/40 text-[#C4B5FD]";
  return "border-amber-500/30 bg-amber-500/10 text-amber-200";
}
