export const ARTIST_CLASSIFICATION_OPTIONS = [
  "Emerging",
  "Established",
  "Headliner",
  "Legacy",
] as const;

export type ArtistClassification = (typeof ARTIST_CLASSIFICATION_OPTIONS)[number];

export function normalizeArtistClassification(value: unknown): ArtistClassification | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const lower = value.trim().toLowerCase();

  for (const option of ARTIST_CLASSIFICATION_OPTIONS) {
    if (lower === option.toLowerCase()) return option;
  }

  if (lower.includes("headliner") || lower.includes("headline")) return "Headliner";
  if (lower.includes("legacy") || lower.includes("legend")) return "Legacy";
  if (lower.includes("emerging") || lower.includes("up and coming") || lower.includes("up-and-coming")) {
    return "Emerging";
  }
  if (lower.includes("established") || lower.includes("professional")) return "Established";

  return undefined;
}
