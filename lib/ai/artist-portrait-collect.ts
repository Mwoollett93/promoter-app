import { fetchPageHtml } from "@/lib/ai/artist-contact-extract";
import type { ArtistExternalLinks } from "@/lib/ai/artist-musicbrainz-links";
import type { PortraitImageCandidate, PortraitSourceType } from "@/lib/ai/artist-portrait-candidate-types";
import {
  extractImgCandidates,
  extractOgImage,
  extractPageContext,
  extractPressLinks,
  extractTitle,
} from "@/lib/ai/artist-portrait-page";
import { probeImageDimensions } from "@/lib/ai/artist-portrait-probe";
import {
  isBandcampAlbumArtUrl,
  isBandcampArtistPhotoUrl,
  scorePortraitHeuristics,
} from "@/lib/ai/artist-portrait-heuristics";
import { fetchBandcampArtistPortrait } from "@/lib/ai/bandcamp-artist-api";
import { fetchDeezerArtistPortrait } from "@/lib/ai/deezer-artist-api";
import { fetchResidentAdvisorArtistPortrait, isResidentAdvisorArtistUrl } from "@/lib/ai/ra-artist-api";
import { fetchSpotifyArtistPortrait } from "@/lib/ai/spotify-artist-api";

const MUSICBRAINZ_UA = "PromoSync/1.0 (promoter-app; contact@promosync.app)";
const AGENCY_HOST_RE =
  /agency|management|booking|roster|artists|press|publicity|epk|talent/i;

const RELEASE_PATH_RE = /\/album\/|\/track\/|\/release\/|\/product\//i;

let candidateCounter = 0;

function nextId(): string {
  candidateCounter += 1;
  return `portrait-${candidateCounter}`;
}

function normalizeUrl(url: string): string | undefined {
  const trimmed = url.trim();
  if (!trimmed.startsWith("http")) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (/example|placeholder|dummy|fake/i.test(trimmed)) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function isBandcampAlbumPage(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return RELEASE_PATH_RE.test(path) || /\/album\b/.test(path) || /\/track\b/.test(path);
  } catch {
    return false;
  }
}

function pushCandidate(
  list: PortraitImageCandidate[],
  partial: Omit<PortraitImageCandidate, "id" | "score" | "warnings"> & {
    score?: number;
    warnings?: string[];
  },
) {
  const imageUrl = normalizeUrl(partial.imageUrl);
  if (!imageUrl) return;
  if (list.some((c) => c.imageUrl === imageUrl)) return;

  list.push({
    id: nextId(),
    imageUrl,
    sourceUrl: partial.sourceUrl,
    sourceType: partial.sourceType,
    pageTitle: partial.pageTitle,
    altText: partial.altText,
    surroundingText: partial.surroundingText,
    width: partial.width,
    height: partial.height,
    isReleaseContext: partial.isReleaseContext,
    attribution: partial.attribution,
    score: partial.score ?? 0,
    warnings: partial.warnings ?? [],
  });
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store", ...init });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function wikimediaCommonsImage(filename: string): Promise<{
  url: string;
  width?: number;
  height?: number;
} | undefined> {
  const fileTitle = `File:${filename.replace(/ /g, "_")}`;
  const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url|size&iiurlwidth=800&format=json`;

  const data = await fetchJson<{
    query?: {
      pages?: Record<
        string,
        {
          imageinfo?: Array<{
            thumburl?: string;
            url?: string;
            thumbwidth?: number;
            thumbheight?: number;
          }>;
        }
      >;
    };
  }>(api, { headers: { "User-Agent": MUSICBRAINZ_UA } });

  const page = data?.query?.pages ? Object.values(data.query.pages)[0] : undefined;
  const info = page?.imageinfo?.[0];
  const url = info?.thumburl ?? info?.url;
  if (!info || !url) return undefined;
  return { url, width: info.thumbwidth, height: info.thumbheight };
}

async function collectWikimedia(
  wikidataId: string,
  out: PortraitImageCandidate[],
): Promise<void> {
  const entity = await fetchJson<{
    entities?: Record<
      string,
      { claims?: { P18?: Array<{ mainsnak?: { datavalue?: { value?: string } } }> } }
    >
  }>(`https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`);

  const claims = entity?.entities?.[wikidataId]?.claims?.P18 ?? [];
  for (const claim of claims) {
    const filename = claim.mainsnak?.datavalue?.value;
    if (typeof filename !== "string" || !filename) continue;

    const image = await wikimediaCommonsImage(filename);
    if (!image) continue;

    const heuristic = scorePortraitHeuristics(image.url, "wikimedia", {
      filename,
      width: image.width,
      height: image.height,
    });
    if (heuristic.reject) continue;

    pushCandidate(out, {
      imageUrl: image.url,
      sourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename)}`,
      sourceType: "wikimedia",
      pageTitle: filename,
      surroundingText: filename,
      width: image.width,
      height: image.height,
      attribution: `Wikimedia Commons — ${filename} (CC; verify on apply)`,
      warnings: heuristic.warnings,
    });
  }
}

