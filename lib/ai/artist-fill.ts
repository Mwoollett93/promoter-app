import { z } from "zod";

import { enrichArtistMatches } from "@/lib/ai/artist-agency-enrich";
import { parseArtistFillResponse, type ArtistFillResponse } from "@/lib/ai/artistSchema";

const MATCH_SCHEMA = `{
  "matches": [
    {
      "artistName": string,
      "description": string,
      "genres": string[],
      "location": string | null,
      "imageUrl": string | null,
      "website": string | null,
      "instagram": string | null,
      "soundcloud": string | null,
      "spotify": string | null,
      "bookingEmail": string | null,
      "classification": "Emerging" | "Established" | "Headliner" | "Legacy" | null,
      "agencyName": string | null,
      "managementCompany": string | null,
      "contactName": string | null,
      "contactRole": string | null,
      "contactPhone": string | null,
      "confidence": "low" | "medium" | "high",
      "sources": string[] | null
    }
  ]
}`;

function parseAiJsonContent(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(raw) as unknown;
}

export async function fetchArtistMatches(artistName: string): Promise<ArtistFillResponse> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the server.");
  }

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
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You help event promoters research DJ/artist profiles for a CRM.",
            "Given an artist name, return 1 to 3 possible real-world artist matches (different artists with similar names only if genuinely ambiguous).",
            "Return valid JSON only matching the schema.",
            "Bio/description must stay under 500 words. Use null or omit fields you are not reasonably confident about.",
            "Do not invent booking emails, agency names, or phone numbers — contact details are resolved server-side from official pages.",
            "Never use example.com or placeholder image URLs — leave imageUrl null (photos are resolved server-side).",
            "classification: Emerging, Established, Headliner, or Legacy based on career profile.",
            "Leave agencyName, bookingEmail, contactName, and contactPhone null.",
            "instagram: full profile URL when the handle is well known (often shows agency in bio).",
            "Genres should be standard electronic music genres when applicable (House, Techno, Drum & Bass, etc.).",
            "location: city and country when known, e.g. Melbourne, Australia.",
            "spotify: open.spotify.com/artist/... URL when it exists (press photos are resolved server-side from Spotify/MusicBrainz/Wikimedia).",
            "URLs must be full https links when provided.",
            "confidence: high = well-known artist with strong public info; medium = plausible match; low = uncertain.",
            "sources: short list of public profile types used (e.g. Spotify, Instagram, press).",
            "If no confident match exists, return a single match with confidence low and minimal empty fields.",
          ].join(" "),
        },
        {
          role: "user",
          content: `Schema:\n${MATCH_SCHEMA}\n\nArtist name to research:\n${artistName.trim()}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let message = errText || `AI lookup failed (${response.status}).`;
    try {
      const errJson = JSON.parse(errText) as { error?: { message?: string; code?: string } };
      if (errJson.error?.message) message = errJson.error.message;
      const lower = message.toLowerCase();
      if (
        errJson.error?.code === "insufficient_quota" ||
        lower.includes("quota") ||
        lower.includes("billing")
      ) {
        throw new Error(
          "OpenAI billing has no available credits. Add credits at platform.openai.com → Billing.",
        );
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("OpenAI billing")) throw err;
    }
    throw new Error(message);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned an empty response.");

  try {
    const raw = parseAiJsonContent(content);
    const parsed = parseArtistFillResponse(raw, artistName.trim());
    const matches = await enrichArtistMatches(parsed.matches);
    return { matches };
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new Error(
        "AI returned an unexpected format. Try again with a more specific artist name.",
      );
    }
    if (err instanceof SyntaxError) {
      throw new Error("AI returned malformed JSON. Try again.");
    }
    throw err instanceof Error ? err : new Error("Artist lookup failed.");
  }
}
