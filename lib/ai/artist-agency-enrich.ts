import { z } from "zod";

import type { ArtistMatch } from "@/lib/ai/artistSchema";

const bookingSchema = z.object({
  agencyName: z.string().nullable().optional(),
  managementCompany: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactRole: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  bookingEmail: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  sources: z.array(z.string()).nullable().optional(),
});

type BookingIntel = z.infer<typeof bookingSchema>;

function parseAiJson(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse(fenced ? fenced[1].trim() : trimmed) as unknown;
}

function str(value: string | null | undefined): string | undefined {
  const t = value?.trim();
  return t || undefined;
}

async function fetchArtistBookingIntel(artistName: string): Promise<BookingIntel | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const rawModel = process.env.AI_EXTRACTION_MODEL?.trim() ?? "";
  const model = rawModel.replace(/^optional:\s*/i, "").trim() || "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.15,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You research booking representation for electronic music artists and DJs for event promoters.",
            "Return JSON only. Use well-documented public knowledge only.",
            "Look for: official booking agency rosters, press releases, artist Instagram bio patterns (Bookings:, MGMT:, represented by, @agencyhandle).",
            "Examples: many UK bass artists use Coda Agency, Parade Artists, ICM, Foundations, MN2S, United Talent, etc.",
            "For the artist named, answer as if you searched '{artist name} booking agency' and checked their Instagram bio line.",
            "agencyName = primary booking agency. managementCompany = management if different.",
            "contactName = agent/manager name only if publicly known. contactRole = Agent or Manager.",
            "bookingEmail only if a known public bookings@ address exists — do not guess emails.",
            "instagram: full https://instagram.com/... URL if the handle is well known.",
            "sources: e.g. Instagram bio, agency website, Resident Advisor, press.",
            "Use null for unknown fields. Do not invent.",
          ].join(" "),
        },
        {
          role: "user",
          content: `Artist: ${artistName}\n\nSchema:\n{\n  "agencyName": string | null,\n  "managementCompany": string | null,\n  "contactName": string | null,\n  "contactRole": string | null,\n  "contactPhone": string | null,\n  "bookingEmail": string | null,\n  "instagram": string | null,\n  "sources": string[] | null\n}`,
        },
      ],
    }),
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    return bookingSchema.parse(parseAiJson(content));
  } catch {
    return null;
  }
}

function mergeBookingIntoMatch(match: ArtistMatch, booking: BookingIntel | null): ArtistMatch {
  if (!booking) return match;

  const mergedSources = [
    ...(match.sources ?? []),
    ...(booking.sources?.map((s) => `Booking: ${s}`) ?? []),
  ].filter(Boolean);

  return {
    ...match,
    agencyName: match.agencyName ?? str(booking.agencyName),
    managementCompany: match.managementCompany ?? str(booking.managementCompany),
    contactName: match.contactName ?? str(booking.contactName),
    contactRole: match.contactRole ?? str(booking.contactRole),
    contactPhone: match.contactPhone ?? str(booking.contactPhone),
    bookingEmail: match.bookingEmail ?? str(booking.bookingEmail),
    instagram: match.instagram ?? str(booking.instagram),
    sources: mergedSources.length > 0 ? [...new Set(mergedSources)] : match.sources,
  };
}

/** Second-pass enrichment for booking agency + Instagram from public knowledge. */
export async function enrichArtistMatchAgency(matches: ArtistMatch[]): Promise<ArtistMatch[]> {
  return Promise.all(
    matches.map(async (match) => {
      const booking = await fetchArtistBookingIntel(match.artistName);
      return mergeBookingIntoMatch(match, booking);
    }),
  );
}

export async function enrichArtistMatches(matches: ArtistMatch[]): Promise<ArtistMatch[]> {
  const { enrichArtistMatchImages } = await import("@/lib/ai/artist-image");
  const withImages = await enrichArtistMatchImages(matches);
  return enrichArtistMatchAgency(withImages);
}
