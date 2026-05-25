import type { VenueExtractionResult } from "@/lib/ai/venue-extract";
import {
  normalizeExtractedFacilities,
  VENUE_FACILITY_OPTIONS,
  type VenueFacilityOption,
} from "@/lib/venues/facility-options";

export type VenueDraftLike = {
  name: string;
  venueType: string;
  addressLine1: string;
  city: string;
  stateRegion: string;
  postalCode: string;
  country: string;
  description: string;
  maxCapacity: number;
  indoorCapacity: number;
  outdoorCapacity: number;
  curfewTime: string;
  noiseRestriction: string;
  ageRestriction: string;
  wheelchairAccessible: boolean;
  parkingAvailable: boolean;
  facilities: string[];
  otherFacilities: string;
  venueManagerName: string;
  venueManagerPhone: string;
  bookingContactName: string;
  bookingContactEmail: string;
  operationsNotes: string;
  securityRequired: boolean;
  equipmentProvided: boolean;
  smokingAllowed: boolean;
  lateLicense: boolean;
  parkingDetails: string;
  loadInDetails: string;
  loadOutDetails: string;
  depositRequired: boolean;
  depositAmountCents: number;
  hireFeeCents: number;
  minimumSpendCents: number;
  barSplitPercent: number;
  paymentTerms: string;
};

const VENUE_TYPE_OPTIONS = [
  "Nightclub",
  "Warehouse",
  "Live Music Venue",
  "Bar",
  "Rooftop",
  "Beach Club",
  "Outdoor Space",
  "Multi-Room Venue",
];

function normalizeVenueType(value: string): string {
  const lower = value.toLowerCase();
  for (const option of VENUE_TYPE_OPTIONS) {
    if (lower === option.toLowerCase() || lower.includes(option.toLowerCase())) {
      return option;
    }
  }
  if (lower.includes("warehouse")) return "Warehouse";
  if (lower.includes("nightclub") || lower.includes("club")) return "Nightclub";
  return value.trim();
}

function str(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function num(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value.replace(/[^\d]/g, ""), 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return fallback;
}

function dollarsToCents(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value >= 10_000 ? Math.round(value) : Math.round(value * 100);
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    const parsed = Number.parseFloat(cleaned.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed >= 10_000 ? Math.round(parsed) : Math.round(parsed * 100);
    }
  }
  return null;
}

function percent(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100) {
    return Math.round(value);
  }
  return fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

function strList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return items.length > 0 ? items : fallback;
}

/** Merge AI extraction into a venue draft, preferring extracted values when present. */
export function applyVenueExtraction<T extends VenueDraftLike>(
  draft: T,
  fields: VenueExtractionResult,
  documentText = "",
): T {
  const facilities = normalizeExtractedFacilities(fields.facilities, documentText);

  const hireFeeCents = dollarsToCents(fields.hireFee) ?? draft.hireFeeCents;
  const depositAmountCents = dollarsToCents(fields.depositAmount) ?? draft.depositAmountCents;
  const minimumSpendCents = dollarsToCents(fields.minimumSpend) ?? draft.minimumSpendCents;
  const depositRequired =
    fields.depositRequired === true ||
    (depositAmountCents > 0 && fields.depositRequired !== false) ||
    draft.depositRequired;

  return {
    ...draft,
    name: str(fields.name, draft.name),
    venueType: fields.venueType
      ? normalizeVenueType(str(fields.venueType, draft.venueType))
      : draft.venueType,
    addressLine1: str(fields.addressLine1, draft.addressLine1),
    city: str(fields.city, draft.city),
    stateRegion: str(fields.stateRegion, draft.stateRegion),
    postalCode: str(fields.postalCode, draft.postalCode),
    country: str(fields.country, draft.country),
    description: str(fields.description, draft.description),
    maxCapacity: num(fields.maxCapacity, draft.maxCapacity),
    indoorCapacity: num(fields.indoorCapacity, draft.indoorCapacity),
    outdoorCapacity: num(fields.outdoorCapacity, draft.outdoorCapacity),
    curfewTime: str(fields.curfewTime, draft.curfewTime),
    noiseRestriction: str(fields.noiseRestriction, draft.noiseRestriction),
    ageRestriction: str(fields.ageRestriction, draft.ageRestriction),
    wheelchairAccessible: bool(fields.wheelchairAccessible, draft.wheelchairAccessible),
    parkingAvailable: bool(fields.parkingAvailable, draft.parkingAvailable),
    facilities: facilities.length > 0 ? facilities : strList(fields.facilities, draft.facilities),
    otherFacilities: str(fields.otherFacilities, draft.otherFacilities),
    venueManagerName: str(fields.venueManagerName, draft.venueManagerName),
    venueManagerPhone: str(fields.venueManagerPhone, draft.venueManagerPhone),
    bookingContactName: str(fields.bookingContactName, draft.bookingContactName),
    bookingContactEmail: str(fields.bookingContactEmail, draft.bookingContactEmail),
    operationsNotes: str(fields.operationsNotes, draft.operationsNotes),
    securityRequired: bool(fields.securityRequired, draft.securityRequired),
    equipmentProvided: bool(fields.equipmentProvided, draft.equipmentProvided),
    smokingAllowed: bool(fields.smokingAllowed, draft.smokingAllowed),
    lateLicense: bool(fields.lateLicense, draft.lateLicense),
    parkingDetails: str(fields.parkingDetails, draft.parkingDetails),
    loadInDetails: str(fields.loadInDetails, draft.loadInDetails),
    loadOutDetails: str(fields.loadOutDetails, draft.loadOutDetails),
    hireFeeCents: hireFeeCents > 0 ? hireFeeCents : draft.hireFeeCents,
    depositAmountCents: depositAmountCents > 0 ? depositAmountCents : draft.depositAmountCents,
    minimumSpendCents: minimumSpendCents > 0 ? minimumSpendCents : draft.minimumSpendCents,
    depositRequired,
    barSplitPercent: percent(fields.barSplitPercent, draft.barSplitPercent),
    paymentTerms: str(fields.paymentTerms, draft.paymentTerms),
  };
}

export { VENUE_FACILITY_OPTIONS, type VenueFacilityOption };
