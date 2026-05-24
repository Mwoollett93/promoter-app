import type { ArtistDraft, ArtistReach, ArtistStatus } from "@/lib/types/artist";

import { parseCsv } from "@/lib/csv/parse-csv";

export type ArtistImportRow = {
  rowNumber: number;
  draft: ArtistDraft;
  errors: string[];
};

const HEADER_ALIASES: Record<string, keyof ArtistDraft | "genres" | "typical_fee" | "deposit_amount"> = {
  name: "name",
  artist: "name",
  artist_name: "name",
  artist_type: "artistType",
  type: "artistType",
  genres: "genres",
  genre: "genres",
  status: "status",
  city: "city",
  country: "country",
  reach: "reach",
  email: "email",
  phone: "phone",
  bio: "bio",
  typical_fee: "typical_fee",
  fee: "typical_fee",
  deposit_required: "depositRequired",
  deposit_required_flag: "depositRequired",
  deposit: "deposit_amount",
  deposit_amount: "deposit_amount",
  booking_notes: "bookingNotes",
  notes: "bookingNotes",
  tags: "tags",
};

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseReach(value: string): ArtistReach {
  const v = value.trim().toLowerCase();
  if (v === "national" || v === "international") return v;
  return "local";
}

function parseStatus(value: string): ArtistStatus {
  const v = value.trim().toLowerCase();
  if (v === "inactive" || v === "archived") return v;
  return "active";
}

function parseMoneyToCents(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}

function emptyDraft(): ArtistDraft {
  return {
    name: "",
    artistType: "DJ",
    genres: [],
    status: "active",
    classification: "",
    city: "",
    country: "",
    reach: "local",
    bio: "",
    promoImageUrl: "",
    contactName: "",
    contactRole: "",
    email: "",
    phone: "",
    preferredContactMethod: "",
    agencyName: "",
    managementCompany: "",
    territory: "",
    representedArtists: [],
    internalNotes: "",
    reliabilityRating: 0,
    typicalFeeCents: 0,
    depositRequired: false,
    depositAmountCents: 0,
    bookingNotes: "",
    tags: [],
    socialLinks: [],
    documents: [],
  };
}

export function parseArtistImportCsv(text: string): ArtistImportRow[] {
  const table = parseCsv(text);
  if (table.length < 2) return [];

  const headers = table[0].map(normalizeHeader);
  const results: ArtistImportRow[] = [];

  for (let i = 1; i < table.length; i++) {
    const cells = table[i];
    const draft = emptyDraft();
    const errors: string[] = [];
    let typicalFee = 0;
    let depositAmount = 0;
    let depositRequired = false;

    headers.forEach((header, index) => {
      const key = HEADER_ALIASES[header];
      const raw = cells[index]?.trim() ?? "";
      if (!key || !raw) return;

      switch (key) {
        case "name":
          draft.name = raw;
          break;
        case "artistType":
          draft.artistType = raw;
          break;
        case "genres":
          draft.genres = raw.split(/[|;]/).map((g) => g.trim()).filter(Boolean);
          break;
        case "status":
          draft.status = parseStatus(raw);
          break;
        case "city":
          draft.city = raw;
          break;
        case "country":
          draft.country = raw;
          break;
        case "reach":
          draft.reach = parseReach(raw);
          break;
        case "email":
          draft.email = raw;
          break;
        case "phone":
          draft.phone = raw;
          break;
        case "bio":
          draft.bio = raw;
          break;
        case "bookingNotes":
          draft.bookingNotes = raw;
          break;
        case "tags":
          draft.tags = raw.split(/[|;]/).map((t) => t.trim()).filter(Boolean);
          break;
        case "typical_fee":
          typicalFee = parseMoneyToCents(raw);
          break;
        case "deposit_amount":
          depositAmount = parseMoneyToCents(raw);
          depositRequired = depositAmount > 0;
          break;
        case "depositRequired":
          depositRequired = ["yes", "true", "1", "y"].includes(raw.toLowerCase());
          break;
        default:
          break;
      }
    });

    draft.typicalFeeCents = typicalFee;
    draft.depositAmountCents = depositAmount;
    draft.depositRequired = depositRequired;

    if (!draft.name.trim()) errors.push("Name is required.");
    if (!draft.artistType.trim()) draft.artistType = "DJ";

    results.push({ rowNumber: i + 1, draft, errors });
  }

  return results;
}
