import { facilityOptionsForPrompt } from "@/lib/venues/facility-options";

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
  /** Dollar amounts from the document (e.g. 2500 for $2,500). */
  hireFee?: number | null;
  depositAmount?: number | null;
  minimumSpend?: number | null;
  barSplitPercent?: number | null;
  depositRequired?: boolean | null;
  paymentTerms?: string | null;
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

const FACILITY_LIST = facilityOptionsForPrompt();

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
  "loadOutDetails": string | null,
  "hireFee": number | null,
  "depositAmount": number | null,
  "minimumSpend": number | null,
  "barSplitPercent": number | null,
  "depositRequired": boolean | null,
  "paymentTerms": string | null
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
  const model = rawModel.replace(/^optional:\s*/i, "").trim() || "gpt-4o-mini";

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
            "Split addresses into addressLine1, city, stateRegion, postalCode, country (default Australia if Melbourne/VIC).",
            `For facilities, return ONLY exact labels from this list (select every item that applies): ${FACILITY_LIST}.`,
            "Do NOT put checklist facilities in description — use the facilities array only.",
            "Use otherFacilities only for amenities not in the checklist (max 200 chars).",
            "description: brief venue summary only (1-2 sentences), not a list of gear.",
            "operationsNotes: commercial terms, staffing, bonds, revenue split notes, license details.",
            "Money fields are in dollars as numbers without symbols: hireFee 2500 for $2,500, depositAmount 1000 for bond, minimumSpend 8000 for bar minimum.",
            "depositRequired true if security bond or deposit is mentioned.",
            "barSplitPercent: venue/promoter bar share 0-100 if stated (promoter retains 100% => 0 for venue).",
            "venueManagerName/Phone and bookingContactName/Email from primary contact lines.",
            "loadInDetails: bump in / load in access times.",
            "Set securityRequired if security bond or guards mentioned.",
            "Set equipmentProvided true if in-house PA/DJ/production is listed.",
            "Set lateLicense true if hours extend past midnight.",
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
      const errJson = JSON.parse(errText) as { error?: { message?: string; code?: string } };
      if (errJson.error?.message) message = errJson.error.message;
      const lower = message.toLowerCase();
      if (
        errJson.error?.code === "insufficient_quota" ||
        lower.includes("quota") ||
        lower.includes("billing")
      ) {
        throw new Error(
          "OpenAI billing has no available credits. In platform.openai.com go to Billing → add a payment method or prepaid credits, then retry. Usage stays at $0 until a request succeeds.",
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
    return parseAiJsonContent(content);
  } catch {
    throw new Error("AI returned invalid JSON. Try again or use a simpler document.");
  }
}
