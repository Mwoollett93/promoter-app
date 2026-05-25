import { z } from "zod";

import { trimToMaxWords } from "@/lib/ai/artist-text";

export const artistConfidenceSchema = z.enum(["low", "medium", "high"]);

export const artistMatchSchema = z.object({
  artistName: z.string().min(1),
  description: z.string(),
  genres: z.array(z.string()),
  location: z.string().optional(),
  imageUrl: z.string().optional(),
  website: z.string().optional(),
  instagram: z.string().optional(),
  soundcloud: z.string().optional(),
  spotify: z.string().optional(),
  bookingEmail: z.string().optional(),
  confidence: artistConfidenceSchema,
  sources: z.array(z.string()).optional(),
});

export const artistFillResponseSchema = z.object({
  matches: z.array(artistMatchSchema).max(3),
});

export type ArtistConfidence = z.infer<typeof artistConfidenceSchema>;
export type ArtistMatch = z.infer<typeof artistMatchSchema>;
export type ArtistFillResponse = z.infer<typeof artistFillResponseSchema>;

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Normalise and validate raw OpenAI JSON before returning to the client. */
export function parseArtistFillResponse(raw: unknown): ArtistFillResponse {
  const parsed = artistFillResponseSchema.parse(raw);
  return {
    matches: parsed.matches.map((match) => ({
      ...match,
      artistName: match.artistName.trim(),
      description: trimToMaxWords(match.description),
      genres: match.genres.map((g) => g.trim()).filter(Boolean),
      location: emptyToUndefined(match.location),
      imageUrl: emptyToUndefined(match.imageUrl),
      website: emptyToUndefined(match.website),
      instagram: emptyToUndefined(match.instagram),
      soundcloud: emptyToUndefined(match.soundcloud),
      spotify: emptyToUndefined(match.spotify),
      bookingEmail: emptyToUndefined(match.bookingEmail),
      sources: match.sources?.map((s) => s.trim()).filter(Boolean),
    })),
  };
}
