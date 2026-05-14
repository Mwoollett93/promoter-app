import type {
  ArtistDocument,
  ArtistDraft,
  ArtistProfile,
  ArtistSocialLink,
  ArtistStatus,
  SupabaseSession,
} from "@/lib/types/artist";

const SESSION_KEY = "promosync.supabase.session";
const AUTH_RETURN_PATH = "/auth/callback";
const DOCUMENT_BUCKET = "artist-documents";
const MEDIA_BUCKET = "artist-media";
const VENUE_DOCUMENT_BUCKET = "venue-documents";
const VENUE_MEDIA_BUCKET = "venue-media";

export type VenueStatus = "active" | "inactive";

export type VenueDocument = {
  id?: string;
  venueId?: string;
  category: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
};

export type VenueProfile = {
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

export type VenueDraft = {
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

type SupabaseConfig = {
  url: string;
  anonKey: string;
};

type ArtistRow = {
  id: string;
  name: string;
  artist_type: string;
  genres: string[] | null;
  status: ArtistStatus;
  classification: string | null;
  city: string | null;
  country: string | null;
  reach: ArtistProfile["reach"];
  bio: string | null;
  promo_image_url: string | null;
  contact_name: string | null;
  contact_role: string | null;
  email: string | null;
  phone: string | null;
  preferred_contact_method: string | null;
  agency_name: string | null;
  management_company: string | null;
  territory: string | null;
  represented_artists: string[] | null;
  internal_notes: string | null;
  reliability_rating: number | null;
  typical_fee_cents: number | null;
  deposit_required: boolean | null;
  deposit_amount_cents: number | null;
  booking_notes: string | null;
  tags: string[] | null;
  added_date: string;
  created_at: string;
  updated_at: string;
  artist_social_links?: SocialLinkRow[] | null;
  artist_documents?: DocumentRow[] | null;
};

type SocialLinkRow = {
  id: string;
  platform: ArtistSocialLink["platform"];
  url: string;
};

type DocumentRow = {
  id: string;
  artist_id: string;
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

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;
  return {
    url: normaliseSupabaseUrl(url),
    anonKey,
  };
}

function normaliseSupabaseUrl(url: string) {
  return url
    .replace(/\/$/, "")
    .replace(/\/rest\/v1$/, "")
    .replace(/\/auth\/v1$/, "");
}

function getAppBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
  return window.location.origin;
}

export function getStoredSession(): SupabaseSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw) as SupabaseSession;
    if (!session.accessToken || !session.user?.id) return null;
    return session;
  } catch {
    return null;
  }
}

export function storeSession(session: SupabaseSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function startGithubSignIn() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Missing Supabase environment variables.");

  const redirectTo = `${getAppBaseUrl()}${AUTH_RETURN_PATH}`;
  const authUrl = new URL(`${config.url}/auth/v1/authorize`);
  authUrl.searchParams.set("provider", "github");
  authUrl.searchParams.set("redirect_to", redirectTo);
  window.location.href = authUrl.toString();
}

export async function completeSupabaseHashSession(hash: string): Promise<SupabaseSession> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Missing Supabase environment variables.");

  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token") ?? undefined;
  const expiresIn = Number(params.get("expires_in") ?? 0);

  if (!accessToken) {
    throw new Error("Supabase did not return an access token.");
  }

  const userResponse = await fetch(`${config.url}/auth/v1/user`, {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) {
    throw new Error(await getErrorMessage(userResponse, "Unable to fetch Supabase user."));
  }

  const user = (await userResponse.json()) as { id: string; email?: string };
  const session: SupabaseSession = {
    accessToken,
    refreshToken,
    expiresAt: expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : undefined,
    user: {
      id: user.id,
      email: user.email,
    },
  };

  storeSession(session);
  return session;
}

export async function signOutOfSupabase() {
  const config = getSupabaseConfig();
  const session = getStoredSession();

  if (config && session) {
    await fetch(`${config.url}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${session.accessToken}`,
      },
    }).catch(() => undefined);
  }

  clearStoredSession();
}

export async function listArtists(session: SupabaseSession): Promise<ArtistProfile[]> {
  const rows = await supabaseRest<ArtistRow[]>(
    "artists?select=*,artist_social_links(*),artist_documents(*)&order=created_at.desc",
    session,
  );

  return rows.map(mapArtistRow);
}

export async function getArtist(artistId: string, session: SupabaseSession): Promise<ArtistProfile> {
  const [row] = await supabaseRest<ArtistRow[]>(
    `artists?select=*,artist_social_links(*),artist_documents(*)&id=eq.${artistId}`,
    session,
  );

  if (!row) throw new Error("Artist not found.");
  return mapArtistRow(row);
}

