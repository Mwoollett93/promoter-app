/** Block placeholder / hallucinated image URLs from OpenAI. */
const BLOCKED_IMAGE_HOSTS = [
  "example.com",
  "example.org",
  "placeholder.com",
  "via.placeholder.com",
  "placehold.co",
  "picsum.photos",
  "lorempixel.com",
  "dummyimage.com",
  "fakeimg.pl",
];

const ALBUM_HOST_OR_PATH =
  /coverartarchive\.org|dzcdn\.net|deezer\.com|mzstatic\.com|itunes\.apple|music\.apple|album|cover|release|single|\bep\b|\blp\b|artwork|track/i;

export function sanitizeArtistImageUrl(url: string | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  const trimmed = url.trim();
  if (!/^https:\/\//i.test(trimmed)) return undefined;

  try {
    const parsed = new URL(trimmed);
    if (BLOCKED_IMAGE_HOSTS.some((host) => parsed.hostname.endsWith(host))) return undefined;
    if (/example|placeholder|dummy|fake/i.test(trimmed)) return undefined;
    if (ALBUM_HOST_OR_PATH.test(trimmed)) return undefined;
    return trimmed;
  } catch {
    return undefined;
  }
}

export function isDisplayableArtistImageUrl(url: string | undefined): url is string {
  return Boolean(sanitizeArtistImageUrl(url));
}
