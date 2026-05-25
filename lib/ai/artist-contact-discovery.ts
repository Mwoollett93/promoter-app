import type {
  ArtistContactCandidate,
  ArtistContactDiscovery,
  ContactConfidence,
  ContactType,
} from "@/lib/ai/artist-contact-types";
import {
  CONTACT_PATHS,
  classifyEmail,
  domainFromUrl,
  fetchPageHtml,
  scanHtmlPage,
  scoreEmailConfidence,
} from "@/lib/ai/artist-contact-extract";
import { fetchArtistExternalLinks } from "@/lib/ai/artist-musicbrainz-links";
import { fetchSpotifyArtistPortrait } from "@/lib/ai/spotify-artist-api";

const LINK_HUB_RE = /linktr\.ee|beacons\.ai|lnk\.bio|solo\.to/i;

type RawEmailHit = {
  email: string;
  contactType: ContactType;
  sourceUrl: string;
  sourceDomain: string;
  confidence: ContactConfidence;
  agencyName?: string;
  warnings: string[];
};

function uniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function artistDomainsFrom(urls: string[]): string[] {
  const domains = new Set<string>();
  for (const url of urls) {
    const d = domainFromUrl(url);
    if (d && !LINK_HUB_RE.test(d)) domains.add(d);
  }
  return [...domains];
}

