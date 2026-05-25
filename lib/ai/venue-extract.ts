export type VenueExtractionResult = {
  name?: string | null;
  venueType?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  stateRegion?: string | null;
  postalCode?: string | null;
  country?: string | null;
  description?: string | null;
  maxCapacity?: number | null;
  indoorCapacity?: number | null;
  outdoorCapacity?: number | null;
  curfewTime?: string | null;
  noiseRestriction?: string | null;
  ageRestriction?: string | null;
  wheelchairAccessible?: boolean | null;
  parkingAvailable?: boolean | null;
  facilities?: string[] | null;
  otherFacilities?: string | null;
  venueManagerName?: string | null;
  venueManagerPhone?: string | null;
  bookingContactName?: string | null;
  bookingContactEmail?: string | null;
  operationsNotes?: string | null;
  securityRequired?: boolean | null;
  equipmentProvided?: boolean | null;
  smokingAllowed?: boolean | null;
  lateLicense?: boolean | null;
  parkingDetails?: string | null;
  loadInDetails?: string | null;
  loadOutDetails?: string | null;
};

const VENUE_TYPE_HINTS = [
  "Nightclub",
  "Warehouse",
  "Live Music Venue",
  "Bar",
  "Rooftop",
  "Beach Club",
  "Outdoor Space",
  "Multi-Room Venue",
].join(", ");

const EXTRACTION_SCHEMA = `{
  "name": string | null,
  "venueType": string | null,
  "addressLine1": string | null,
  "city": string | null,
  "stateRegion": string | null,
  "postalCode": string | null,
  "country": string | null,
  "description": string | null,
  "maxCapacity": number | null,
  "indoorCapacity": number | null,
  "outdoorCapacity": number | null,
  "curfewTime": string | null,
  "noiseRestriction": string | null,
  "ageRestriction": string | null,
  "wheelchairAccessible": boolean | null,
  "parkingAvailable": boolean | null,
  "facilities": string[] | null,
  "otherFacilities": string | null,
  "venueManagerName": string | null,
  "venueManagerPhone": string | null,
  "bookingContactName": string | null,
  "bookingContactEmail": string | null,
  "operationsNotes": string | null,
  "securityRequired": boolean | null,
  "equipmentProvided": boolean | null,
  "smokingAllowed": boolean | null,
  "lateLicense": boolean | null,
  "parkingDetails": string | null,
  "loadInDetails": string | null,
  "loadOutDetails": string | null
}`;

function parseAiJsonContent(content: string): VenueExtractionResult {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(raw) as VenueExtractionResult;
}

export async function extractVenueFieldsFromText(documentText: string): Promise<VenueExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the server.");
  }

  const rawModel = process.env.AI_EXTRACTION_MODEL?.trim() ?? "";
  const model =
    rawModel.replace(/^optional:\s*/i, "").trim() || "gpt-4o-mini";

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
          content: [
            "You extract structured venue data from specification sheets for event promoters.",
            "Return JSON only matching the schema. Use null for unknown fields.",
            `For venueType, pick the closest match from: ${VENUE_TYPE_HINTS}.`,
            "Split addresses into addressLine1, city, stateRegion, postalCode, country (default country Australia if Melbourne/VIC).",
            "Put audio, stage, lighting, and production gear summaries in description.",
            "Put backstage, security, loading, smoking, and policy notes in operationsNotes.",
            "Map venue amenities (green room, catering, loading dock, courtyard, etc.) to facilities array using short labels.",
            "Set securityRequired true if security/guards are mentioned.",
            "Set equipmentProvided true if PA, DJ, or production equipment is listed.",
            "Set lateLicense true if hours extend past midnight or curfew is after midnight.",
            "Set smokingAllowed true if a smoking area is mentioned.",
          ].join(" "),
        },
        {
          role: "user",
          content: `Schema:\n${EXTRACTION_SCHEMA}\n\nDocument:\n${documentText.slice(0, 14000)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let message = errText || `AI extraction failed (${response.status}).`;
    try {
      const errJson = JSON.parse(errText) as { error?: { message?: string } };
      if (errJson.error?.message) message = errJson.error.message;
    } catch {
      /* keep raw */
    }
    throw new Error(message);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned an empty response.");

  try {
    return parseAiJsonContent(content);
  } catch {
    throw new Error("AI returned invalid JSON. Try again or use a simpler document.");
  }
}
