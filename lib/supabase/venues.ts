import type { SupabaseSession } from "@/lib/types/artist";
import type { VenueDocument, VenueDraft, VenueProfile } from "@/lib/types/venue";

import { requireSupabaseConfig, supabaseRest } from "./client-rest";

const VENUE_DOCUMENT_BUCKET = "venue-documents";
const VENUE_MEDIA_BUCKET = "venue-media";

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
  status: VenueProfile["status"];
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
  workspace_id?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  venue_documents?: VenueDocumentRow[] | null;
};

function venueDraftToPatchRow(draft: VenueDraft) {
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

function venueDraftToRow(draft: VenueDraft, workspaceId: string, userId: string) {
  return {
    ...venueDraftToPatchRow(draft),
    workspace_id: workspaceId,
    created_by: userId,
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
    createdBy: row.created_by ?? undefined,
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

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { message?: string; error_description?: string; hint?: string };
    return data.message ?? data.error_description ?? data.hint ?? fallback;
  } catch {
    return fallback;
  }
}

export async function listVenues(
  session: SupabaseSession,
  workspaceId: string,
): Promise<VenueProfile[]> {
  const rows = await supabaseRest<VenueRow[]>(
    `venues?select=*,venue_documents(*)&workspace_id=eq.${workspaceId}&order=created_at.desc`,
    session,
  );
  return rows.map(mapVenueRow);
}

export async function getVenue(
  venueId: string,
  session: SupabaseSession,
): Promise<VenueProfile> {
  const [row] = await supabaseRest<VenueRow[]>(
    `venues?select=*,venue_documents(*)&id=eq.${venueId}`,
    session,
  );
  if (!row) throw new Error("Venue not found.");
  return mapVenueRow(row);
}

export async function createVenue(
  draft: VenueDraft,
  session: SupabaseSession,
  workspaceId: string,
): Promise<VenueProfile> {
  const [created] = await supabaseRest<VenueRow[]>("venues?select=*", session, {
    method: "POST",
    body: venueDraftToRow(draft, workspaceId, session.user.id),
    prefer: "return=representation",
  });

  if (!created) throw new Error("Supabase did not return the created venue.");

  if (draft.documents.length > 0) {
    await addVenueDocuments(created.id, draft.documents, session);
  }

  return getVenue(created.id, session);
}

export async function updateVenue(
  venueId: string,
  draft: VenueDraft,
  session: SupabaseSession,
): Promise<VenueProfile> {
  const [updated] = await supabaseRest<VenueRow[]>(`venues?id=eq.${venueId}&select=*`, session, {
    method: "PATCH",
    body: venueDraftToPatchRow(draft),
    prefer: "return=representation",
  });

  if (!updated) throw new Error("Supabase did not return the updated venue.");
  return getVenue(venueId, session);
}

export async function deleteVenue(venueId: string, session: SupabaseSession) {
  await supabaseRest(`venues?id=eq.${venueId}`, session, {
    method: "DELETE",
  });
}

export async function uploadVenueDocument(
  file: File,
  venueId: string,
  category: string,
  session: SupabaseSession,
): Promise<VenueDocument> {
  const config = requireSupabaseConfig();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const filePath = `${session.user.id}/${venueId}/${crypto.randomUUID()}-${safeName}`;

  const response = await fetch(`${config.url}/storage/v1/object/${VENUE_DOCUMENT_BUCKET}/${filePath}`, {
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
    throw new Error(await getErrorMessage(response, `Unable to upload ${file.name}.`));
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

export async function addVenueDocuments(
  venueId: string,
  documents: VenueDocument[],
  session: SupabaseSession,
) {
  if (documents.length === 0) return;

  await supabaseRest("venue_documents", session, {
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

export async function uploadVenueMedia(file: File, session: SupabaseSession): Promise<string> {
  const config = requireSupabaseConfig();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const filePath = `${session.user.id}/${crypto.randomUUID()}-${safeName}`;

  const response = await fetch(`${config.url}/storage/v1/object/${VENUE_MEDIA_BUCKET}/${filePath}`, {
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
    throw new Error(await getErrorMessage(response, `Unable to upload ${file.name}.`));
  }

  return `${config.url}/storage/v1/object/public/${VENUE_MEDIA_BUCKET}/${filePath}`;
}

export async function updateVenueImage(venueId: string, imageUrl: string, session: SupabaseSession) {
  await supabaseRest(`venues?id=eq.${venueId}`, session, {
    method: "PATCH",
    body: {
      image_url: imageUrl,
    },
  });
}

export async function createSignedVenueDocumentUrl(filePath: string, session: SupabaseSession) {
  const config = requireSupabaseConfig();
  const response = await fetch(`${config.url}/storage/v1/object/sign/${VENUE_DOCUMENT_BUCKET}/${filePath}`, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: 60 }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Unable to create a signed download URL."));
  }

  const data = (await response.json()) as { signedURL?: string; signedUrl?: string };
  const signedPath = data.signedURL ?? data.signedUrl;
  if (!signedPath) throw new Error("Supabase did not return a signed URL.");
  if (signedPath.startsWith("http")) return signedPath;
  return `${config.url}/storage/v1${signedPath.startsWith("/") ? signedPath : `/${signedPath}`}`;
}
