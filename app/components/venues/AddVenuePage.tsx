"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  Lightbulb,
  Save,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import {
  getStoredSession,
  getSupabaseConfig,
  startGithubSignIn,
} from "@/lib/supabase/browser";
import * as SupabaseBrowser from "@/lib/supabase/browser";
import type { SupabaseSession } from "@/lib/types/artist";

type VenueStatus = "active" | "inactive";

type VenueDocument = {
  id?: string;
  venueId?: string;
  category: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
};

type VenueProfile = {
  id: string;
  name: string;
  venueType: string;
  status: VenueStatus;
  addressLine1: string;
  city: string;
  stateRegion?: string;
  postalCode?: string;
  country: string;
  description?: string;
  imageUrl?: string;
  maxCapacity: number;
  indoorCapacity: number;
  outdoorCapacity: number;
  curfewTime?: string;
  noiseRestriction?: string;
  ageRestriction?: string;
  wheelchairAccessible: boolean;
  parkingAvailable: boolean;
  facilities: string[];
  otherFacilities?: string;
  venueManagerName?: string;
  venueManagerPhone?: string;
  bookingContactName?: string;
  bookingContactEmail?: string;
  financeContactName?: string;
  financeContactPhone?: string;
  financeContactEmail?: string;
  preferredContactMethod?: string;
  operationsNotes?: string;
  depositRequired: boolean;
  depositAmountCents: number;
  depositDueTerms?: string;
  hireFeeCents: number;
  paymentTerms?: string;
  barSplitPercent?: number;
  minimumSpendCents: number;
  securityRequired: boolean;
  equipmentProvided: boolean;
  smokingAllowed: boolean;
  lateLicense: boolean;
  timezone?: string;
  parkingDetails?: string;
  loadInDetails?: string;
  loadOutDetails?: string;
  addedDate: string;
  createdAt: string;
  updatedAt: string;
  documents: VenueDocument[];
};

type VenueDraft = {
  name: string;
  venueType: string;
  status: VenueStatus;
  addressLine1: string;
  city: string;
  stateRegion: string;
  postalCode: string;
  country: string;
  description: string;
  imageUrl: string;
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
  financeContactName: string;
  financeContactPhone: string;
  financeContactEmail: string;
  preferredContactMethod: string;
  operationsNotes: string;
  depositRequired: boolean;
  depositAmountCents: number;
  depositDueTerms: string;
  hireFeeCents: number;
  paymentTerms: string;
  barSplitPercent: number;
  minimumSpendCents: number;
  securityRequired: boolean;
  equipmentProvided: boolean;
  smokingAllowed: boolean;
  lateLicense: boolean;
  timezone: string;
  parkingDetails: string;
  loadInDetails: string;
  loadOutDetails: string;
  documents: VenueDocument[];
};

type VenueDocumentRow = {
  id: string;
  venue_id: string;
  category: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
};

type VenueRow = {
  id: string;
  name: string;
  venue_type: string;
  status: VenueStatus;
  address_line1: string;
  city: string;
  state_region: string | null;
  postal_code: string | null;
  country: string;
  description: string | null;
  image_url: string | null;
  max_capacity: number | null;
  indoor_capacity: number | null;
  outdoor_capacity: number | null;
  curfew_time: string | null;
  noise_restriction: string | null;
  age_restriction: string | null;
  wheelchair_accessible: boolean | null;
  parking_available: boolean | null;
  facilities: string[] | null;
  other_facilities: string | null;
  venue_manager_name: string | null;
  venue_manager_phone: string | null;
  booking_contact_name: string | null;
  booking_contact_email: string | null;
  finance_contact_name: string | null;
  finance_contact_phone: string | null;
  finance_contact_email: string | null;
  preferred_contact_method: string | null;
  operations_notes: string | null;
  deposit_required: boolean | null;
  deposit_amount_cents: number | null;
  deposit_due_terms: string | null;
  hire_fee_cents: number | null;
  payment_terms: string | null;
  bar_split_percent: number | null;
  minimum_spend_cents: number | null;
  security_required: boolean | null;
  equipment_provided: boolean | null;
  smoking_allowed: boolean | null;
  late_license: boolean | null;
  timezone: string | null;
  parking_details: string | null;
  load_in_details: string | null;
  load_out_details: string | null;
  added_date: string;
  created_at: string;
  updated_at: string;
  venue_documents?: VenueDocumentRow[] | null;
};

const venueApi = SupabaseBrowser as {
  addVenueDocuments?: (venueId: string, documents: VenueDocument[], session: SupabaseSession) => Promise<void>;
  createVenue?: (draft: VenueDraft, session: SupabaseSession) => Promise<VenueProfile>;
  getVenue?: (venueId: string, session: SupabaseSession) => Promise<VenueProfile>;
  updateVenue?: (venueId: string, draft: VenueDraft, session: SupabaseSession) => Promise<VenueProfile>;
  updateVenueImage?: (venueId: string, imageUrl: string, session: SupabaseSession) => Promise<void>;
  uploadVenueDocument?: (
    file: File,
    venueId: string,
    category: string,
    session: SupabaseSession,
  ) => Promise<VenueDocument>;
  uploadVenueMedia?: (file: File, session: SupabaseSession) => Promise<string>;
};

async function readSupabaseError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { message?: string; error_description?: string; hint?: string };
    return data.message ?? data.error_description ?? data.hint ?? fallback;
  } catch {
    return fallback;
  }
}

