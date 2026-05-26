import type { ContactConfidence, ContactType } from "@/lib/ai/artist-contact-types";

const FETCH_UA = "PromoSync/1.0 (promoter-app; contact@promosync.app)";
const MAX_HTML_BYTES = 350_000;

const EMAIL_RE = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
const MAILTO_RE = /mailto:([^?"'\s>]+)/gi;

const REJECT_EMAIL_LOCAL = /^(noreply|no-reply|donotreply|postmaster|webmaster|privacy|abuse|security|newsletter|subscribe|unsubscribe|sales|careers|jobs|hr|billing|accounts|accounting|finance|legal|dmca|copyright|trademark|feedback|customerservice|customer\.service|hello@shop|shop@|store@|merch@|ticketmaster|eventbrite|mailchimp|sendgrid|amazon|google|facebook|meta|twitter|x\.com)/i;

const GENERIC_DOMAINS =
  /^(gmail|yahoo|hotmail|outlook|icloud|protonmail|live|msn|aol)\./i;

const BOOKING_LOCAL = /book|booking|agent|agency|talent|enquir|inquir|request/i;
const MGMT_LOCAL = /mgmt|management|manage|manager/i;
const PRESS_LOCAL = /press|media|publicity|pr@|promo/i;

const AGENCY_RE =
  /(?:represented by|booking(?:s)?(?:\s+through)?|booked (?:by|through)|managed by|management[:\s]+)\s*([A-Z][A-Za-z0-9\s&'.-]{2,60}(?:Agency|Artists|Management|MGMT|Entertainment|Bookings?))/gi;

export type PageScanResult = {
  url: string;
  domain: string;
  emails: string[];
  agencyNames: string[];
  contactUrls: string[];
  isOfficialArtistSite: boolean;
  isAgencySite: boolean;
  isFestivalLineup: boolean;
};

export function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function normalizeEmail(raw: string): string | undefined {
  const email = raw.replace(/^mailto:/i, "").trim().toLowerCase();
  if (!email.includes("@")) return undefined;
  if (REJECT_EMAIL_LOCAL.test(email.split("@")[0] ?? "")) return undefined;
  if (/example\.(com|org|net)/i.test(email)) return undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return undefined;
  return email;
}

export function classifyEmail(email: string): ContactType {
  const local = email.split("@")[0] ?? "";
  if (BOOKING_LOCAL.test(local)) return "booking";
  if (MGMT_LOCAL.test(local)) return "management";
  if (PRESS_LOCAL.test(local)) return "press";
  return "general";
}

export function scoreEmailConfidence(
  email: string,
  context: {
    sourceDomain: string;
    artistDomains: string[];
    isOfficialArtistSite: boolean;
    isAgencySite: boolean;
    isFestivalLineup: boolean;
  },
): ContactConfidence {
  const [, domain] = email.split("@");
  if (!domain) return "low";
  if (context.isFestivalLineup) return "low";
  if (GENERIC_DOMAINS.test(domain) && !context.isOfficialArtistSite) return "low";

  const onArtistDomain = context.artistDomains.some(
    (d) => domain === d || domain.endsWith(`.${d}`),
  );

  if (context.isOfficialArtistSite && onArtistDomain) return "high";
  if (context.isAgencySite && (BOOKING_LOCAL.test(email) || MGMT_LOCAL.test(email))) return "high";
  if (onArtistDomain) return "medium";
  if (context.isAgencySite) return "medium";
  if (GENERIC_DOMAINS.test(domain)) return "low";
  return "medium";
}

export async function fetchPageHtml(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch(url, {
      headers: { "User-Agent": FETCH_UA, Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("text/html") && !type.includes("text/plain")) return null;

    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_HTML_BYTES) return null;
    return new TextDecoder("utf-8", { fatal: false }).decode(buf);
  } catch {
    return null;
  }
}

export function extractEmailsFromHtml(html: string): string[] {
  const found = new Set<string>();
  for (const match of html.matchAll(EMAIL_RE)) {
    const normalized = normalizeEmail(match[0]);
    if (normalized) found.add(normalized);
  }
  for (const match of html.matchAll(MAILTO_RE)) {
    const normalized = normalizeEmail(match[1]);
    if (normalized) found.add(normalized);
  }
  return [...found];
}

export function extractAgencyNames(html: string): string[] {
  const names = new Set<string>();
  for (const match of html.matchAll(AGENCY_RE)) {
    const name = match[1]?.trim();
    if (name && name.length >= 4 && name.length <= 80) names.add(name);
  }
  return [...names];
}

export function extractOutboundLinks(html: string, baseUrl: string): string[] {
  const links = new Set<string>();
  const hrefRe = /href=["']([^"']+)["']/gi;
  for (const match of html.matchAll(hrefRe)) {
    const href = match[1]?.trim();
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) continue;
    try {
      const absolute = new URL(href, baseUrl).toString();
      if (/^https?:\/\//i.test(absolute)) links.add(absolute);
    } catch {
      /* skip */
    }
  }
  return [...links];
}

export function scanHtmlPage(
  html: string,
  pageUrl: string,
  artistDomains: string[],
): PageScanResult {
  const domain = domainFromUrl(pageUrl);
  const path = (() => {
    try {
      return new URL(pageUrl).pathname.toLowerCase();
    } catch {
      return "";
    }
  })();

  const isOfficialArtistSite = artistDomains.some(
    (d) => domain === d || domain.endsWith(`.${d}`),
  );
  const isAgencySite = /agency|artists|booking|management|talent|roster/i.test(domain);
  const isFestivalLineup =
    /festival|lineup|tickets|eventbrite|ticketmaster|axs\.com|dice\.fm/i.test(domain) ||
    /\/lineup|\/festival|\/events?\//i.test(path);

  return {
    url: pageUrl,
    domain,
    emails: extractEmailsFromHtml(html),
    agencyNames: extractAgencyNames(html),
    contactUrls: extractOutboundLinks(html, pageUrl).filter((u) =>
      /instagram|soundcloud|bandcamp|ra\.co|spotify|linktr\.ee|beacons/i.test(u),
    ),
    isOfficialArtistSite,
    isAgencySite,
    isFestivalLineup,
  };
}

export const CONTACT_PATHS = [
  "/contact",
  "/booking",
  "/management",
  "/press",
  "/epk",
  "/about",
];
