import type { SupabaseSession } from "@/lib/types/artist";

import {
  getSupabaseConfig,
  isDemoSession,
  refreshSupabaseSession,
} from "./browser";

type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export function requireSupabaseConfig(): SupabaseConfig {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return config;
}

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { message?: string; error?: string; hint?: string };
    return payload.message ?? payload.error ?? payload.hint ?? fallback;
  } catch {
    return fallback;
  }
}

function isJwtExpiredMessage(message: string) {
  return /jwt expired|invalid jwt|token.*expired/i.test(message);
}

export async function supabaseRest<T>(
  path: string,
  session: SupabaseSession,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    prefer?: string;
  } = {},
): Promise<T> {
  const config = requireSupabaseConfig();
  let activeSession = session;

  for (let attempt = 0; attempt < 2; attempt++) {
    const headers: Record<string, string> = {
      apikey: config.anonKey,
      Authorization: `Bearer ${activeSession.accessToken}`,
      "Content-Type": "application/json",
      Prefer: options.prefer ?? "return=representation",
    };

    const response = await fetch(`${config.url}/rest/v1/${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    if (!response.ok) {
      const message = await getErrorMessage(response, "Supabase request failed.");
      if (
        attempt === 0 &&
        !isDemoSession(activeSession) &&
        activeSession.refreshToken &&
        isJwtExpiredMessage(message)
      ) {
        activeSession = await refreshSupabaseSession(activeSession);
        continue;
      }
      throw new Error(message);
    }

    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  throw new Error("Supabase request failed.");
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