async function collectBandcamp(bandcampUrl: string, out: PortraitImageCandidate[]): Promise<void> {
  if (isBandcampAlbumPage(bandcampUrl)) return;

  const html = await fetchPageHtml(bandcampUrl);
  if (html) {
    const context = extractPageContext(html, bandcampUrl);
    if (context.isReleasePage || isBandcampAlbumPage(context.url)) return;

    const og = extractOgImage(html);
    if (og) {
      const imageUrl = og.startsWith("http") ? og : new URL(og, bandcampUrl).toString();
      if (!isBandcampAlbumArtUrl(imageUrl)) {
        const heuristic = scorePortraitHeuristics(imageUrl, "bandcamp_artist");
        if (!heuristic.reject) {
          pushCandidate(out, {
            imageUrl,
            sourceUrl: bandcampUrl,
            sourceType: "bandcamp_artist",
            pageTitle: context.title,
            surroundingText: context.text.slice(0, 1500),
            warnings: heuristic.warnings,
          });
        }
      }
    }
  }

  const fallback = await fetchBandcampArtistPortrait(bandcampUrl);
  if (fallback && !out.some((c) => c.sourceType === "bandcamp_artist")) {
    pushCandidate(out, {
      imageUrl: fallback,
      sourceUrl: bandcampUrl,
      sourceType: "bandcamp_artist",
    });
  }
}

async function collectOfficialAndAgency(
  website: string,
  artistName: string,
  out: PortraitImageCandidate[],
  releaseImageUrls: Set<string>,
): Promise<void> {
  let base: URL;
  try {
    base = new URL(website.startsWith("http") ? website : `https://${website}`);
  } catch {
    return;
  }

  const homepageUrl = base.toString();
  const pagesToScan = new Set<string>([homepageUrl]);

  const homeHtml = await fetchPageHtml(homepageUrl);
  if (homeHtml) {
    for (const link of extractPressLinks(homeHtml, homepageUrl)) {
      pagesToScan.add(link);
    }
    const homeContext = extractPageContext(homeHtml, homepageUrl);
    const homeOg = extractOgImage(homeHtml);
    if (homeOg && homeContext.isPressPage) {
      const imageUrl = homeOg.startsWith("http") ? homeOg : new URL(homeOg, homepageUrl).toString();
      pushCandidate(out, {
        imageUrl,
        sourceUrl: homepageUrl,
        sourceType: "official_site",
        pageTitle: homeContext.title,
        surroundingText: homeContext.text.slice(0, 1500),
        isReleaseContext: homeContext.isReleasePage,
      });
    }
  }

  const fixedPaths = ["/press", "/media", "/epk", "/photos", "/bio", "/about", "/contact"];
  for (const path of fixedPaths) {
    try {
      pagesToScan.add(new URL(path, base).toString());
    } catch {
      /* skip */
    }
  }

  let pagesScanned = 0;
  for (const pageUrl of pagesToScan) {
    if (pagesScanned >= MAX_OFFICIAL_PAGES) break;
    pagesScanned += 1;
    const html = pageUrl === homepageUrl ? homeHtml : await fetchPageHtml(pageUrl);
    if (!html) continue;

    const context = extractPageContext(html, pageUrl);
    const isAgency =
      AGENCY_HOST_RE.test(pageUrl) ||
      AGENCY_HOST_RE.test(context.title) ||
      /management|booking|agency|roster/i.test(context.text.slice(0, 1200));

    const sourceType: PortraitSourceType = isAgency ? "agency_press" : "official_site";

    if (context.isReleasePage) {
      const og = extractOgImage(html);
      if (og) {
        const u = og.startsWith("http") ? og : new URL(og, pageUrl).toString();
        releaseImageUrls.add(u);
      }
      for (const img of extractImgCandidates(html, pageUrl)) {
        releaseImageUrls.add(img.url);
      }
      continue;
    }

    const og = extractOgImage(html);
    if (og) {
      const imageUrl = og.startsWith("http") ? og : new URL(og, pageUrl).toString();
      pushCandidate(out, {
        imageUrl,
        sourceUrl: pageUrl,
        sourceType,
        pageTitle: context.title,
        surroundingText: context.text.slice(0, 1500),
        isReleaseContext: false,
      });
    }

    for (const img of extractImgCandidates(html, pageUrl)) {
      if (!img.url || img.url.length < 12) continue;
      const altLower = img.alt.toLowerCase();
      if (!/\b(photo|portrait|press|artist|headshot|profile)\b/i.test(altLower)) continue;
      pushCandidate(out, {
        imageUrl: img.url,
        sourceUrl: pageUrl,
        sourceType,
        pageTitle: context.title,
        altText: img.alt,
        surroundingText: context.text.slice(0, 800),
      });
    }
  }

  for (const other of [base.hostname]) {
    if (artistName && other.includes("agency")) {
      /* scanned via pagesToScan */
    }
  }
}

