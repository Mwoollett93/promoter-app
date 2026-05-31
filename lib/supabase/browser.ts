import { createClient, type Session } from "@supabase/supabase-js";

import type {
  ArtistDocument,
  ArtistDraft,
  ArtistProfile,
  ArtistSocialLink,
  ArtistStatus,
  SupabaseSession,
} from "@/lib/types/artist";
import {
  clearStoredSessionRecord,
  getStoredSession,
  isDemoSession,
  storeSessionRecord,
} from "@/lib/supabase/session-store";

export { getStoredSession, isDemoSession } from "@/lib/supabase/session-store";
const AUTH_RETURN_PATH = "/auth/callback";
const DOCUMENT_BUCKET = "artist-documents";
const MEDIA_BUCKET = "artist-media";

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
  booking_email: string | null;
  management_email: string | null;
  press_email: string | null;
  phone: string | null;
  preferred_contact_method: string | null;
  agency_name: string | null;
  management_company: string | null;
  contact_page: string | null;
  contact_source_urls: string[] | null;
  contact_confidence: string | null;
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

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;
  return {
    url: url.replace(/\/$/, ""),
    anonKey,
  };
}

export function isDemoAuthEnabled() {
  if (process.env.NEXT_PUBLIC_DEMO_AUTH === "false") return false;
  if (process.env.NEXT_PUBLIC_DEMO_AUTH === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export const DEMO_LOGIN_EMAIL = "demo@promosync.app";
export const DEMO_LOGIN_PASSWORD = "demo1234";

export function signInAsDemo(): SupabaseSession {
  const session: SupabaseSession = {
    accessToken: "demo-access-token",
    demo: true,
    user: {
      id: "demo-user",
      email: DEMO_LOGIN_EMAIL,
    },
  };
  storeSession(session);
  void setSessionIndicator({ demo: true });
  return session;
}

const SESSION_REFRESH_SKEW_SEC = 120;

export function isSessionNearExpiry(session: SupabaseSession) {
  if (!session.expiresAt) return false;
  return session.expiresAt <= Math.floor(Date.now() / 1000) + SESSION_REFRESH_SKEW_SEC;
}

function authHeaders(config: SupabaseConfig): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: config.anonKey,
    "Content-Type": "application/json",
  };
  if (config.anonKey.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${config.anonKey}`;
  }
  return headers;
}

/** Refresh an expired access token using the stored refresh token. */
export async function refreshSupabaseSession(
  session: SupabaseSession,
): Promise<SupabaseSession> {
  if (isDemoSession(session)) return session;

  const config = getSupabaseConfig();
  if (!config) {
    throw new Error("Supabase is not configured.");
  }
  if (!session.refreshToken) {
    throw new Error("Your session expired. Please sign out and sign in again.");
  }

  let response: Response;
  try {
    response = await fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: authHeaders(config),
      body: JSON.stringify({ refresh_token: session.refreshToken }),
    });
  } catch {
    throw new Error("Could not reach Supabase to refresh your session.");
  }

  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user?: SupabaseSession["user"];
    error_description?: string;
    msg?: string;
    message?: string;
  };

  if (!response.ok || !payload.access_token || !payload.user?.id) {
    const detail =
      payload.message ??
      payload.msg ??
      payload.error_description ??
      "Unable to refresh session.";
    throw new Error(detail);
  }

  return persistSessionFromApiPayload({
    access_token: payload.access_token,
    refresh_token: payload.refresh_token ?? session.refreshToken,
    expires_in: payload.expires_in,
    user: payload.user,
  });
}

/**
 * Returns a session with a valid access token, refreshing automatically when needed.
 */
export async function getValidSession(): Promise<SupabaseSession | null> {
  const session = getStoredSession();
  if (!session) return null;
  if (isDemoSession(session)) return session;

  if (!isSessionNearExpiry(session)) return session;

  try {
    return await refreshSupabaseSession(session);
  } catch {
    clearStoredSession();
    return null;
  }
}

function storeSession(session: SupabaseSession) {
  storeSessionRecord(session);
}

function clearStoredSession() {
  clearStoredSessionRecord();
}

type OAuthProvider = "github" | "google" | "apple";

function createBrowserAuthClient() {
  const config = requireSupabaseConfig();
  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

let realtimeClient: ReturnType<typeof createBrowserAuthClient> | null = null;

/** Single shared client for Realtime presence — avoids spawning one per page view. */
export function getSupabaseRealtimeClient() {
  if (!realtimeClient) {
    realtimeClient = createBrowserAuthClient();
  }
  return realtimeClient;
}

function persistSessionFromSupabase(session: Session): SupabaseSession {
  const meta = session.user.user_metadata ?? {};
  const mapped: SupabaseSession = {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? undefined,
    user: {
      id: session.user.id,
      email: session.user.email,
      metadata: {
        full_name: typeof meta.full_name === "string" ? meta.full_name : null,
        company_name: typeof meta.company_name === "string" ? meta.company_name : null,
        team_size: typeof meta.team_size === "string" ? meta.team_size : null,
      },
    },
  };

  storeSession(mapped);
  return mapped;
}

type ApiAuthSessionPayload = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  user: SupabaseSession["user"];
};

function persistSessionFromApiPayload(session: ApiAuthSessionPayload): SupabaseSession {
  const mapped: SupabaseSession = {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_in ? Math.floor(Date.now() / 1000) + session.expires_in : undefined,
    user: session.user,
  };

  storeSession(mapped);
  return mapped;
}

async function postAuthApi<T extends Record<string, unknown>>(path: string, body: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }

  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? `Authentication request failed (${response.status}).`);
  }

  return payload;
}

async function setSessionIndicator(options?: { demo?: boolean; accessToken?: string }) {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (options?.accessToken) {
      headers.Authorization = `Bearer ${options.accessToken}`;
    }

    await fetch("/api/auth/session-indicator", {
      method: "POST",
      headers,
      credentials: "same-origin",
      body: JSON.stringify(options?.demo ? { demo: true } : {}),
    });
  } catch {
    /* cookie is defense-in-depth; client auth still works via localStorage */
  }
}

export async function startOAuthSignIn(provider: OAuthProvider) {
  const supabase = createBrowserAuthClient();
  const redirectTo = `${window.location.origin}${AUTH_RETURN_PATH}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });

  if (error) throw new Error(error.message);
  if (data.url) window.location.href = data.url;
}

