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
  /coverartarchive\.org|mzstatic\.com|itunes\.apple|music\.apple|album|cover|release|single|\bep\b|\blp\b|artwork|track/i;

function isBlockedCatalogueUrl(url: string): boolean {
  if (/dzcdn\.net\/images\/artist\//i.test(url)) return false;
  if (/bcbits\.com\/img\/\d+_\d+\./i.test(url) && !/bcbits\.com\/img\/a\d+/i.test(url)) return false;
  if (/dzcdn\.net|deezer\.com/i.test(url)) return true;
  return ALBUM_HOST_OR_PATH.test(url);
}

export function sanitizeArtistImageUrl(url: string | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  const trimmed = url.trim();
  if (!/^https:\/\//i.test(trimmed)) return undefined;

  try {
    const parsed = new URL(trimmed);
    if (BLOCKED_IMAGE_HOSTS.some((host) => parsed.hostname.endsWith(host))) return undefined;
    if (/example|placeholder|dummy|fake/i.test(trimmed)) return undefined;
    if (isBlockedCatalogueUrl(trimmed)) return undefined;
    return trimmed;
  } catch {
    return undefined;
  }
}

export function isDisplayableArtistImageUrl(url: string | undefined): url is string {
  return Boolean(sanitizeArtistImageUrl(url));
}
