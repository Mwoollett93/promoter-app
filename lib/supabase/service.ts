import { getSupabaseServerConfig } from "@/lib/supabase/server-auth";

type ServiceConfig = {
  url: string;
  serviceKey: string;
};

export function getSupabaseServiceConfig(): ServiceConfig | null {
  const base = getSupabaseServerConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!base || !serviceKey) return null;
  return { url: base.url, serviceKey };
}

export async function serviceRest<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: unknown;
    prefer?: string;
  } = {},
): Promise<T> {
  const config = getSupabaseServiceConfig();
  if (!config) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");

  const headers: Record<string, string> = {
    apikey: config.serviceKey,
    Authorization: `Bearer ${config.serviceKey}`,
    "Content-Type": "application/json",
  };
  if (options.prefer) headers.Prefer = options.prefer;

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Service request failed (${response.status}).`);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
