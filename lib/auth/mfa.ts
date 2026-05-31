import { createClient, type Session } from "@supabase/supabase-js";

import { getStoredSession, getSupabaseConfig } from "@/lib/supabase/browser";
import { storeSessionRecord } from "@/lib/supabase/session-store";
import type { SupabaseSession } from "@/lib/types/artist";

export type MfaLoginRequirement = {
  required: boolean;
  factorId?: string;
};

function persistMfaSession(session: Session): SupabaseSession {
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
  storeSessionRecord(mapped);
  return mapped;
}

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

async function withMfaSession<T>(
  fn: (client: ReturnType<typeof createMfaClient>) => Promise<T>,
  sessionOverride?: SupabaseSession | null,
) {
  const session = sessionOverride ?? getStoredSession();
  if (!session?.accessToken) throw new Error("Sign in to manage two-factor authentication.");
  if (session.demo) throw new Error("Demo mode does not support MFA.");

  const client = createMfaClient(session);
  await client.auth.setSession({
    access_token: session.accessToken,
    refresh_token: session.refreshToken ?? "",
  });

  return fn(client);
}

/** After password/OAuth sign-in — true when a verified TOTP factor still needs a code. */
export async function getMfaLoginRequirement(
  sessionOverride?: SupabaseSession | null,
): Promise<MfaLoginRequirement> {
  const session = sessionOverride ?? getStoredSession();
  if (!session?.accessToken || session.demo) return { required: false };

  return withMfaSession(async (client) => {
    const { data: aal, error: aalError } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalError) throw new Error(aalError.message);

    if (aal.nextLevel !== "aal2" || aal.currentLevel === "aal2") {
      return { required: false };
    }

    const { data: factors, error: factorError } = await client.auth.mfa.listFactors();
    if (factorError) throw new Error(factorError.message);

    const verified = factors.totp?.find((factor) => factor.status === "verified");
    if (!verified) return { required: false };

    return { required: true, factorId: verified.id };
  }, session);
}

/** Complete login after password/OAuth — upgrades session to AAL2 and persists tokens. */
export async function verifyTotpLogin(factorId: string, code: string): Promise<SupabaseSession> {
  return withMfaSession(async (client) => {
    const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId });
    if (challengeError) throw new Error(challengeError.message);

    const { error: verifyError } = await client.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });
    if (verifyError) throw new Error(verifyError.message);

    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw new Error(sessionError.message);
    if (!sessionData.session) throw new Error("Unable to complete two-factor verification.");

    return persistMfaSession(sessionData.session);
  });
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