export function startGithubSignIn() {
  startOAuthSignIn("github");
}

export async function signInWithPassword(email: string, password: string): Promise<SupabaseSession> {
  const normalizedEmail = email.trim().toLowerCase();

  if (
    isDemoAuthEnabled() &&
    normalizedEmail === DEMO_LOGIN_EMAIL &&
    password === DEMO_LOGIN_PASSWORD
  ) {
    return signInAsDemo();
  }

  const result = await postAuthApi<{ session: ApiAuthSessionPayload }>("/api/auth/signin", {
    email: normalizedEmail,
    password,
  });

  return persistSessionFromApiPayload(result.session);
}

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  fullName?: string;
  companyName?: string;
  teamSize?: string;
}): Promise<SupabaseSession> {
  const email = input.email.trim().toLowerCase();
  const emailRedirectTo = `${window.location.origin}${AUTH_RETURN_PATH}`;

  const result = await postAuthApi<{
    session?: ApiAuthSessionPayload;
    needsEmailConfirmation?: boolean;
    message?: string;
  }>("/api/auth/signup", {
    email,
    password: input.password,
    emailRedirectTo,
    data: {
      full_name: input.fullName?.trim() || null,
      company_name: input.companyName?.trim() || null,
      team_size: input.teamSize?.trim() || null,
    },
  });

  if (result.session) return persistSessionFromApiPayload(result.session);

  throw new Error(
    result.message ?? "Account created. Check your email to confirm your address, then sign in.",
  );
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  await postAuthApi<{ ok: boolean }>("/api/auth/recover", {
    email: email.trim().toLowerCase(),
    redirectTo: `${window.location.origin}/login`,
  });
}

export async function updateUserPassword(newPassword: string): Promise<void> {
  const session = getStoredSession();
  if (!session?.accessToken) {
    throw new Error("Sign in to change your password.");
  }

  const response = await fetch("/api/auth/password", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify({ password: newPassword }),
  });

  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? `Password update failed (${response.status}).`);
  }
}

export async function completeSupabaseHashSession(hash: string): Promise<SupabaseSession> {
  const supabase = createBrowserAuthClient();
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken) {
    throw new Error("Supabase did not return an access token.");
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken ?? "",
  });

  if (error) throw new Error(error.message);
  if (!data.session) throw new Error("Unable to complete Supabase sign in.");

  return persistSessionFromSupabase(data.session);
}

export async function establishSessionIndicator(session: SupabaseSession) {
  if (isDemoSession(session)) {
    await setSessionIndicator({ demo: true });
    return;
  }
  await setSessionIndicator({ accessToken: session.accessToken });
}

export async function signOutOfSupabase() {
  const config = getSupabaseConfig();
  const session = getStoredSession();

  if (config && session && !isDemoSession(session)) {
    await fetch(`${config.url}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${session.accessToken}`,
      },
    }).catch(() => undefined);
  }

  await fetch("/api/auth/signout", {
    method: "POST",
    credentials: "same-origin",
  }).catch(() => undefined);

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
    booking_email: draft.bookingEmail || null,
    management_email: draft.managementEmail || null,
    press_email: draft.pressEmail || null,
    phone: draft.phone || null,
    preferred_contact_method: draft.preferredContactMethod || null,
    agency_name: draft.agencyName || null,
    management_company: draft.managementCompany || null,
    contact_page: draft.contactPage || null,
    contact_source_urls: draft.sourceUrls.length > 0 ? draft.sourceUrls : [],
    contact_confidence: draft.contactConfidence || null,
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
    bookingEmail: row.booking_email ?? undefined,
    managementEmail: row.management_email ?? undefined,
    pressEmail: row.press_email ?? undefined,
    phone: row.phone ?? undefined,
    preferredContactMethod: row.preferred_contact_method ?? undefined,
    agencyName: row.agency_name ?? undefined,
    managementCompany: row.management_company ?? undefined,
    contactPage: row.contact_page ?? undefined,
    sourceUrls: row.contact_source_urls ?? [],
    contactConfidence: (row.contact_confidence as ArtistProfile["contactConfidence"]) ?? undefined,
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

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as {
      message?: string;
      msg?: string;
      error?: string;
      error_description?: string;
      hint?: string;
      code?: string | number;
    };
    const detail =
      data.message ??
      data.msg ??
      data.error_description ??
      data.error ??
      (data.code ? String(data.code) : null) ??
      data.hint;
    return detail ? `${detail} (${response.status})` : `${fallback} (${response.status})`;
  } catch {
    return `${fallback} (${response.status})`;
  }
}
