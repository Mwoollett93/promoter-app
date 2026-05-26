const PRESS_LINK_RE = /\b(press|media|photos?|bio|about|epk|contact|publicity|media kit)\b/i;
const RELEASE_LINK_RE = /\b(album|single|ep|lp|release|track|merch|vinyl|cassette|buy|store)\b/i;

export type PageContext = {
  url: string;
  title: string;
  text: string;
  isReleasePage: boolean;
  isPressPage: boolean;
};

export function extractPageContext(html: string, pageUrl: string): PageContext {
  const title = extractTitle(html);
  const text = stripHtmlText(html).slice(0, 8000);
  const pathname = (() => {
    try {
      return new URL(pageUrl).pathname.toLowerCase();
    } catch {
      return "";
    }
  })();

  const isReleasePage =
    RELEASE_LINK_RE.test(pathname) ||
    RELEASE_LINK_RE.test(title.toLowerCase()) ||
    /\/album\//i.test(pathname) ||
    /\/track\//i.test(pathname) ||
    /\/release\//i.test(pathname);

  const isPressPage =
    PRESS_LINK_RE.test(pathname) ||
    PRESS_LINK_RE.test(title.toLowerCase()) ||
    PRESS_LINK_RE.test(text.slice(0, 2000));

  return { url: pageUrl, title, text, isReleasePage, isPressPage };
}

export function extractTitle(html: string): string {
  const og = html.match(/property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1];
  if (og) return decodeHtml(og.trim());
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  return title ? decodeHtml(title.trim()) : "";
}

export function extractOgImage(html: string): string | undefined {
  const patterns = [
    /property=["']og:image(?::secure_url)?["']\s+content=["']([^"']+)["']/i,
    /content=["']([^"']+)["']\s+property=["']og:image(?::secure_url)?["']/i,
    /name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

export function extractPressLinks(html: string, baseUrl: string): string[] {
  const links = new Set<string>();
  const hrefRe = /href=["']([^"']+)["'][^>]*>([^<]{0,80})</gi;
  for (const match of html.matchAll(hrefRe)) {
    const href = match[1]?.trim();
    const label = match[2]?.trim() ?? "";
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) continue;
    if (!PRESS_LINK_RE.test(href) && !PRESS_LINK_RE.test(label)) continue;
    try {
      links.add(new URL(href, baseUrl).toString());
    } catch {
      /* skip */
    }
  }
  return [...links];
}

export function extractImgCandidates(
  html: string,
  baseUrl: string,
): Array<{ url: string; alt: string }> {
  const found: Array<{ url: string; alt: string }> = [];
  const imgRe = /<img[^>]+>/gi;
  for (const tag of html.matchAll(imgRe)) {
    const src = tag[0].match(/src=["']([^"']+)["']/i)?.[1];
    if (!src) continue;
    const alt = tag[0].match(/alt=["']([^"']*)["']/i)?.[1] ?? "";
    try {
      found.push({ url: new URL(src, baseUrl).toString(), alt: decodeHtml(alt) });
    } catch {
      /* skip */
    }
  }
  return found;
}

function stripHtmlText(html: string): string {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