async function venueRest<T>(
  path: string,
  session: SupabaseSession,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    prefer?: string;
  } = {},
): Promise<T> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Missing Supabase environment variables.");

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    method: options.method ?? "GET",
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${session.accessToken}`,
      Accept: "application/json",
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(options.prefer ? { Prefer: options.prefer } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(await readSupabaseError(response, "Supabase request failed."));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function venueDraftToRow(draft: VenueDraft) {
  return {
    name: draft.name.trim(),
    venue_type: draft.venueType,
    status: draft.status,
    address_line1: draft.addressLine1.trim(),
    city: draft.city.trim(),
    state_region: draft.stateRegion || null,
    postal_code: draft.postalCode || null,
    country: draft.country.trim(),
    description: draft.description || null,
    image_url: draft.imageUrl || null,
    max_capacity: draft.maxCapacity,
    indoor_capacity: draft.indoorCapacity,
    outdoor_capacity: draft.outdoorCapacity,
    curfew_time: draft.curfewTime || null,
    noise_restriction: draft.noiseRestriction || null,
    age_restriction: draft.ageRestriction || null,
    wheelchair_accessible: draft.wheelchairAccessible,
    parking_available: draft.parkingAvailable,
    facilities: draft.facilities,
    other_facilities: draft.otherFacilities || null,
    venue_manager_name: draft.venueManagerName || null,
    venue_manager_phone: draft.venueManagerPhone || null,
    booking_contact_name: draft.bookingContactName || null,
    booking_contact_email: draft.bookingContactEmail || null,
    finance_contact_name: draft.financeContactName || null,
    finance_contact_phone: draft.financeContactPhone || null,
    finance_contact_email: draft.financeContactEmail || null,
    preferred_contact_method: draft.preferredContactMethod || null,
    operations_notes: draft.operationsNotes || null,
    deposit_required: draft.depositRequired,
    deposit_amount_cents: draft.depositAmountCents,
    deposit_due_terms: draft.depositDueTerms || null,
    hire_fee_cents: draft.hireFeeCents,
    payment_terms: draft.paymentTerms || null,
    bar_split_percent: draft.barSplitPercent,
    minimum_spend_cents: draft.minimumSpendCents,
    security_required: draft.securityRequired,
    equipment_provided: draft.equipmentProvided,
    smoking_allowed: draft.smokingAllowed,
    late_license: draft.lateLicense,
    timezone: draft.timezone || null,
    parking_details: draft.parkingDetails || null,
    load_in_details: draft.loadInDetails || null,
    load_out_details: draft.loadOutDetails || null,
  };
}

function mapVenueRow(row: VenueRow): VenueProfile {
  return {
    id: row.id,
    name: row.name,
    venueType: row.venue_type,
    status: row.status,
    addressLine1: row.address_line1,
    city: row.city,
    stateRegion: row.state_region ?? undefined,
    postalCode: row.postal_code ?? undefined,
    country: row.country,
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? undefined,
    maxCapacity: row.max_capacity ?? 0,
    indoorCapacity: row.indoor_capacity ?? 0,
    outdoorCapacity: row.outdoor_capacity ?? 0,
    curfewTime: row.curfew_time ?? undefined,
    noiseRestriction: row.noise_restriction ?? undefined,
    ageRestriction: row.age_restriction ?? undefined,
    wheelchairAccessible: row.wheelchair_accessible ?? false,
    parkingAvailable: row.parking_available ?? false,
    facilities: row.facilities ?? [],
    otherFacilities: row.other_facilities ?? undefined,
    venueManagerName: row.venue_manager_name ?? undefined,
    venueManagerPhone: row.venue_manager_phone ?? undefined,
    bookingContactName: row.booking_contact_name ?? undefined,
    bookingContactEmail: row.booking_contact_email ?? undefined,
    financeContactName: row.finance_contact_name ?? undefined,
    financeContactPhone: row.finance_contact_phone ?? undefined,
    financeContactEmail: row.finance_contact_email ?? undefined,
    preferredContactMethod: row.preferred_contact_method ?? undefined,
    operationsNotes: row.operations_notes ?? undefined,
    depositRequired: row.deposit_required ?? false,
    depositAmountCents: row.deposit_amount_cents ?? 0,
    depositDueTerms: row.deposit_due_terms ?? undefined,
    hireFeeCents: row.hire_fee_cents ?? 0,
    paymentTerms: row.payment_terms ?? undefined,
    barSplitPercent: row.bar_split_percent ?? undefined,
    minimumSpendCents: row.minimum_spend_cents ?? 0,
    securityRequired: row.security_required ?? false,
    equipmentProvided: row.equipment_provided ?? false,
    smokingAllowed: row.smoking_allowed ?? false,
    lateLicense: row.late_license ?? false,
    timezone: row.timezone ?? undefined,
    parkingDetails: row.parking_details ?? undefined,
    loadInDetails: row.load_in_details ?? undefined,
    loadOutDetails: row.load_out_details ?? undefined,
    addedDate: row.added_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    documents: (row.venue_documents ?? []).map((doc) => ({
      id: doc.id,
      venueId: doc.venue_id,
      category: doc.category,
      fileName: doc.file_name,
      filePath: doc.file_path,
      fileType: doc.file_type,
      fileSize: doc.file_size,
      uploadedAt: doc.uploaded_at,
    })),
  };
}

async function getVenueLocal(venueId: string, session: SupabaseSession): Promise<VenueProfile> {
  const [row] = await venueRest<VenueRow[]>(
    `venues?select=*,venue_documents(*)&id=eq.${venueId}`,
    session,
  );
  if (!row) throw new Error("Venue not found.");
  return mapVenueRow(row);
}

async function addVenueDocumentsLocal(venueId: string, documents: VenueDocument[], session: SupabaseSession) {
  if (documents.length === 0) return;

  await venueRest("venue_documents", session, {
    method: "POST",
    body: documents.map((doc) => ({
      venue_id: venueId,
      category: doc.category,
      file_name: doc.fileName,
      file_path: doc.filePath,
      file_type: doc.fileType,
      file_size: doc.fileSize,
      uploaded_at: doc.uploadedAt,
    })),
  });
}

async function createVenueLocal(draft: VenueDraft, session: SupabaseSession): Promise<VenueProfile> {
  const [created] = await venueRest<VenueRow[]>("venues?select=*", session, {
    method: "POST",
    body: venueDraftToRow(draft),
    prefer: "return=representation",
  });

  if (!created) throw new Error("Supabase did not return the created venue.");

  if (draft.documents.length > 0) {
    await addVenueDocumentsLocal(created.id, draft.documents, session);
  }

  return getVenueLocal(created.id, session);
}

async function updateVenueLocal(venueId: string, draft: VenueDraft, session: SupabaseSession): Promise<VenueProfile> {
  await venueRest<VenueRow[]>(`venues?id=eq.${venueId}&select=*`, session, {
    method: "PATCH",
    body: venueDraftToRow(draft),
    prefer: "return=representation",
  });

  return getVenueLocal(venueId, session);
}

async function uploadVenueDocumentLocal(
  file: File,
  venueId: string,
  category: string,
  session: SupabaseSession,
): Promise<VenueDocument> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Missing Supabase environment variables.");

  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const filePath = `${session.user.id}/${venueId}/${crypto.randomUUID()}-${safeName}`;
  const response = await fetch(`${config.url}/storage/v1/object/venue-documents/${filePath}`, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(await readSupabaseError(response, `Unable to upload ${file.name}.`));
  }

  return {
    category,
    fileName: file.name,
    filePath,
    fileType: file.type || "application/octet-stream",
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
  };
}

async function uploadVenueMediaLocal(file: File, session: SupabaseSession): Promise<string> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Missing Supabase environment variables.");

  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const filePath = `${session.user.id}/${crypto.randomUUID()}-${safeName}`;
  const response = await fetch(`${config.url}/storage/v1/object/venue-media/${filePath}`, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(await readSupabaseError(response, `Unable to upload ${file.name}.`));
  }

  return `${config.url}/storage/v1/object/public/venue-media/${filePath}`;
}

async function updateVenueImageLocal(venueId: string, imageUrl: string, session: SupabaseSession) {
  await venueRest(`venues?id=eq.${venueId}`, session, {
    method: "PATCH",
    body: { image_url: imageUrl },
  });
}

const addVenueDocuments = venueApi.addVenueDocuments ?? addVenueDocumentsLocal;
const createVenue = venueApi.createVenue ?? createVenueLocal;
const getVenue = venueApi.getVenue ?? getVenueLocal;
const updateVenue = venueApi.updateVenue ?? updateVenueLocal;
const updateVenueImage = venueApi.updateVenueImage ?? updateVenueImageLocal;
const uploadVenueDocument = venueApi.uploadVenueDocument ?? uploadVenueDocumentLocal;
const uploadVenueMedia = venueApi.uploadVenueMedia ?? uploadVenueMediaLocal;

const venueTypeOptions = [
  "Nightclub",
  "Warehouse",
  "Live Music Venue",
  "Bar",
  "Rooftop",
  "Beach Club",
  "Outdoor Space",
  "Multi-Room Venue",
];

const venueNoiseOptions = ["Strict", "Moderate", "Flexible"];
const venueAgeRestrictionOptions = ["18+", "21+", "All Ages"];
const venueContactMethodOptions = ["Email", "Phone", "WhatsApp"];

const venueFacilityOptions = [
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
];

const venueDocumentCategories = [
  "Venue Specs",
  "Contract",
  "Floor Plan",
  "Tech Rider",
  "Licensing Documents",
  "Insurance",
];

type StepId = "basics" | "capacity" | "operations" | "documents" | "review";

type PendingDocument = {
  id: string;
  category: string;
  displayName: string;
  file: File;
};

const draftStorageKey = "promosync.venueDraft";

const steps: Array<{ id: StepId; label: string; subtitle: string }> = [
  { id: "basics", label: "1. Venue Basics", subtitle: "Add name and location" },
  { id: "capacity", label: "2. Capacity & Facilities", subtitle: "Add capacity and amenities" },
  { id: "operations", label: "3. Operations", subtitle: "Add contacts and terms" },
  { id: "documents", label: "4. Documents", subtitle: "Upload venue documents" },
  { id: "review", label: "5. Review", subtitle: "Review and create venue" },
];

const documentStepCards = venueDocumentCategories.map((category) => ({
  category,
  helper: "PDF, DOC, JPG, PNG up to 10MB",
}));

const emptyDraft: VenueDraft = {
  name: "",
  venueType: "",
  status: "active",
  addressLine1: "",
  city: "",
  stateRegion: "",
  postalCode: "",
  country: "",
  description: "",
  imageUrl: "",
  maxCapacity: 0,
  indoorCapacity: 0,
  outdoorCapacity: 0,
  curfewTime: "",
  noiseRestriction: "Moderate",
  ageRestriction: "18+",
  wheelchairAccessible: false,
  parkingAvailable: false,
  facilities: [],
  otherFacilities: "",
  venueManagerName: "",
  venueManagerPhone: "",
  bookingContactName: "",
  bookingContactEmail: "",
  financeContactName: "",
  financeContactPhone: "",
  financeContactEmail: "",
  preferredContactMethod: "Email",
  operationsNotes: "",
  depositRequired: false,
  depositAmountCents: 0,
  depositDueTerms: "7 days after booking",
  hireFeeCents: 0,
  paymentTerms: "7 days before event",
  barSplitPercent: 0,
  minimumSpendCents: 0,
  securityRequired: false,
  equipmentProvided: false,
  smokingAllowed: false,
  lateLicense: false,
  timezone: "",
  parkingDetails: "",
  loadInDetails: "",
  loadOutDetails: "",
  documents: [],
};

function venueProfileToDraft(venue: VenueProfile): VenueDraft {
  return {
    ...emptyDraft,
    name: venue.name,
    venueType: venue.venueType,
    status: venue.status,
    addressLine1: venue.addressLine1,
    city: venue.city,
    stateRegion: venue.stateRegion ?? "",
    postalCode: venue.postalCode ?? "",
    country: venue.country,
    description: venue.description ?? "",
    imageUrl: venue.imageUrl ?? "",
    maxCapacity: venue.maxCapacity,
    indoorCapacity: venue.indoorCapacity,
    outdoorCapacity: venue.outdoorCapacity,
    curfewTime: venue.curfewTime ?? "",
    noiseRestriction: venue.noiseRestriction ?? "Moderate",
    ageRestriction: venue.ageRestriction ?? "18+",
    wheelchairAccessible: venue.wheelchairAccessible,
    parkingAvailable: venue.parkingAvailable,
    facilities: venue.facilities,
    otherFacilities: venue.otherFacilities ?? "",
    venueManagerName: venue.venueManagerName ?? "",
    venueManagerPhone: venue.venueManagerPhone ?? "",
    bookingContactName: venue.bookingContactName ?? "",
    bookingContactEmail: venue.bookingContactEmail ?? "",
    financeContactName: venue.financeContactName ?? "",
    financeContactPhone: venue.financeContactPhone ?? "",
    financeContactEmail: venue.financeContactEmail ?? "",
    preferredContactMethod: venue.preferredContactMethod ?? "Email",
    operationsNotes: venue.operationsNotes ?? "",
    depositRequired: venue.depositRequired,
    depositAmountCents: venue.depositAmountCents,
    depositDueTerms: venue.depositDueTerms ?? "7 days after booking",
    hireFeeCents: venue.hireFeeCents,
    paymentTerms: venue.paymentTerms ?? "7 days before event",
    barSplitPercent: venue.barSplitPercent ?? 0,
    minimumSpendCents: venue.minimumSpendCents,
    securityRequired: venue.securityRequired,
    equipmentProvided: venue.equipmentProvided,
    smokingAllowed: venue.smokingAllowed,
    lateLicense: venue.lateLicense,
    timezone: venue.timezone ?? "",
    parkingDetails: venue.parkingDetails ?? "",
    loadInDetails: venue.loadInDetails ?? "",
    loadOutDetails: venue.loadOutDetails ?? "",
    documents: venue.documents,
  };
}

export default function AddVenuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingVenueId = searchParams.get("venueId");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [draft, setDraft] = useState<VenueDraft>(emptyDraft);
  const [step, setStep] = useState<StepId>("basics");
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([]);
  const [selectedUploadCategory, setSelectedUploadCategory] = useState(venueDocumentCategories[0] ?? "Venue Specs");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasSupabaseConfig = Boolean(getSupabaseConfig());
  const currentIndex = steps.findIndex((item) => item.id === step);

  useEffect(() => {
    const stored = getStoredSession();
    setSession(stored);

    try {
      const raw = window.localStorage.getItem(draftStorageKey);
      if (raw && !editingVenueId) {
        setDraft({ ...emptyDraft, ...(JSON.parse(raw) as Partial<VenueDraft>) });
      }
    } catch {
      window.localStorage.removeItem(draftStorageKey);
    }

    if (stored && editingVenueId) {
      getVenue(editingVenueId, stored)
        .then((venue) => setDraft(venueProfileToDraft(venue)))
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Unable to load venue for editing.");
        });
    }
  }, [editingVenueId]);

  const completion = useMemo(() => {
    const checks = [
      Boolean(draft.name && draft.venueType && draft.addressLine1 && draft.city && draft.country),
      Boolean(draft.maxCapacity > 0 && draft.facilities.length > 0),
      Boolean(draft.venueManagerName && draft.bookingContactEmail),
      pendingDocuments.length > 0 || draft.documents.length > 0,
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [draft, pendingDocuments.length]);

  const currentTip = useMemo(() => {
    const map: Record<StepId, string> = {
      basics: "Add the essential venue details first. You can always update and add more information later.",
      capacity: "Add accurate capacity and facilities information to help with event planning and artist matching.",
      operations: "Add operational contacts and standard terms now to streamline future bookings and avoid confusion.",
      documents: "Upload important venue docs so your team can reuse specs, contracts, and plans later.",
      review: "Review everything before creating the venue profile. You can still go back and edit any section.",
    };

    return map[step];
  }, [step]);

  function patchDraft(patch: Partial<VenueDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function saveDraft() {
    window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
    setMessage("Venue draft saved locally in this browser.");
    setError(null);
  }

  function validateStep(target: StepId) {
    switch (target) {
      case "basics":
        return null;
      case "capacity":
        if (!draft.name.trim() || !draft.venueType.trim() || !draft.addressLine1.trim() || !draft.city.trim() || !draft.country.trim()) {
          return "Complete the venue basics before moving on.";
        }
        return null;
      case "operations":
        if (draft.maxCapacity <= 0 || draft.facilities.length === 0) {
          return "Add venue capacity and at least one facility before continuing.";
        }
        return null;
      case "documents":
      case "review":
        if (!draft.venueManagerName.trim() || !draft.bookingContactEmail.trim()) {
          return "Add the core operations contacts before continuing.";
        }
        return null;
      default:
        return null;
    }
  }

  function goToNextStep() {
    const next = steps[currentIndex + 1];
    if (!next) return;

    const validation = validateStep(next.id);
    if (validation) {
      setError(validation);
      return;
    }

    setError(null);
    setStep(next.id);
  }

  function goToPreviousStep() {
    const previous = steps[currentIndex - 1];
    if (!previous) return;
    setStep(previous.id);
    setError(null);
  }

  function toggleFacility(facility: string) {
    patchDraft({
      facilities: draft.facilities.includes(facility)
        ? draft.facilities.filter((item) => item !== facility)
        : [...draft.facilities, facility],
    });
  }

  function handleDocumentFiles(files: FileList | null) {
    if (!files) return;

    const next = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      category: selectedUploadCategory,
      displayName: file.name,
      file,
    }));

    setPendingDocuments((current) => [...current, ...next]);
  }

  async function saveVenue() {
    if (!session) {
      setError("Sign in with Supabase before saving venues.");
      return;
    }

    const reviewValidation = validateStep("review");
    if (reviewValidation) {
      setError(reviewValidation);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const venue = editingVenueId
        ? await updateVenue(editingVenueId, { ...draft, documents: [] }, session)
        : await createVenue({ ...draft, documents: [] }, session);

      if (imageFile) {
        const imageUrl = await uploadVenueMedia(imageFile, session);
        await updateVenueImage(venue.id, imageUrl, session);
      }

      const uploadedDocuments: VenueDocument[] = [];
      for (const pending of pendingDocuments) {
        const uploaded = await uploadVenueDocument(pending.file, venue.id, pending.category, session);
        uploadedDocuments.push({
          ...uploaded,
          fileName: pending.displayName.trim() || pending.file.name,
        });
      }

      await addVenueDocuments(venue.id, uploadedDocuments, session);
      window.localStorage.removeItem(draftStorageKey);
      router.push("/venues");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save venue.");
    } finally {
      setSaving(false);
    }
  }

  if (!hasSupabaseConfig) {
    return (
      <SetupState
        title="Supabase env vars are missing"
        description="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before creating venues."
      />
    );
  }

  if (!session) {
    return (
      <SetupState
        title="Sign in to add venues"
        description="Venue creation writes to your user-scoped Supabase tables, so a Supabase Auth session is required."
        actionLabel="Sign in with GitHub"
        onAction={startGithubSignIn}
      />
    );
  }

  return (
    <div className="flex w-full max-w-none flex-col gap-3 pb-10">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => handleDocumentFiles(event.target.files)}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
      />

      <header className="flex flex-col gap-4 rounded-xl border border-[#232330] bg-[#11111A] p-5 shadow-[0px_10px_40px_0px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
              <Link href="/venues" className="hover:text-white">
                Venues
              </Link>
              <ChevronRight className="size-3" />
              <span>{editingVenueId ? "Edit Venue" : "Add Venue"}</span>
            </div>
            <h1 className="mt-2 text-[32px] font-bold leading-9 tracking-tight text-[#F5F5F7]">
              {editingVenueId ? "Edit Venue" : "Add Venue"}
            </h1>
            <p className="mt-1 text-[14px] leading-5 text-[#A1A1AA]">
              Create a new venue profile. You can always edit these details later.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/venues"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[#232330] bg-[#11111A] px-4 text-sm font-medium text-[#E4E4E7] hover:border-[#8B5CF6]/50 hover:text-white"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={saveDraft}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#232330] bg-[#11111A] px-4 text-sm font-medium text-[#E4E4E7] hover:border-[#8B5CF6]/50 hover:text-white"
            >
              <Save className="size-4" />
              Save Draft
            </button>
            {step === "review" ? (
              <button
                type="button"
                onClick={() => void saveVenue()}
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#8B5CF6]/60 bg-[#7C3AED] px-5 text-sm font-semibold text-white hover:bg-[#8B5CF6] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Check className="size-4" />
                {saving ? "Creating..." : editingVenueId ? "Update Venue" : "Create Venue"}
              </button>
            ) : (
              <button
                type="button"
                onClick={goToNextStep}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#8B5CF6]/60 bg-[#7C3AED] px-5 text-sm font-semibold text-white hover:bg-[#8B5CF6]"
              >
                Next
                <ArrowRight className="size-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          {steps.map((item, index) => {
            const active = item.id === step;
            const completed = index < currentIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStep(item.id)}
                className={[
                  "rounded-xl border px-4 py-3 text-left transition-colors",
                  active
                    ? "border-[#8B5CF6]/50 bg-[#151322]"
                    : "border-[#232330] bg-[#0F0F17] hover:border-[#8B5CF6]/30",
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={[
                      "flex size-7 items-center justify-center rounded-full text-xs font-semibold ring-1",
                      completed || active
                        ? "bg-[#7C3AED] text-white ring-[#8B5CF6]/50"
                        : "bg-[#11111A] text-[#A1A1AA] ring-[#232330]",
                    ].join(" ")}
                  >
                    {completed ? <Check className="size-3.5" /> : index + 1}
                  </span>
                  <span className="text-xs font-semibold text-[#F5F5F7]">{item.label}</span>
                </div>
                <p className="mt-2 text-xs text-[#A1A1AA]">{item.subtitle}</p>
              </button>
            );
          })}
        </div>
      </header>

      {message ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="rounded-xl border border-[#232330] bg-[#11111A] p-5 shadow-[0px_10px_40px_0px_rgba(0,0,0,0.35)]">
          {step === "basics" ? (
            <BasicsStep draft={draft} patchDraft={patchDraft} imageFile={imageFile} onPickImage={() => imageInputRef.current?.click()} />
          ) : null}
          {step === "capacity" ? <CapacityStep draft={draft} patchDraft={patchDraft} onToggleFacility={toggleFacility} /> : null}
          {step === "operations" ? <OperationsStep draft={draft} patchDraft={patchDraft} /> : null}
          {step === "documents" ? (
            <DocumentsStep
              draft={draft}
              pendingDocuments={pendingDocuments}
              selectedUploadCategory={selectedUploadCategory}
              setSelectedUploadCategory={setSelectedUploadCategory}
              onBrowse={(category) => {
                setSelectedUploadCategory(category);
                fileInputRef.current?.click();
              }}
              onRemovePending={(id) => setPendingDocuments((current) => current.filter((doc) => doc.id !== id))}
            />
          ) : null}
          {step === "review" ? <ReviewStep draft={draft} pendingDocuments={pendingDocuments} onEditStep={setStep} /> : null}

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={currentIndex === 0 ? () => router.push("/venues") : goToPreviousStep}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#232330] bg-[#11111A] px-4 text-sm font-medium text-[#E4E4E7] hover:border-[#8B5CF6]/50 hover:text-white"
            >
              <ArrowLeft className="size-4" />
              {currentIndex === 0 ? "Back to Venues" : "Previous"}
            </button>

            <div className="ml-auto">
              {step === "review" ? (
                <button
                  type="button"
                  onClick={() => void saveVenue()}
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#8B5CF6]/60 bg-[#7C3AED] px-5 text-sm font-semibold text-white hover:bg-[#8B5CF6] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check className="size-4" />
                  {saving ? "Saving..." : editingVenueId ? "Update Venue" : "Create Venue"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#8B5CF6]/60 bg-[#7C3AED] px-5 text-sm font-semibold text-white hover:bg-[#8B5CF6]"
                >
                  Next
                  <ArrowRight className="size-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-3">
          <SidebarCard title="Tips" icon={<Lightbulb className="size-4 text-[#8B5CF6]" />}>
            <p className="text-sm leading-6 text-[#D4D4D8]">{currentTip}</p>
          </SidebarCard>

          <SidebarCard title="Profile Completion">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[#F5F5F7]">{completion}% complete</p>
                <ul className="mt-3 space-y-2 text-xs text-[#A1A1AA]">
                  {steps.map((item, index) => (
                    <li key={item.id} className="flex items-center gap-2">
                      <span
                        className={[
                          "size-2 rounded-full",
                          index < currentIndex || (item.id === step && step === "review")
                            ? "bg-[#8B5CF6]"
                            : "bg-[#3F3F46]",
                        ].join(" ")}
                      />
                      {item.label.replace(/^\d+\.\s*/, "")}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex size-14 items-center justify-center rounded-full border-4 border-[#8B5CF6]/30 text-sm font-semibold text-white">
                {completion}%
              </div>
            </div>
          </SidebarCard>

          <SidebarCard title="Need help?">
            <p className="text-sm leading-6 text-[#D4D4D8]">You can save this for now and come back later.</p>
            <button
              type="button"
              onClick={saveDraft}
              className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#232330] bg-[#0F0F17] px-4 text-sm font-medium text-[#E4E4E7] hover:border-[#8B5CF6]/50 hover:text-white"
            >
              <Save className="size-4" />
              Save as Draft
            </button>
          </SidebarCard>
        </aside>
      </div>
    </div>
  );
}

function BasicsStep({
  draft,
  patchDraft,
  imageFile,
  onPickImage,
}: {
  draft: VenueDraft;
  patchDraft: (patch: Partial<VenueDraft>) => void;
  imageFile: File | null;
  onPickImage: () => void;
}) {
  return (
    <div className="space-y-5">
      <SectionHeader title="Venue Details" description="Add the core name, location, and summary for this venue." />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Venue Name" value={draft.name} onChange={(value) => patchDraft({ name: value })} required />
        <SelectField
          label="Venue Type"
          value={draft.venueType}
          onChange={(value) => patchDraft({ venueType: value })}
          options={venueTypeOptions}
          placeholder="Select venue type"
          required
        />
      </div>

      <TextField label="Address" value={draft.addressLine1} onChange={(value) => patchDraft({ addressLine1: value })} required />

      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="City" value={draft.city} onChange={(value) => patchDraft({ city: value })} required />
        <TextField label="State / Region" value={draft.stateRegion} onChange={(value) => patchDraft({ stateRegion: value })} />
        <TextField label="Postal Code" value={draft.postalCode} onChange={(value) => patchDraft({ postalCode: value })} />
        <TextField label="Country" value={draft.country} onChange={(value) => patchDraft({ country: value })} required />
      </div>

      <TextAreaField label="Venue Description" value={draft.description} onChange={(value) => patchDraft({ description: value })} />

      <section className="rounded-xl border border-dashed border-[#232330] bg-[#0F0F17] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#F5F5F7]">Venue Images</h3>
            <p className="mt-1 text-sm text-[#A1A1AA]">Upload a hero image to use in previews and venue cards.</p>
          </div>
          <button
            type="button"
            onClick={onPickImage}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#232330] bg-[#11111A] px-4 text-sm font-medium text-[#E4E4E7] hover:border-[#8B5CF6]/50 hover:text-white"
          >
            <Upload className="size-4" />
            Upload image
          </button>
        </div>
        <p className="mt-3 text-sm text-[#D4D4D8]">
          {imageFile ? `Selected: ${imageFile.name}` : draft.imageUrl ? "Existing image will be kept." : "No image selected yet."}
        </p>
      </section>
    </div>
  );
}

function CapacityStep({
  draft,
  patchDraft,
  onToggleFacility,
}: {
  draft: VenueDraft;
  patchDraft: (patch: Partial<VenueDraft>) => void;
  onToggleFacility: (facility: string) => void;
}) {
  return (
    <div className="space-y-5">
      <SectionHeader title="Capacity & Facilities" description="Define how the space operates and what it can support." />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-xl border border-[#232330] bg-[#0F0F17] p-4">
          <h3 className="text-sm font-semibold text-[#F5F5F7]">Capacity</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <NumberField label="Max Capacity" value={draft.maxCapacity} onChange={(value) => patchDraft({ maxCapacity: value })} required />
            <NumberField label="Indoor Capacity" value={draft.indoorCapacity} onChange={(value) => patchDraft({ indoorCapacity: value })} />
            <NumberField label="Outdoor Capacity" value={draft.outdoorCapacity} onChange={(value) => patchDraft({ outdoorCapacity: value })} />
            <TimeField label="Curfew" value={draft.curfewTime} onChange={(value) => patchDraft({ curfewTime: value })} />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SelectField
              label="Noise Restrictions"
              value={draft.noiseRestriction}
              onChange={(value) => patchDraft({ noiseRestriction: value })}
              options={venueNoiseOptions}
            />
            <SelectField
              label="Age Restriction"
              value={draft.ageRestriction}
              onChange={(value) => patchDraft({ ageRestriction: value })}
              options={venueAgeRestrictionOptions}
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ToggleField
              label="Wheelchair Accessible"
              checked={draft.wheelchairAccessible}
              onChange={(checked) => patchDraft({ wheelchairAccessible: checked })}
            />
            <ToggleField
              label="Parking Available"
              checked={draft.parkingAvailable}
              onChange={(checked) => patchDraft({ parkingAvailable: checked })}
            />
          </div>
        </section>

        <section className="rounded-xl border border-[#232330] bg-[#0F0F17] p-4">
          <h3 className="text-sm font-semibold text-[#F5F5F7]">Facilities</h3>
          <p className="mt-1 text-sm text-[#A1A1AA]">Select all that apply.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {venueFacilityOptions.map((facility) => {
              const active = draft.facilities.includes(facility);
              return (
                <button
                  key={facility}
                  type="button"
                  onClick={() => onToggleFacility(facility)}
                  className={[
                    "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    active
                      ? "border-[#8B5CF6]/50 bg-[#1A1430] text-white"
                      : "border-[#232330] bg-[#11111A] text-[#A1A1AA] hover:border-[#8B5CF6]/30 hover:text-white",
                  ].join(" ")}
                >
                  {facility}
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <TextAreaField
              label="Other Facilities"
              value={draft.otherFacilities}
              onChange={(value) => patchDraft({ otherFacilities: value })}
              maxLength={200}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function OperationsStep({
  draft,
  patchDraft,
}: {
  draft: VenueDraft;
  patchDraft: (patch: Partial<VenueDraft>) => void;
}) {
  return (
    <div className="space-y-5">
      <SectionHeader title="Operations & Contacts" description="Add the key people and standard booking terms for this venue." />
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-[#232330] bg-[#0F0F17] p-4">
          <h3 className="text-sm font-semibold text-[#F5F5F7]">Operations & Contacts</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextField label="Venue Manager" value={draft.venueManagerName} onChange={(value) => patchDraft({ venueManagerName: value })} required />
            <TextField label="Phone" value={draft.venueManagerPhone} onChange={(value) => patchDraft({ venueManagerPhone: value })} />
            <TextField label="Booking Contact" value={draft.bookingContactName} onChange={(value) => patchDraft({ bookingContactName: value })} required />
            <TextField label="Email" value={draft.bookingContactEmail} onChange={(value) => patchDraft({ bookingContactEmail: value })} required />
            <TextField label="Finance Contact" value={draft.financeContactName} onChange={(value) => patchDraft({ financeContactName: value })} />
            <TextField label="Phone" value={draft.financeContactPhone} onChange={(value) => patchDraft({ financeContactPhone: value })} />
            <TextField label="Finance Email" value={draft.financeContactEmail} onChange={(value) => patchDraft({ financeContactEmail: value })} />
            <SelectField
              label="Preferred Contact Method"
              value={draft.preferredContactMethod}
              onChange={(value) => patchDraft({ preferredContactMethod: value })}
              options={venueContactMethodOptions}
            />
          </div>
          <div className="mt-4">
            <TextAreaField label="Additional Notes" value={draft.operationsNotes} onChange={(value) => patchDraft({ operationsNotes: value })} />
          </div>
        </section>

        <section className="rounded-xl border border-[#232330] bg-[#0F0F17] p-4">
          <h3 className="text-sm font-semibold text-[#F5F5F7]">Terms & Conditions</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ToggleField
              label="Deposit Required"
              checked={draft.depositRequired}
              onChange={(checked) => patchDraft({ depositRequired: checked })}
            />
            <TextField label="Deposit Due" value={draft.depositDueTerms} onChange={(value) => patchDraft({ depositDueTerms: value })} />
            <CurrencyField label="Deposit Amount" value={draft.depositAmountCents} onChange={(value) => patchDraft({ depositAmountCents: value })} />
            <CurrencyField label="Hire Fee" value={draft.hireFeeCents} onChange={(value) => patchDraft({ hireFeeCents: value })} />
            <TextField label="Payment Terms" value={draft.paymentTerms} onChange={(value) => patchDraft({ paymentTerms: value })} />
            <NumberField label="Bar Split (%)" value={draft.barSplitPercent} onChange={(value) => patchDraft({ barSplitPercent: value })} />
            <CurrencyField label="Minimum Spend" value={draft.minimumSpendCents} onChange={(value) => patchDraft({ minimumSpendCents: value })} />
            <TextField label="Timezone" value={draft.timezone} onChange={(value) => patchDraft({ timezone: value })} />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ToggleField
              label="Security Required"
              checked={draft.securityRequired}
              onChange={(checked) => patchDraft({ securityRequired: checked })}
            />
            <ToggleField
              label="Equipment Provided"
              checked={draft.equipmentProvided}
              onChange={(checked) => patchDraft({ equipmentProvided: checked })}
            />
            <ToggleField
              label="Smoking Allowed"
              checked={draft.smokingAllowed}
              onChange={(checked) => patchDraft({ smokingAllowed: checked })}
            />
            <ToggleField
              label="Late License"
              checked={draft.lateLicense}
              onChange={(checked) => patchDraft({ lateLicense: checked })}
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextField label="Parking Details" value={draft.parkingDetails} onChange={(value) => patchDraft({ parkingDetails: value })} />
            <TextField label="Load In Details" value={draft.loadInDetails} onChange={(value) => patchDraft({ loadInDetails: value })} />
            <TextField label="Load Out Details" value={draft.loadOutDetails} onChange={(value) => patchDraft({ loadOutDetails: value })} />
            <TimeField label="Curfew" value={draft.curfewTime} onChange={(value) => patchDraft({ curfewTime: value })} />
          </div>
        </section>
      </div>
    </div>
  );
}

function DocumentsStep({
  draft,
  pendingDocuments,
  selectedUploadCategory,
  setSelectedUploadCategory,
  onBrowse,
  onRemovePending,
}: {
  draft: VenueDraft;
  pendingDocuments: PendingDocument[];
  selectedUploadCategory: string;
  setSelectedUploadCategory: (value: string) => void;
  onBrowse: (category: string) => void;
  onRemovePending: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      <SectionHeader title="Upload Documents" description="Add files that contain important venue information." />

      <div className="grid gap-4 lg:grid-cols-3">
        {documentStepCards.map((card) => (
          <div key={card.category} className="rounded-xl border border-[#232330] bg-[#0F0F17] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#F5F5F7]">{card.category}</h3>
                <p className="mt-1 text-xs text-[#71717A]">{card.helper}</p>
              </div>
              <FileText className="size-5 text-[#8B5CF6]" />
            </div>
            <div className="mt-4 flex min-h-[120px] flex-col items-center justify-center rounded-lg border border-dashed border-[#232330] bg-[#11111A] px-4 text-center">
              <Upload className="size-5 text-[#A1A1AA]" />
              <p className="mt-3 text-sm text-[#D4D4D8]">Drag & drop file here or browse</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedUploadCategory(card.category);
                  onBrowse(card.category);
                }}
                className="mt-4 inline-flex h-9 items-center justify-center rounded-lg border border-[#232330] bg-[#0F0F17] px-4 text-sm font-medium text-[#E4E4E7] hover:border-[#8B5CF6]/50 hover:text-white"
              >
                Browse Files
              </button>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-[#232330] bg-[#0F0F17] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#F5F5F7]">
              <Sparkles className="size-4 text-[#8B5CF6]" />
              AI Document Extraction <span className="text-[#A1A1AA]">(Optional)</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">
              Let AI extract key details from your documents to save time.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#232330] bg-[#11111A] px-4 text-sm font-medium text-[#E4E4E7] hover:border-[#8B5CF6]/50 hover:text-white"
          >
            <Sparkles className="size-4" />
            Enable AI Extraction
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {["Capacity", "Curfew", "Noise Restrictions", "Contacts", "Address", "Equipment", "Licensing"].map((item) => (
            <span key={item} className="rounded-md border border-[#232330] bg-[#11111A] px-3 py-1.5 text-xs text-[#A1A1AA]">
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[#232330] bg-[#0F0F17] p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[#F5F5F7]">Uploaded Files</h3>
          <select
            value={selectedUploadCategory}
            onChange={(event) => setSelectedUploadCategory(event.target.value)}
            className="rounded-lg border border-[#232330] bg-[#11111A] px-3 py-2 text-sm text-[#F5F5F7] outline-none"
          >
            {venueDocumentCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 space-y-2">
          {draft.documents.length === 0 && pendingDocuments.length === 0 ? (
            <p className="text-sm text-[#A1A1AA]">No documents uploaded yet. Files you upload will appear here.</p>
          ) : null}
          {draft.documents.map((document) => (
            <div
              key={document.id ?? document.filePath}
              className="flex items-center justify-between gap-3 rounded-lg border border-[#232330] bg-[#11111A] px-3 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate text-[#F5F5F7]">{document.fileName}</p>
                <p className="text-xs text-[#71717A]">{document.category}</p>
              </div>
              <span className="rounded-md bg-[#1A1430] px-2 py-1 text-xs text-[#C4B5FD]">Existing</span>
            </div>
          ))}
          {pendingDocuments.map((document) => (
            <div
              key={document.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[#232330] bg-[#11111A] px-3 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate text-[#F5F5F7]">{document.displayName}</p>
                <p className="text-xs text-[#71717A]">{document.category}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemovePending(document.id)}
                className="flex size-8 items-center justify-center rounded-md text-[#A1A1AA] hover:bg-[#232330] hover:text-white"
                aria-label={`Remove ${document.displayName}`}
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ReviewStep({
  draft,
  pendingDocuments,
  onEditStep,
}: {
  draft: VenueDraft;
  pendingDocuments: PendingDocument[];
  onEditStep: (step: StepId) => void;
}) {
  return (
    <div className="space-y-5">
      <SectionHeader title="Review & Finalise" description="Review all information before creating your venue profile." />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-4 md:grid-cols-2">
          <ReviewCard title="Venue Information" onEdit={() => onEditStep("basics")}>
            <ReviewField label="Venue Name" value={draft.name} />
            <ReviewField label="Venue Type" value={draft.venueType} />
            <ReviewField label="Address" value={[draft.addressLine1, draft.city, draft.country].filter(Boolean).join(", ")} />
            <ReviewField label="Description" value={draft.description} />
          </ReviewCard>

          <ReviewCard title="Capacity & Facilities" onEdit={() => onEditStep("capacity")}>
            <ReviewField label="Max Capacity" value={draft.maxCapacity ? String(draft.maxCapacity) : "Not set"} />
            <ReviewField label="Indoor Capacity" value={draft.indoorCapacity ? String(draft.indoorCapacity) : "Not set"} />
            <ReviewField label="Outdoor Capacity" value={draft.outdoorCapacity ? String(draft.outdoorCapacity) : "Not set"} />
            <ReviewField label="Facilities" value={draft.facilities.join(", ") || "Not set"} />
          </ReviewCard>

          <ReviewCard title="Operations & Contacts" onEdit={() => onEditStep("operations")}>
            <ReviewField label="Venue Manager" value={draft.venueManagerName} />
            <ReviewField label="Booking Contact" value={draft.bookingContactName} />
            <ReviewField label="Booking Email" value={draft.bookingContactEmail} />
            <ReviewField label="Finance Email" value={draft.financeContactEmail} />
          </ReviewCard>

          <ReviewCard title="Terms & Conditions" onEdit={() => onEditStep("operations")}>
            <ReviewField label="Deposit Required" value={draft.depositRequired ? "Yes" : "No"} />
            <ReviewField label="Deposit Amount" value={formatCurrency(draft.depositAmountCents)} />
            <ReviewField label="Hire Fee" value={formatCurrency(draft.hireFeeCents)} />
            <ReviewField label="Payment Terms" value={draft.paymentTerms} />
          </ReviewCard>

          <ReviewCard title="Documents" onEdit={() => onEditStep("documents")}>
            <ReviewField label="Existing" value={draft.documents.length ? `${draft.documents.length} file(s)` : "None"} />
            <ReviewField label="Pending Uploads" value={pendingDocuments.length ? `${pendingDocuments.length} file(s)` : "None"} />
          </ReviewCard>
        </div>

        <div className="space-y-4">
          <section className="overflow-hidden rounded-xl border border-[#232330] bg-[#0F0F17]">
            <div className="h-44 bg-gradient-to-br from-[#2D2640] to-[#0B0B10]">
              {draft.imageUrl ? (
                <img src={draft.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#F5F5F7]">{draft.name || "Untitled Venue"}</h3>
                  <p className="text-sm text-[#A1A1AA]">{[draft.addressLine1, draft.city].filter(Boolean).join(", ") || "Address not set"}</p>
                </div>
                <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300">
                  {draft.status}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <PreviewStat label="Capacity" value={draft.maxCapacity ? String(draft.maxCapacity) : "0"} />
                <PreviewStat label="Venue Type" value={draft.venueType || "Not set"} />
              </div>
            </div>
          </section>

          <SidebarCard title="Smart Insights">
            <p className="text-sm leading-6 text-[#D4D4D8]">
              Venues with a detailed operations section are easier to reuse later in event planning and budgeting.
            </p>
          </SidebarCard>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#F5F5F7]">{title}</h2>
      <p className="mt-1 text-sm text-[#A1A1AA]">{description}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[#F5F5F7]">
        {label}
        {required ? <span className="ml-1 text-[#EF4444]">*</span> : null}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-lg border border-[#3F3F46] bg-[#11111A] px-3 text-sm text-[#F5F5F7] outline-none transition-colors hover:border-[#71717A] focus:border-[#8B5CF6]"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[#F5F5F7]">
        {label}
        {required ? <span className="ml-1 text-[#EF4444]">*</span> : null}
      </span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(Number(event.target.value || 0))}
        className="h-11 rounded-lg border border-[#3F3F46] bg-[#11111A] px-3 text-sm text-[#F5F5F7] outline-none transition-colors hover:border-[#71717A] focus:border-[#8B5CF6]"
      />
    </label>
  );
}

function CurrencyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[#F5F5F7]">{label}</span>
      <div className="flex h-11 items-center rounded-lg border border-[#3F3F46] bg-[#11111A] px-3 transition-colors hover:border-[#71717A] focus-within:border-[#8B5CF6]">
        <span className="mr-2 text-sm text-[#A1A1AA]">$</span>
        <input
          type="number"
          min={0}
          step={10}
          value={Math.round(value / 100)}
          onChange={(event) => onChange(Number(event.target.value || 0) * 100)}
          className="w-full bg-transparent text-sm text-[#F5F5F7] outline-none"
        />
      </div>
    </label>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[#F5F5F7]">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-lg border border-[#3F3F46] bg-[#11111A] px-3 text-sm text-[#F5F5F7] outline-none transition-colors hover:border-[#71717A] focus:border-[#8B5CF6]"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select option",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[#F5F5F7]">
        {label}
        {required ? <span className="ml-1 text-[#EF4444]">*</span> : null}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-lg border border-[#3F3F46] bg-[#11111A] px-3 text-sm text-[#F5F5F7] outline-none transition-colors hover:border-[#71717A] focus:border-[#8B5CF6]"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  maxLength = 500,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[#F5F5F7]">{label}</span>
      <div className="rounded-lg border border-[#3F3F46] bg-[#11111A] px-3 py-2 transition-colors hover:border-[#71717A] focus-within:border-[#8B5CF6]">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value.slice(0, maxLength))}
          className="min-h-[110px] w-full resize-none bg-transparent text-sm text-[#F5F5F7] outline-none"
        />
        <div className="mt-2 text-right text-xs text-[#71717A]">
          {value.length}/{maxLength}
        </div>
      </div>
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between rounded-lg border border-[#232330] bg-[#11111A] px-3 py-3 text-left"
    >
      <span className="text-sm text-[#F5F5F7]">{label}</span>
      <span
        className={[
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          checked ? "bg-[#7C3AED]" : "bg-[#3F3F46]",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block size-5 transform rounded-full bg-white transition-transform",
            checked ? "translate-x-5" : "translate-x-1",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

function SidebarCard({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#232330] bg-[#11111A] p-4 shadow-[0px_10px_40px_0px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-[#F5F5F7]">{title}</h3>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ReviewCard({
  title,
  children,
  onEdit,
}: {
  title: string;
  children: React.ReactNode;
  onEdit: () => void;
}) {
  return (
    <section className="rounded-xl border border-[#232330] bg-[#0F0F17] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#F5F5F7]">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-medium text-[#8B5CF6] hover:text-[#A855F7]"
        >
          Edit
        </button>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-[#71717A]">{label}</p>
      <p className="mt-1 text-sm text-[#F5F5F7]">{value || "Not set"}</p>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#232330] bg-[#11111A] p-3">
      <p className="text-xs uppercase tracking-wide text-[#71717A]">{label}</p>
      <p className="mt-1 text-sm text-[#F5F5F7]">{value}</p>
    </div>
  );
}

function SetupState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <section className="max-w-xl rounded-2xl border border-[#232330] bg-[#11111A] p-10 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#1A1430] text-[#C4B5FD]">
          <Check className="size-7" aria-hidden />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-[#F5F5F7]">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-[#A1A1AA]">{description}</p>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg border border-[#8B5CF6]/60 bg-[#7C3AED] px-5 text-sm font-semibold text-white"
          >
            {actionLabel}
          </button>
        ) : null}
      </section>
    </div>
  );
}

function formatCurrency(cents: number) {
  if (!cents) return "Not set";

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