export async function createArtist(draft: ArtistDraft, session: SupabaseSession): Promise<ArtistProfile> {
  const [created] = await supabaseRest<ArtistRow[]>("artists?select=*", session, {
    method: "POST",
    body: artistDraftToRow(draft),
    prefer: "return=representation",
  });

  if (!created) throw new Error("Supabase did not return the created artist.");

  const socialPayload = draft.socialLinks
    .filter((link) => link.url.trim())
    .map((link) => ({
      artist_id: created.id,
      platform: link.platform,
      url: link.url.trim(),
    }));

  if (socialPayload.length > 0) {
    await supabaseRest("artist_social_links", session, {
      method: "POST",
      body: socialPayload,
    });
  }

  const documentPayload = draft.documents.map((doc) => ({
    artist_id: created.id,
    category: doc.category,
    file_name: doc.fileName,
    file_path: doc.filePath,
    file_type: doc.fileType,
    file_size: doc.fileSize,
    uploaded_at: doc.uploadedAt,
  }));

  if (documentPayload.length > 0) {
    await supabaseRest("artist_documents", session, {
      method: "POST",
      body: documentPayload,
    });
  }

  const [hydrated] = await supabaseRest<ArtistRow[]>(
    `artists?select=*,artist_social_links(*),artist_documents(*)&id=eq.${created.id}`,
    session,
  );

  return mapArtistRow(hydrated ?? created);
}

export async function updateArtist(
  artistId: string,
  draft: ArtistDraft,
  session: SupabaseSession,
): Promise<ArtistProfile> {
  const [updated] = await supabaseRest<ArtistRow[]>(`artists?id=eq.${artistId}&select=*`, session, {
    method: "PATCH",
    body: artistDraftToRow(draft),
    prefer: "return=representation",
  });

  if (!updated) throw new Error("Supabase did not return the updated artist.");

  await supabaseRest(`artist_social_links?artist_id=eq.${artistId}`, session, {
    method: "DELETE",
  });

  const socialPayload = draft.socialLinks
    .filter((link) => link.url.trim())
    .map((link) => ({
      artist_id: artistId,
      platform: link.platform,
      url: link.url.trim(),
    }));

  if (socialPayload.length > 0) {
    await supabaseRest("artist_social_links", session, {
      method: "POST",
      body: socialPayload,
    });
  }

  return getArtist(artistId, session);
}

export async function updateArtistQuickFields(
  artistId: string,
  fields: Pick<ArtistDraft, "name" | "genres" | "status">,
  session: SupabaseSession,
): Promise<ArtistProfile> {
  const [updated] = await supabaseRest<ArtistRow[]>(
    `artists?id=eq.${artistId}&select=*,artist_social_links(*),artist_documents(*)`,
    session,
    {
      method: "PATCH",
      body: {
        name: fields.name.trim(),
        genres: fields.genres,
        status: fields.status,
      },
      prefer: "return=representation",
    },
  );

  if (!updated) throw new Error("Supabase did not return the updated artist.");
  return mapArtistRow(updated);
}

export async function deleteArtist(artistId: string, session: SupabaseSession) {
  await supabaseRest(`artists?id=eq.${artistId}`, session, {
    method: "DELETE",
  });
}