async function scanUrlPaths(
  baseUrl: string,
  artistDomains: string[],
  hits: RawEmailHit[],
  agencyNames: Set<string>,
  warnings: string[],
): Promise<string | undefined> {
  let base: URL;
  try {
    base = new URL(baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`);
  } catch {
    return undefined;
  }

  let bestContactPage: string | undefined;

  for (const path of CONTACT_PATHS) {
    const pageUrl = new URL(path, base).toString();
    const html = await fetchPageHtml(pageUrl);
    if (!html) continue;

    bestContactPage = bestContactPage ?? pageUrl;
    const scan = scanHtmlPage(html, pageUrl, artistDomains);

    if (scan.isFestivalLineup) {
      warnings.push(`Festival/lineup page skipped as primary source: ${scan.domain}`);
      continue;
    }

    for (const name of scan.agencyNames) agencyNames.add(name);

    for (const email of scan.emails) {
      const contactType = classifyEmail(email);
      const confidence = scoreEmailConfidence(email, {
        sourceDomain: scan.domain,
        artistDomains,
        isOfficialArtistSite: scan.isOfficialArtistSite,
        isAgencySite: scan.isAgencySite,
        isFestivalLineup: scan.isFestivalLineup,
      });

      hits.push({
        email,
        contactType,
        sourceUrl: pageUrl,
        sourceDomain: scan.domain,
        confidence,
        warnings:
          confidence === "low"
            ? ["Low-confidence source — verify before using"]
            : [],
      });
    }

    if (LINK_HUB_RE.test(base.hostname) || LINK_HUB_RE.test(pageUrl)) {
      for (const link of scan.contactUrls.slice(0, 12)) {
        if (LINK_HUB_RE.test(link)) continue;
        const childHtml = await fetchPageHtml(link);
        if (!childHtml) continue;
        const child = scanHtmlPage(childHtml, link, artistDomains);
        for (const email of child.emails) {
          hits.push({
            email,
            contactType: classifyEmail(email),
            sourceUrl: link,
            sourceDomain: child.domain,
            confidence: scoreEmailConfidence(email, {
              sourceDomain: child.domain,
              artistDomains,
              isOfficialArtistSite: child.isOfficialArtistSite,
              isAgencySite: child.isAgencySite,
              isFestivalLineup: child.isFestivalLineup,
            }),
            warnings: [],
          });
        }
      }
    }
  }

  return bestContactPage;
}

function dedupeHits(hits: RawEmailHit[]): RawEmailHit[] {
  const byEmail = new Map<string, RawEmailHit>();
  const rank: Record<ContactConfidence, number> = { high: 3, medium: 2, low: 1 };

  for (const hit of hits) {
    const key = `${hit.email}:${hit.contactType}`;
    const existing = byEmail.get(key);
    if (!existing || rank[hit.confidence] > rank[existing.confidence]) {
      byEmail.set(key, hit);
    }
  }
  return [...byEmail.values()];
}

function hitsToCandidates(hits: RawEmailHit[], agencyNames: Set<string>): ArtistContactCandidate[] {
  const defaultAgency = agencyNames.size > 0 ? [...agencyNames][0] : undefined;

  return hits
    .sort((a, b) => {
      const rank: Record<ContactConfidence, number> = { high: 3, medium: 2, low: 1 };
      return rank[b.confidence] - rank[a.confidence];
    })
    .map((hit) => ({
      id: uniqueId(),
      contactType: hit.contactType,
      email: hit.email,
      agencyName:
        hit.contactType === "booking" || hit.contactType === "management"
          ? hit.agencyName ?? defaultAgency
          : undefined,
      sourceDomain: hit.sourceDomain,
      sourceUrl: hit.sourceUrl,
      confidence: hit.confidence,
      warnings: hit.warnings,
    }));
}

function pickBestEmail(
  candidates: ArtistContactCandidate[],
  type: ContactType,
): string | undefined {
  const match = candidates.find((c) => c.contactType === type && c.email && c.confidence !== "low");
  return match?.email;
}

/** Discover booking/contact details from public official sources. */
export async function discoverArtistContacts(input: {
  artistName: string;
  website?: string;
  instagram?: string;
  soundcloud?: string;
  spotify?: string;
}): Promise<ArtistContactDiscovery> {
  const warnings: string[] = [];
  const sources: string[] = [];
  const hits: RawEmailHit[] = [];
  const agencyNames = new Set<string>();

  const mb = await fetchArtistExternalLinks(input.artistName);
  if (mb) sources.push("MusicBrainz");

  const spotifyMatch = await fetchSpotifyArtistPortrait(input.artistName, input.spotify);
  const spotifyUrl = input.spotify ?? spotifyMatch?.externalUrl ?? mb?.spotify;

  const website = input.website ?? mb?.website;
  const instagram = input.instagram ?? mb?.instagram;
  const soundcloud = input.soundcloud ?? mb?.soundcloud;
  const bandcamp = mb?.bandcamp;
  const residentAdvisor = mb?.residentAdvisor;
  const linktree = mb?.linktree;

  const seedUrls = [
    website,
    linktree,
    instagram,
    soundcloud,
    bandcamp,
    residentAdvisor,
    spotifyUrl,
  ].filter((u): u is string => Boolean(u));

  const artistDomains = artistDomainsFrom(seedUrls);
  let contactPage: string | undefined;

  const scanOrder = [
    website,
    linktree,
    mb?.website,
  ].filter((u): u is string => Boolean(u));

  for (const url of [...new Set(scanOrder)]) {
    const page = await scanUrlPaths(url, artistDomains, hits, agencyNames, warnings);
    if (page) {
      contactPage = contactPage ?? page;
      sources.push(domainFromUrl(url));
    }
  }

  if (instagram) {
    const igHtml = await fetchPageHtml(instagram);
    if (igHtml) {
      const scan = scanHtmlPage(igHtml, instagram, artistDomains);
      sources.push("Instagram");
      for (const email of scan.emails) {
        hits.push({
          email,
          contactType: classifyEmail(email),
          sourceUrl: instagram,
          sourceDomain: scan.domain,
          confidence: scoreEmailConfidence(email, {
            sourceDomain: scan.domain,
            artistDomains,
            isOfficialArtistSite: false,
            isAgencySite: false,
            isFestivalLineup: false,
          }),
          warnings: ["Email found on Instagram — verify it is official"],
        });
      }
      for (const link of scan.contactUrls) {
        if (!LINK_HUB_RE.test(link) && !seedUrls.includes(link)) {
          const html = await fetchPageHtml(link);
          if (!html) continue;
          const child = scanHtmlPage(html, link, artistDomains);
          for (const email of child.emails) {
            hits.push({
              email,
              contactType: classifyEmail(email),
              sourceUrl: link,
              sourceDomain: child.domain,
              confidence: scoreEmailConfidence(email, {
                sourceDomain: child.domain,
                artistDomains,
                isOfficialArtistSite: child.isOfficialArtistSite,
                isAgencySite: child.isAgencySite,
                isFestivalLineup: child.isFestivalLineup,
              }),
              warnings: [],
            });
          }
        }
      }
    }
  }

  if (residentAdvisor && hits.length < 2) {
    const raHtml = await fetchPageHtml(residentAdvisor);
    if (raHtml) {
      const scan = scanHtmlPage(raHtml, residentAdvisor, artistDomains);
      sources.push("Resident Advisor");
      for (const email of scan.emails) {
        hits.push({
          email,
          contactType: classifyEmail(email),
          sourceUrl: residentAdvisor,
          sourceDomain: scan.domain,
          confidence: "low",
          warnings: ["Resident Advisor — verify contact is current"],
        });
      }
    }
  }

  const deduped = dedupeHits(hits);
  const candidates = hitsToCandidates(deduped, agencyNames);

  const bookingEmail = pickBestEmail(candidates, "booking");
  const managementEmail = pickBestEmail(candidates, "management");
  const pressEmail = pickBestEmail(candidates, "press");
  const agencyName = agencyNames.size > 0 ? [...agencyNames][0] : undefined;

  const highCount = candidates.filter((c) => c.confidence === "high").length;
  const medCount = candidates.filter((c) => c.confidence === "medium").length;

  let confidence: ContactConfidence = "low";
  if (highCount > 0) confidence = "high";
  else if (medCount > 0) confidence = "medium";

  if (candidates.length === 0) {
    warnings.push("No verified booking contact found — add manually.");
  }

  return {
    bookingEmail,
    managementEmail,
    pressEmail,
    agencyName,
    website: website ?? mb?.website,
    instagram,
    soundcloud,
    bandcamp,
    residentAdvisor,
    contactPage,
    confidence,
    sources: [...new Set(sources)],
    warnings,
    candidates,
  };
}
