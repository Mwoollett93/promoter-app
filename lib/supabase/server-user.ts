import { buildSupabaseApiHeaders } from "@/lib/supabase/config";
import { getSupabaseServerConfig } from "@/lib/supabase/server-auth";

type AuthUserResponse = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export async function getUserFromAccessToken(accessToken: string): Promise<AuthUserResponse | null> {
  const config = getSupabaseServerConfig();
  if (!config) return null;

  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: buildSupabaseApiHeaders(config.anonKey, accessToken),
  });
  if (!response.ok) return null;

  return (await response.json()) as AuthUserResponse;
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}