export async function uploadArtistDocument(
  file: File,
  artistId: string,
  category: string,
  session: SupabaseSession,
): Promise<ArtistDocument> {
  const config = requireSupabaseConfig();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const filePath = `${session.user.id}/${artistId}/${crypto.randomUUID()}-${safeName}`;

  const response = await fetch(`${config.url}/storage/v1/object/${DOCUMENT_BUCKET}/${filePath}`, {
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

export async function addArtistDocuments(
  artistId: string,
  documents: ArtistDocument[],
  session: SupabaseSession,
) {
  if (documents.length === 0) return;

  await supabaseRest("artist_documents", session, {
    method: "POST",
    body: documents.map((doc) => ({
      artist_id: artistId,
      category: doc.category,
      file_name: doc.fileName,
      file_path: doc.filePath,
      file_type: doc.fileType,
      file_size: doc.fileSize,
      uploaded_at: doc.uploadedAt,
    })),
  });
}

export async function uploadArtistMedia(file: File, session: SupabaseSession): Promise<string> {
  const config = requireSupabaseConfig();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const filePath = `${session.user.id}/${crypto.randomUUID()}-${safeName}`;

  const response = await fetch(`${config.url}/storage/v1/object/${MEDIA_BUCKET}/${filePath}`, {
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

  return `${config.url}/storage/v1/object/public/${MEDIA_BUCKET}/${filePath}`;
}

export async function updateArtistPromoImage(
  artistId: string,
  promoImageUrl: string,
  session: SupabaseSession,
) {
  await supabaseRest(`artists?id=eq.${artistId}`, session, {
    method: "PATCH",
    body: {
      promo_image_url: promoImageUrl,
    },
  });
}

export async function createSignedDocumentUrl(filePath: string, session: SupabaseSession) {
  const config = requireSupabaseConfig();
  const response = await fetch(`${config.url}/storage/v1/object/sign/${DOCUMENT_BUCKET}/${filePath}`, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: 60 }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Unable to create document link."));
  }

  const data = (await response.json()) as { signedURL?: string; signedUrl?: string };
  const signedPath = data.signedURL ?? data.signedUrl;
  if (!signedPath) throw new Error("Supabase did not return a signed URL.");

  if (signedPath.startsWith("http")) return signedPath;
  return `${config.url}/storage/v1${signedPath.startsWith("/") ? signedPath : `/${signedPath}`}`;
}

export async function listVenues(session: SupabaseSession): Promise<VenueProfile[]> {
  const rows = await supabaseRest<VenueRow[]>("venues?select=*,venue_documents(*)&order=created_at.desc", session);
  return rows.map(mapVenueRow);
}

export async function getVenue(venueId: string, session: SupabaseSession): Promise<VenueProfile> {
  const [row] = await supabaseRest<VenueRow[]>(`venues?select=*,venue_documents(*)&id=eq.${venueId}`, session);
  if (!row) throw new Error("Venue not found.");
  return mapVenueRow(row);
}

export async function createVenue(draft: VenueDraft, session: SupabaseSession): Promise<VenueProfile> {
  const [created] = await supabaseRest<VenueRow[]>("venues?select=*", session, {
    method: "POST",
    body: venueDraftToRow(draft),
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
    body: venueDraftToRow(draft),
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

export async function addVenueDocuments(venueId: string, documents: VenueDocument[], session: SupabaseSession) {
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

async function supabaseRest<T>(
  path: string,
  session: SupabaseSession,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    prefer?: string;
  } = {},
): Promise<T> {
  const config = requireSupabaseConfig();
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    method: options.method ?? "GET",
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
      Prefer: options.prefer ?? "return=minimal",
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Supabase request failed."));
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

function requireSupabaseConfig(): SupabaseConfig {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  return config;
}

function artistDraftToRow(draft: ArtistDraft) {
  return {
    name: draft.name.trim(),
    artist_type: draft.artistType,
    genres: draft.genres,
    status: draft.status,
    classification: draft.classification || null,
    city: draft.city || null,
    country: draft.country || null,
    reach: draft.reach,
    bio: draft.bio || null,
    promo_image_url: draft.promoImageUrl || null,
    contact_name: draft.contactName || null,
    contact_role: draft.contactRole || null,
    email: draft.email || null,
    phone: draft.phone || null,
    preferred_contact_method: draft.preferredContactMethod || null,
    agency_name: draft.agencyName || null,
    management_company: draft.managementCompany || null,
    territory: draft.territory || null,
    represented_artists: draft.representedArtists,
    internal_notes: draft.internalNotes || null,
    reliability_rating: draft.reliabilityRating || null,
    typical_fee_cents: draft.typicalFeeCents,
    deposit_required: draft.depositRequired,
    deposit_amount_cents: draft.depositAmountCents,
    booking_notes: draft.bookingNotes || null,
    tags: draft.tags,
  };
}

function mapArtistRow(row: ArtistRow): ArtistProfile {
  return {
    id: row.id,
    name: row.name,
    artistType: row.artist_type,
    genres: row.genres ?? [],
    status: row.status,
    classification: row.classification ?? undefined,
    city: row.city ?? undefined,
    country: row.country ?? undefined,
    reach: row.reach,
    bio: row.bio ?? undefined,
    promoImageUrl: row.promo_image_url ?? undefined,
    contactName: row.contact_name ?? undefined,
    contactRole: row.contact_role ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    preferredContactMethod: row.preferred_contact_method ?? undefined,
    agencyName: row.agency_name ?? undefined,
    managementCompany: row.management_company ?? undefined,
    territory: row.territory ?? undefined,
    representedArtists: row.represented_artists ?? [],
    internalNotes: row.internal_notes ?? undefined,
    reliabilityRating: row.reliability_rating ?? undefined,
    typicalFeeCents: row.typical_fee_cents ?? 0,
    depositRequired: row.deposit_required ?? false,
    depositAmountCents: row.deposit_amount_cents ?? 0,
    bookingNotes: row.booking_notes ?? undefined,
    tags: row.tags ?? [],
    addedDate: row.added_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    socialLinks: (row.artist_social_links ?? []).map((link) => ({
      id: link.id,
      platform: link.platform,
      url: link.url,
    })),
    documents: (row.artist_documents ?? []).map((doc) => ({
      id: doc.id,
      artistId: doc.artist_id,
      category: doc.category,
      fileName: doc.file_name,
      filePath: doc.file_path,
      fileType: doc.file_type,
      fileSize: doc.file_size,
      uploadedAt: doc.uploaded_at,
    })),
  };
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

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { message?: string; error_description?: string; hint?: string };
    return data.message ?? data.error_description ?? data.hint ?? fallback;
  } catch {
    return fallback;
  }
}
