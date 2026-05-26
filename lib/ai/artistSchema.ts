import { z } from "zod";

import { normalizeArtistClassification } from "@/lib/ai/artist-classification";
import type { ArtistContactDiscovery } from "@/lib/ai/artist-contact-types";
import type { ArtistImageConfidence, ArtistImageSource } from "@/lib/ai/artist-portrait-types";
import { trimToMaxWords } from "@/lib/ai/artist-text";

export const artistConfidenceSchema = z.enum(["low", "medium", "high"]);
export const artistImageSourceSchema = z.enum([
  "spotify_artist",
  "wikimedia",
  "official_site",
  "instagram",
  "deezer_artist",
  "bandcamp_artist",
  "manual_required",
]);
export const artistImageConfidenceSchema = z.enum(["low", "medium", "high"]);

export const artistMatchSchema = z.object({
  artistName: z.string().min(1),
  description: z.string(),
  genres: z.array(z.string()),
  location: z.string().optional(),
  imageUrl: z.string().optional(),
  imageSource: artistImageSourceSchema.optional(),
  imageConfidence: artistImageConfidenceSchema.optional(),
  imageWarnings: z.array(z.string()).optional(),
  imageAttribution: z.string().optional(),
  website: z.string().optional(),
  instagram: z.string().optional(),
  soundcloud: z.string().optional(),
  spotify: z.string().optional(),
  bookingEmail: z.string().optional(),
  classification: z.enum(["Emerging", "Established", "Headliner", "Legacy"]).optional(),
  agencyName: z.string().optional(),
  managementCompany: z.string().optional(),
  contactName: z.string().optional(),
  contactRole: z.string().optional(),
  contactPhone: z.string().optional(),
  contactDiscovery: z.any().optional() as z.ZodType<ArtistContactDiscovery | undefined>,
  confidence: artistConfidenceSchema,
  sources: z.array(z.string()).optional(),
});

export const artistFillResponseSchema = z.object({
  matches: z.array(artistMatchSchema).min(1).max(3),
});

export type ArtistConfidence = z.infer<typeof artistConfidenceSchema>;
export type { ArtistImageConfidence, ArtistImageSource };
export type ArtistMatch = z.infer<typeof artistMatchSchema>;
export type ArtistFillResponse = z.infer<typeof artistFillResponseSchema>;

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function coerceString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function coerceOptionalString(value: unknown): string | undefined {
  const s = coerceString(value).trim();
  return s || undefined;
}

function coerceGenres(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === "string") return [item];
        return [];
      })
      .map((g) => g.trim())
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[,|/]/)
      .map((g) => g.trim())
      .filter(Boolean);
  }
  return [];
}

function coerceStringArray(value: unknown): string[] | undefined {
  if (value === null || value === undefined) return undefined;
  const items = coerceGenres(value);
  return items.length > 0 ? items : undefined;
}

function coerceConfidence(value: unknown): ArtistConfidence {
  const raw = coerceString(value).toLowerCase();
  if (raw.includes("high")) return "high";
  if (raw.includes("med")) return "medium";
  if (raw.includes("low")) return "low";
  return "medium";
}

function coerceMatchEntry(raw: unknown, fallbackName: string): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as Record<string, unknown>;
  const artistName = coerceString(entry.artistName ?? entry.name ?? fallbackName).trim();
  if (!artistName) return null;

  return {
    artistName,
    description: coerceString(entry.description ?? entry.bio ?? entry.biography),
    genres: coerceGenres(entry.genres ?? entry.genre),
    location: coerceOptionalString(entry.location ?? entry.city),
    imageUrl: coerceOptionalString(entry.imageUrl ?? entry.image ?? entry.photoUrl),
    website: coerceOptionalString(entry.website ?? entry.url),
    instagram: coerceOptionalString(entry.instagram),
    soundcloud: coerceOptionalString(entry.soundcloud),
    spotify: coerceOptionalString(entry.spotify),
    bookingEmail: coerceOptionalString(entry.bookingEmail ?? entry.booking_email),
    classification: normalizeArtistClassification(entry.classification) ?? undefined,
    agencyName: coerceOptionalString(entry.agencyName ?? entry.agency ?? entry.agency_name),
    managementCompany: coerceOptionalString(
      entry.managementCompany ?? entry.management ?? entry.management_company,
    ),
    contactName: coerceOptionalString(
      entry.contactName ?? entry.agentName ?? entry.bookingContact ?? entry.agent_name,
    ),
    contactRole: coerceOptionalString(entry.contactRole ?? entry.agentRole ?? entry.agent_role),
    contactPhone: coerceOptionalString(entry.contactPhone ?? entry.phone ?? entry.agentPhone),
    confidence: coerceConfidence(entry.confidence),
    sources: coerceStringArray(entry.sources),
  };
}

/** Normalise messy OpenAI JSON into the shape Zod expects. */
export function coerceArtistFillRaw(raw: unknown, queryName: string): unknown {
  if (!raw || typeof raw !== "object") {
    return { matches: [] };
  }

  const root = raw as Record<string, unknown>;
  let entries: unknown[] = [];

  if (Array.isArray(root.matches)) {
    entries = root.matches;
  } else if (Array.isArray(root.results)) {
    entries = root.results;
  } else if (Array.isArray(root.artists)) {
    entries = root.artists;
  } else if (Array.isArray(raw)) {
    entries = raw;
  } else if (root.artistName || root.name) {
    entries = [root];
  }

  const matches = entries
    .map((entry) => coerceMatchEntry(entry, queryName))
    .filter((entry): entry is Record<string, unknown> => entry !== null);

  return { matches };
}

/** Normalise and validate raw OpenAI JSON before returning to the client. */
export function parseArtistFillResponse(raw: unknown, queryName = ""): ArtistFillResponse {
  const coerced = coerceArtistFillRaw(raw, queryName) as { matches: unknown[] };
  if (coerced.matches.length === 0) {
    throw new Error("No artist match found for that name.");
  }
  const parsed = artistFillResponseSchema.parse(coerced);

  return {
    matches: parsed.matches.map((match) => ({
      ...match,
      artistName: match.artistName.trim(),
      description: trimToMaxWords(match.description),
      genres: match.genres.map((g) => g.trim()).filter(Boolean),
      location: emptyToUndefined(match.location),
      // Never trust OpenAI image URLs — portrait enrichment fills imageUrl.
      imageUrl: undefined,
      website: emptyToUndefined(match.website),
      instagram: emptyToUndefined(match.instagram),
      soundcloud: emptyToUndefined(match.soundcloud),
      spotify: emptyToUndefined(match.spotify),
      bookingEmail: undefined,
      classification: match.classification,
      agencyName: undefined,
      managementCompany: undefined,
      contactName: undefined,
      contactRole: undefined,
      contactPhone: undefined,
      sources: match.sources?.map((s) => s.trim()).filter(Boolean),
    })),
  };
}
