/** Canonical facility labels used in Add Venue UI and AI extraction. */
export const VENUE_FACILITY_OPTIONS = [
  "Main Room",
  "Second Room",
  "Outdoor Area",
  "VIP Area",
  "Bar",
  "Cloakroom",
  "Green Room",
  "Kitchen",
  "Toilets",
  "Loading Dock",
  "LED Wall",
  "Stage",
  "Sound System",
  "Lighting Rig",
  "Smoke Machine",
  "Projector",
  "DJ Booth",
  "Rigging Points",
  "Backline",
  "Merch Space",
  "Wi-Fi",
] as const;

export type VenueFacilityOption = (typeof VENUE_FACILITY_OPTIONS)[number];

/** Map document keywords to checklist labels (lowercase keys). */
const FACILITY_KEYWORD_MAP: Array<{ facility: VenueFacilityOption; keywords: string[] }> = [
  { facility: "Sound System", keywords: ["sound system", "main pa", " pa ", "subwoofer", "monitor system", "evo6", "f221"] },
  { facility: "DJ Booth", keywords: ["dj booth", "dj mixer", "cdj", "djm-", "pioneer dj"] },
  { facility: "Lighting Rig", keywords: ["lighting rig", "moving head", "led bar", "lighting"] },
  { facility: "Stage", keywords: ["stage dimension", "stage size", "6m x 4m", "stage "] },
  { facility: "Projector", keywords: ["projector", "visual support", "projection", "mapping"] },
  { facility: "LED Wall", keywords: ["led wall"] },
  { facility: "Green Room", keywords: ["green room", "dressing room"] },
  { facility: "Bar", keywords: ["bar ", "liquor license", "minimum bar"] },
  { facility: "Loading Dock", keywords: ["loading dock", "roller door", "load in", "bump in"] },
  { facility: "Kitchen", keywords: ["kitchen", "catering"] },
  { facility: "Outdoor Area", keywords: ["outdoor", "courtyard", "smoking area"] },
  { facility: "VIP Area", keywords: ["vip"] },
  { facility: "Main Room", keywords: ["main room"] },
  { facility: "Second Room", keywords: ["second room"] },
  { facility: "Smoke Machine", keywords: ["smoke machine", "haze", "fog machine"] },
  { facility: "Rigging Points", keywords: ["rigging"] },
  { facility: "Backline", keywords: ["backline", "back line"] },
  { facility: "Merch Space", keywords: ["merch"] },
  { facility: "Wi-Fi", keywords: ["wi-fi", "wifi", "wireless"] },
  { facility: "Cloakroom", keywords: ["cloakroom", "coat check"] },
  { facility: "Toilets", keywords: ["toilet", "restroom", "amenities"] },
];

function exactOptionMatch(value: string): VenueFacilityOption | null {
  const normalized = value.trim().toLowerCase();
  for (const option of VENUE_FACILITY_OPTIONS) {
    if (option.toLowerCase() === normalized) return option;
  }
  return null;
}

/** Normalize AI / free-text facility labels onto the venue checklist. */
export function normalizeExtractedFacilities(
  aiFacilities: string[] | null | undefined,
  documentText = "",
): VenueFacilityOption[] {
  const selected = new Set<VenueFacilityOption>();

  for (const item of aiFacilities ?? []) {
    if (typeof item !== "string" || !item.trim()) continue;
    const exact = exactOptionMatch(item);
    if (exact) {
      selected.add(exact);
      continue;
    }
    const lower = item.toLowerCase();
    for (const { facility, keywords } of FACILITY_KEYWORD_MAP) {
      if (keywords.some((kw) => lower.includes(kw))) {
        selected.add(facility);
      }
    }
  }

  const haystack = documentText.toLowerCase();
  for (const { facility, keywords } of FACILITY_KEYWORD_MAP) {
    if (keywords.some((kw) => haystack.includes(kw))) {
      selected.add(facility);
    }
  }

  return [...selected];
}

export function facilityOptionsForPrompt(): string {
  return VENUE_FACILITY_OPTIONS.join(", ");
}
