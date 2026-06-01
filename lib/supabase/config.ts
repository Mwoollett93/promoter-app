/** Normalize project URL — env sometimes includes /auth/v1 or /rest/v1 suffixes. */
export function normalizeSupabaseUrl(url: string) {
  return url
    .replace(/\/$/, "")
    .replace(/\/auth\/v1$/i, "")
    .replace(/\/rest\/v1$/i, "");
}

export function buildSupabaseApiHeaders(anonKey: string, userAccessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: anonKey,
  };

  if (userAccessToken) {
    headers.Authorization = `Bearer ${userAccessToken}`;
  } else if (anonKey.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${anonKey}`;
  }

  return headers;
}