async function instagramProfileImage(instagramUrl: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://api.instagram.com/oembed?url=${encodeURIComponent(instagramUrl)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return undefined;
    const data = (await res.json()) as { thumbnail_url?: string };
    return data.thumbnail_url;
  } catch {
    return undefined;
  }
}

const MAX_OFFICIAL_PAGES = 8;

export async function collectPortraitCandidates(input: {
  artistName: string;
  spotify?: string;
  website?: string;
  instagram?: string;
  externalLinks?: ArtistExternalLinks | null;
  /** Skip Spotify/Deezer (already resolved in fast stage). */
  slowOnly?: boolean;
}): Promise<PortraitImageCandidate[]> {
  candidateCounter = 0;
  const candidates: PortraitImageCandidate[] = [];
  const releaseImageUrls = new Set<string>();

  if (!input.slowOnly) {
    const spotifyUrl = input.spotify ?? input.externalLinks?.spotify;
    const spotify = await fetchSpotifyArtistPortrait(input.artistName, spotifyUrl);
    if (spotify?.imageUrl && !spotify.fromOembed) {
      pushCandidate(candidates, {
        imageUrl: spotify.imageUrl,
        sourceUrl: spotify.externalUrl ?? spotifyUrl ?? "",
        sourceType: "spotify_artist",
        pageTitle: input.artistName,
        surroundingText: "Spotify Web API artist object",
      });
    }
  }

  const siteUrl = input.website ?? input.externalLinks?.website;
  if (siteUrl) {
    await collectOfficialAndAgency(siteUrl, input.artistName, candidates, releaseImageUrls);
  }

  const raUrl = input.externalLinks?.residentAdvisor;
  if (raUrl && isResidentAdvisorArtistUrl(raUrl)) {
    const ra = await fetchResidentAdvisorArtistPortrait(raUrl);
    if (ra) {
      pushCandidate(candidates, {
        imageUrl: ra.imageUrl,
        sourceUrl: ra.sourceUrl,
        sourceType: "resident_advisor",
        pageTitle: ra.pageTitle,
        surroundingText: ra.pageText,
      });
    }
  }

  const wikidataId = input.externalLinks?.wikidataId;
  if (wikidataId) await collectWikimedia(wikidataId, candidates);

  const bandcampUrl = input.externalLinks?.bandcamp;
  if (bandcampUrl) await collectBandcamp(bandcampUrl, candidates);

  if (!input.slowOnly) {
    const deezerUrl = await fetchDeezerArtistPortrait(input.artistName);
    if (deezerUrl) {
      pushCandidate(candidates, {
        imageUrl: deezerUrl,
        sourceUrl: `https://www.deezer.com/search/${encodeURIComponent(input.artistName)}`,
        sourceType: "deezer_artist",
        pageTitle: input.artistName,
        surroundingText: "Deezer artist profile image",
      });
    }
  }

  if (input.instagram) {
    const ig = await instagramProfileImage(input.instagram);
    if (ig) {
      pushCandidate(candidates, {
        imageUrl: ig,
        sourceUrl: input.instagram,
        sourceType: "instagram",
        pageTitle: input.artistName,
        surroundingText: "Instagram oEmbed thumbnail",
        warnings: ["Instagram thumbnail — verify before saving"],
      });
    }
  }

  for (const otherUrl of input.externalLinks?.otherUrls ?? []) {
    if (!AGENCY_HOST_RE.test(otherUrl)) continue;
    await collectOfficialAndAgency(otherUrl, input.artistName, candidates, releaseImageUrls);
  }

  for (const c of candidates) {
    if (releaseImageUrls.has(c.imageUrl)) {
      c.isReleaseContext = true;
    }
  }

  return candidates;
}

export async function enrichCandidatesWithDimensions(
  candidates: PortraitImageCandidate[],
): Promise<PortraitImageCandidate[]> {
  const enriched: PortraitImageCandidate[] = [];
  for (const c of candidates) {
    if (c.width && c.height) {
      enriched.push(c);
      continue;
    }
    const dims = await probeImageDimensions(c.imageUrl);
    enriched.push({ ...c, width: dims.width ?? c.width, height: dims.height ?? c.height });
  }
  return enriched;
}
