import type { SupabaseSession } from "@/lib/types/artist";

import { getSupabaseConfig } from "./browser";

export type VenueSummary = {
  id: string;
  name: string;
  imageUrl?: string;
};

type VenueRow = {
  id: string;
  name: string;
  image_url: string | null;
};

export async function listVenueSummaries(
  session: SupabaseSession,
  workspaceId: string,
): Promise<VenueSummary[]> {
  const config = getSupabaseConfig();
  if (!config) return [];

  try {
    const response = await fetch(
      `${config.url}/rest/v1/venues?select=id,name,image_url&workspace_id=eq.${workspaceId}&order=created_at.desc`,
      {
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) return [];

    const rows = (await response.json()) as VenueRow[];
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      imageUrl: row.image_url ?? undefined,
    }));
  } catch {
    return [];
  }
}

export function buildVenueImageLookup(venues: VenueSummary[]) {
  const byId = new Map<string, string>();
  const byName = new Map<string, string>();

  for (const venue of venues) {
    if (!venue.imageUrl) continue;
    byId.set(venue.id, venue.imageUrl);
    byName.set(venue.name.trim().toLowerCase(), venue.imageUrl);
    const short = venue.name.split(",")[0]?.trim().toLowerCase();
    if (short) byName.set(short, venue.imageUrl);
  }

  return { byId, byName };
}

export function resolveVenueImage(
  event: { venueId?: string; venueName: string },
  lookup: ReturnType<typeof buildVenueImageLookup>,
): string | undefined {
  if (event.venueId && lookup.byId.has(event.venueId)) {
    return lookup.byId.get(event.venueId);
  }
  const short = event.venueName.split(",")[0]?.trim().toLowerCase() ?? "";
  return lookup.byName.get(short) ?? lookup.byName.get(event.venueName.trim().toLowerCase());
}
