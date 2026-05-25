export const MAX_ARTIST_BIO_WORDS = 500;

/** Count words in plain text (whitespace-separated tokens). */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Trim text to at most `maxWords` without breaking mid-word. */
export function trimToMaxWords(text: string, maxWords = MAX_ARTIST_BIO_WORDS): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) return trimmed;
  return `${words.slice(0, maxWords).join(" ")}…`;
}

/** Parse "Melbourne, Australia" or "Melbourne VIC" into city/country when possible. */
export function parseLocation(location: string | undefined): { city: string; country: string } {
  if (!location?.trim()) return { city: "", country: "" };
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { city: parts[0] ?? "", country: parts[parts.length - 1] ?? "" };
  }
  return { city: location.trim(), country: "" };
}
