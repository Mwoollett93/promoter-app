export type VenueExtractionResult = {
  maxCapacity?: number;
  indoorCapacity?: number;
  outdoorCapacity?: number;
  curfewTime?: string;
  noiseRestriction?: string;
  addressLine1?: string;
  city?: string;
  country?: string;
  venueManagerName?: string;
  venueManagerPhone?: string;
  bookingContactEmail?: string;
  description?: string;
  facilities?: string[];
};

const EXTRACTION_SCHEMA = `{
  "maxCapacity": number | null,
  "indoorCapacity": number | null,
  "outdoorCapacity": number | null,
  "curfewTime": string | null,
  "noiseRestriction": string | null,
  "addressLine1": string | null,
  "city": string | null,
  "country": string | null,
  "venueManagerName": string | null,
  "venueManagerPhone": string | null,
  "bookingContactEmail": string | null,
  "description": string | null,
  "facilities": string[] | null
}`;

export async function extractVenueFieldsFromText(documentText: string): Promise<VenueExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the server.");
  }

  const model = process.env.AI_EXTRACTION_MODEL?.trim() || "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You extract structured venue operations data from event/venue documents for promoters. Return JSON only matching the schema. Use null for unknown fields.",
        },
        {
          role: "user",
          content: `Schema:\n${EXTRACTION_SCHEMA}\n\nDocument:\n${documentText.slice(0, 12000)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `AI extraction failed (${response.status}).`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned an empty response.");

  const parsed = JSON.parse(content) as VenueExtractionResult;
  return parsed;
}
