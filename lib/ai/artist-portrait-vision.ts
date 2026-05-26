import type { ArtistImageConfidence } from "@/lib/ai/artist-portrait-types";
import type { PortraitImageCandidate } from "@/lib/ai/artist-portrait-candidate-types";

export type PortraitVisionResult = {
  isLikelyArtistPhoto: boolean;
  reason: string;
  confidence: ArtistImageConfidence;
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export function isPortraitVisionEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function validatePortraitWithVision(
  imageUrl: string,
): Promise<PortraitVisionResult | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Is this likely an artist press/photo/portrait rather than album artwork, logo, flyer, or graphic design?
Reply with JSON only: {"isLikelyArtistPhoto":boolean,"reason":string,"confidence":"low"|"medium"|"high"}`,
              },
              { type: "image_url", image_url: { url: imageUrl, detail: "low" } },
            ],
          },
        ],
      }),
      cache: "no-store",
    });

    if (!response.ok) return null;
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as {
      isLikelyArtistPhoto?: boolean;
      reason?: string;
      confidence?: string;
    };

    const confidence =
      parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low"
        ? parsed.confidence
        : "low";

    return {
      isLikelyArtistPhoto: Boolean(parsed.isLikelyArtistPhoto),
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
      confidence,
    };
  } catch {
    return null;
  }
}

export async function applyVisionToTopCandidates(
  candidates: PortraitImageCandidate[],
  limit = 3,
): Promise<PortraitImageCandidate[]> {
  if (!isPortraitVisionEnabled()) return candidates;

  const updated = [...candidates];
  for (let i = 0; i < Math.min(limit, updated.length); i++) {
    const vision = await validatePortraitWithVision(updated[i].imageUrl);
    if (vision) {
      updated[i] = { ...updated[i], vision };
    }
  }
  return updated;
}
