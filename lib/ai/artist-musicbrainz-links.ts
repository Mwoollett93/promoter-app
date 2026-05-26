import { waitForMusicBrainzSlot } from "@/lib/ai/musicbrainz-rate";

const MUSICBRAINZ_UA = "PromoSync/1.0 (promoter-app; contact@promosync.app)";

export type ArtistExternalLinks = {
  name: string;
  website?: string;
  wikidataId?: string;
  instagram?: string;
  soundcloud?: string;
  bandcamp?: string;
  residentAdvisor?: string;
  spotify?: string;
  youtube?: string;
  linktree?: string;
  otherUrls: string[];
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store", ...init });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function pickUrl(
  links: ArtistExternalLinks,
  key: keyof ArtistExternalLinks,
  value: string,
): void {
  if (links[key]) return;
  (links as Record<string, unknown>)[key] = value;
}

function classifyUrl(resource: string, links: ArtistExternalLinks): void {
  const lower = resource.toLowerCase();
  if (lower.includes("instagram.com")) pickUrl(links, "instagram", resource);
  else if (lower.includes("soundcloud.com")) pickUrl(links, "soundcloud", resource);
  else if (lower.includes("bandcamp.com")) pickUrl(links, "bandcamp", resource);
  else if (lower.includes("ra.co") || lower.includes("residentadvisor")) pickUrl(links, "residentAdvisor", resource);
  else if (lower.includes("open.spotify.com/artist")) pickUrl(links, "spotify", resource);
  else if (lower.includes("youtube.com") || lower.includes("youtu.be")) pickUrl(links, "youtube", resource);
  else if (lower.includes("linktr.ee") || lower.includes("beacons.ai")) pickUrl(links, "linktree", resource);
  else links.otherUrls.push(resource);
}

/** MusicBrainz + Wikidata external links for contact discovery. */
export async function fetchArtistExternalLinks(artistName: string): Promise<ArtistExternalLinks | null> {
  await waitForMusicBrainzSlot();
  const search = await fetchJson<{
    artists?: Array<{ id: string; name: string }>;
  }>(
    `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(`artist:"${artistName}"`)}&fmt=json&limit=3`,
    { headers: { Accept: "application/json", "User-Agent": MUSICBRAINZ_UA } },
  );

  const top = search?.artists?.[0];
  if (!top?.id) return null;

  await waitForMusicBrainzSlot();
  const detail = await fetchJson<{
    name: string;
    relations?: Array<{ type?: string; url?: { resource?: string } }>;
  }>(`https://musicbrainz.org/ws/2/artist/${top.id}?inc=url-rels&fmt=json`, {
    headers: { Accept: "application/json", "User-Agent": MUSICBRAINZ_UA },
  });

  const links: ArtistExternalLinks = {
    name: detail?.name ?? top.name,
    otherUrls: [],
  };

  for (const rel of detail?.relations ?? []) {
    const resource = rel.url?.resource?.trim();
    if (!resource) continue;

    if (rel.type === "wikidata" && resource.includes("wikidata.org/wiki/Q")) {
      const qid = resource.match(/Q\d+/)?.[0];
      if (qid) {
        links.wikidataId = qid;
        await mergeWikidataLinks(qid, links);
      }
      continue;
    }

    if (rel.type === "official homepage" || rel.type === "official site") {
      links.website = links.website ?? resource;
      continue;
    }

    if (rel.type === "social network" || rel.type === "streaming music") {
      classifyUrl(resource, links);
    }
  }

  return links;
}

async function mergeWikidataLinks(qid: string, links: ArtistExternalLinks): Promise<void> {
  const entity = await fetchJson<{
    entities?: Record<
      string,
      {
        claims?: Record<
          string,
          Array<{ mainsnak?: { datavalue?: { value?: string | { id?: string } } } }>
        >;
      }
    >;
  }>(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`);

  const claims = entity?.entities?.[qid]?.claims;
  if (!claims) return;

  const website = claims.P856?.[0]?.mainsnak?.datavalue?.value;
  if (typeof website === "string") links.website = links.website ?? website;

  const instagram = claims.P2003?.[0]?.mainsnak?.datavalue?.value;
  if (typeof instagram === "string") {
    links.instagram =
      links.instagram ?? `https://instagram.com/${instagram.replace(/^@/, "")}`;
  }

  const soundcloud = claims.P3040?.[0]?.mainsnak?.datavalue?.value;
  if (typeof soundcloud === "string") {
    links.soundcloud = links.soundcloud ?? soundcloud;
  }

  const bandcamp = claims.P4577?.[0]?.mainsnak?.datavalue?.value;
  if (typeof bandcamp === "string") {
    links.bandcamp = links.bandcamp ?? bandcamp;
  }
}
