import { buildSupabaseApiHeaders, normalizeSupabaseUrl } from "@/lib/supabase/config";

type SupabaseServerConfig = {
  url: string;
  anonKey: string;
};

export function getSupabaseServerConfig(): SupabaseServerConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) return null;

  return {
    url: normalizeSupabaseUrl(url),
    anonKey,
  };
}

function supabaseHeaders(config: SupabaseServerConfig): HeadersInit {
  return {
    ...buildSupabaseApiHeaders(config.anonKey),
    "Content-Type": "application/json",
  };
}

type GoTrueErrorBody = {
  message?: string;
  msg?: string;
  error?: string;
  error_description?: string;
};

async function parseGoTrueError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as GoTrueErrorBody;
    return (
      data.message ??
      data.msg ??
      data.error_description ??
      data.error ??
      `${fallback} (${response.status})`
    );
  } catch {
    return `${fallback} (${response.status})`;
  }
}

export type AuthSessionPayload = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  user: {
    id: string;
    email?: string;
    metadata?: {
      full_name?: string | null;
      company_name?: string | null;
      team_size?: string | null;
    };
  };
};

function mapAuthUser(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}) {
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email,
    metadata: {
      full_name: typeof meta.full_name === "string" ? meta.full_name : null,
      company_name: typeof meta.company_name === "string" ? meta.company_name : null,
      team_size: typeof meta.team_size === "string" ? meta.team_size : null,
    },
  };
}

export async function serverSignUp(input: {
  email: string;
  password: string;
  emailRedirectTo?: string;
  data?: Record<string, string | null>;
}): Promise<
  | { kind: "session"; session: AuthSessionPayload }
  | { kind: "confirm"; message: string }
> {
  const config = getSupabaseServerConfig();
  if (!config) {
    throw new Error("Supabase is not configured on the server.");
  }

  let response: Response;

  try {
    response = await fetch(`${config.url}/auth/v1/signup`, {
      method: "POST",
      headers: supabaseHeaders(config),
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        data: input.data ?? {},
        ...(input.emailRedirectTo ? { redirect_to: input.emailRedirectTo } : {}),
      }),
    });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "network error";
    throw new Error(`Could not reach Supabase (${detail}). Check your project URL and API key.`);
  }

  if (!response.ok) {
    throw new Error(await parseGoTrueError(response, "Unable to create account"));
  }

  const data = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user?: { id: string; email?: string; user_metadata?: Record<string, unknown> };
  };

  if (data.access_token && data.user?.id) {
    return {
      kind: "session",
      session: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        user: mapAuthUser(data.user),
      },
    };
  }

  return {
    kind: "confirm",
    message: "Account created. Check your email to confirm your address, then sign in.",
  };
}

export async function serverSignIn(input: {
  email: string;
  password: string;
}): Promise<AuthSessionPayload> {
  const config = getSupabaseServerConfig();
  if (!config) {
    throw new Error("Supabase is not configured on the server.");
  }

  let response: Response;

  try {
    response = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: supabaseHeaders(config),
      body: JSON.stringify({ email: input.email, password: input.password }),
    });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "network error";
    throw new Error(`Could not reach Supabase (${detail}). Check your project URL and API key.`);
  }

  if (!response.ok) {
    throw new Error(await parseGoTrueError(response, "Unable to sign in"));
  }

  const data = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user?: { id: string; email?: string; user_metadata?: Record<string, unknown> };
  };

  if (!data.access_token || !data.user?.id) {
    throw new Error("Supabase did not return a valid session.");
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    user: mapAuthUser(data.user),
  };
}

export async function serverSendPasswordRecovery(input: {
  email: string;
  redirectTo?: string;
}) {
  const config = getSupabaseServerConfig();
  if (!config) {
    throw new Error("Supabase is not configured on the server.");
  }

  let response: Response;

  try {
    response = await fetch(`${config.url}/auth/v1/recover`, {
      method: "POST",
      headers: supabaseHeaders(config),
      body: JSON.stringify({
        email: input.email,
        redirect_to: input.redirectTo,
      }),
    });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "network error";
    throw new Error(`Could not reach Supabase (${detail}). Check your project URL and API key.`);
  }

  if (!response.ok) {
    throw new Error(await parseGoTrueError(response, "Unable to send reset link"));
  }
}

export async function serverUpdatePassword(accessToken: string, password: string): Promise<void> {
  const config = getSupabaseServerConfig();
  if (!config) {
    throw new Error("Supabase is not configured on the server.");
  }

  let response: Response;

  try {
    response = await fetch(`${config.url}/auth/v1/user`, {
      method: "PUT",
      headers: {
        ...supabaseHeaders(config),
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ password }),
    });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "network error";
    throw new Error(`Could not reach Supabase (${detail}).`);
  }

  if (!response.ok) {
    throw new Error(await parseGoTrueError(response, "Unable to update password"));
  }
}
