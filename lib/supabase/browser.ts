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

export function isDemoSession(session: SupabaseSession | null | undefined) {
  return Boolean(session?.demo);
}

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
  return session;
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

type AuthTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  user?: { id: string; email?: string };
};

type OAuthProvider = "github" | "google" | "apple";

function persistSessionFromTokenResponse(data: AuthTokenResponse): SupabaseSession {
  if (!data.access_token || !data.user?.id) {
    throw new Error("Supabase did not return a valid session.");
  }

  const session: SupabaseSession = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? Math.floor(Date.now() / 1000) + data.expires_in : undefined,
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  };

  storeSession(session);
  return session;
}

export function startOAuthSignIn(provider: OAuthProvider) {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Missing Supabase environment variables.");

  const redirectTo = `${window.location.origin}${AUTH_RETURN_PATH}`;
  const authUrl = new URL(`${config.url}/auth/v1/authorize`);
  authUrl.searchParams.set("provider", provider);
  authUrl.searchParams.set("redirect_to", redirectTo);
  window.location.href = authUrl.toString();
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

  const config = requireSupabaseConfig();
  const response = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: normalizedEmail, password }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Unable to sign in."));
  }

  const data = (await response.json()) as AuthTokenResponse;
  if (data.access_token && data.user?.id) {
    return persistSessionFromTokenResponse(data);
  }

  if (!data.access_token) {
    throw new Error("Supabase did not return a valid session.");
  }

  const userResponse = await fetch(`${config.url}/auth/v1/user`, {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${data.access_token}`,
    },
  });

  if (!userResponse.ok) {
    throw new Error(await getErrorMessage(userResponse, "Unable to fetch signed-in user."));
  }

  const user = (await userResponse.json()) as { id: string; email?: string };
  const session: SupabaseSession = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? Math.floor(Date.now() / 1000) + data.expires_in : undefined,
    user: {
      id: user.id,
      email: user.email,
    },
  };

  storeSession(session);
  return session;
}

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  fullName?: string;
  companyName?: string;
  teamSize?: string;
}): Promise<SupabaseSession> {
  const config = requireSupabaseConfig();
  const response = await fetch(`${config.url}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email.trim(),
      password: input.password,
      data: {
        full_name: input.fullName?.trim() || null,
        company_name: input.companyName?.trim() || null,
        team_size: input.teamSize?.trim() || null,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Unable to create account."));
  }

  const data = (await response.json()) as AuthTokenResponse;
  if (data.access_token && data.user?.id) {
    return persistSessionFromTokenResponse(data);
  }

  throw new Error("Account created. Check your email to confirm your address, then sign in.");
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  const config = requireSupabaseConfig();
  const redirectTo = `${window.location.origin}/?view=login`;

  const response = await fetch(`${config.url}/auth/v1/recover`, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim(),
      redirect_to: redirectTo,
    }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Unable to send reset link."));
  }
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

  if (config && session && !isDemoSession(session)) {
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

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { message?: string; error_description?: string; hint?: string };
    return data.message ?? data.error_description ?? data.hint ?? fallback;
  } catch {
    return fallback;
  }
}
