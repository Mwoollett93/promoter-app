import { createClient } from "@supabase/supabase-js";

import { getStoredSession, getSupabaseConfig } from "@/lib/supabase/browser";
import type { SupabaseSession } from "@/lib/types/artist";

function createMfaClient(session: SupabaseSession) {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");

  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    },
  });
}

async function withMfaSession<T>(fn: (client: ReturnType<typeof createMfaClient>) => Promise<T>) {
  const session = getStoredSession();
  if (!session?.accessToken) throw new Error("Sign in to manage two-factor authentication.");
  if (session.demo) throw new Error("Demo mode does not support MFA.");

  const client = createMfaClient(session);
  await client.auth.setSession({
    access_token: session.accessToken,
    refresh_token: session.refreshToken ?? "",
  });

  return fn(client);
}

export type MfaEnrollResult = {
  factorId: string;
  qrCode: string;
  secret: string;
};

export async function enrollTotpMfa(): Promise<MfaEnrollResult> {
  return withMfaSession(async (client) => {
    const { data, error } = await client.auth.mfa.enroll({ factorType: "totp" });
    if (error) throw new Error(error.message);
    if (!data?.id || !data.totp?.qr_code || !data.totp?.secret) {
      throw new Error("Unable to start MFA enrollment.");
    }
    return {
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    };
  });
}

export async function verifyTotpEnrollment(factorId: string, code: string) {
  return withMfaSession(async (client) => {
    const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId });
    if (challengeError) throw new Error(challengeError.message);

    const { error } = await client.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });
    if (error) throw new Error(error.message);
  });
}

export async function listMfaFactors() {
  return withMfaSession(async (client) => {
    const { data, error } = await client.auth.mfa.listFactors();
    if (error) throw new Error(error.message);
    return data;
  });
}

export async function unenrollMfaFactor(factorId: string) {
  return withMfaSession(async (client) => {
    const { error } = await client.auth.mfa.unenroll({ factorId });
    if (error) throw new Error(error.message);
  });
}
