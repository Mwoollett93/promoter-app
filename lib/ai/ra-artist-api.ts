import { fetchPageHtml } from "@/lib/ai/artist-contact-extract";
import { extractOgImage, extractPageContext, extractTitle } from "@/lib/ai/artist-portrait-page";

const RA_ARTIST_RE = /^https?:\/\/(?:www\.)?ra\.co\/dj\/[^/?#]+/i;

export function isResidentAdvisorArtistUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.replace(/^www\./, "").endsWith("ra.co")) return false;
    return RA_ARTIST_RE.test(url) && !/\/events?\//i.test(parsed.pathname);
  } catch {
    return false;
  }
}

export type RaArtistPortrait = {
  imageUrl: string;
  pageTitle: string;
  pageText: string;
  sourceUrl: string;
};

/** RA DJ profile page — not event listings. */
export async function fetchResidentAdvisorArtistPortrait(
  raUrl: string,
): Promise<RaArtistPortrait | undefined> {
  if (!isResidentAdvisorArtistUrl(raUrl)) return undefined;

  const html = await fetchPageHtml(raUrl);
  if (!html) return undefined;

  const context = extractPageContext(html, raUrl);
  if (context.isReleasePage) return undefined;
  if (/\/events?\//i.test(raUrl)) return undefined;

  const og = extractOgImage(html);
  if (!og) return undefined;

  const imageUrl = og.startsWith("http") ? og : new URL(og, raUrl).toString();
  const title = extractTitle(html) || context.title;

  const identityOk =
    /\b(dj|artist|profile)\b/i.test(title) ||
    /\b(dj|artist)\b/i.test(context.text.slice(0, 1500)) ||
    RA_ARTIST_RE.test(raUrl);

  if (!identityOk) return undefined;

  if (/\bevent\b/i.test(title) && !/\bprofile\b/i.test(context.text.slice(0, 800))) {
    return undefined;
  }

  return {
    imageUrl,
    pageTitle: title,
    pageText: context.text.slice(0, 2000),
    sourceUrl: raUrl,
  };
}
