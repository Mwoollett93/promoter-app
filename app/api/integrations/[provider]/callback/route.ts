import { NextResponse } from "next/server";

import { upsertIntegrationConnection } from "@/lib/integrations/connections";
import { INTEGRATION_PROVIDERS } from "@/lib/integrations/providers";
import type { IntegrationId } from "@/lib/settings/settings";

function appOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

type OAuthState = { workspaceId: string; userId: string };

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const origin = appOrigin(request);
  const { provider: providerParam } = await context.params;
  const provider = providerParam as IntegrationId;
  const config = INTEGRATION_PROVIDERS[provider];

  if (!config) {
    return NextResponse.redirect(`${origin}/settings?tab=integrations&error=unavailable`);
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError || !code || !stateRaw) {
    return NextResponse.redirect(`${origin}/settings?tab=integrations&error=oauth_denied`);
  }

  let state: OAuthState;
  try {
    state = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8")) as OAuthState;
  } catch {
    return NextResponse.redirect(`${origin}/settings?tab=integrations&error=invalid_state`);
  }

  const clientId = process.env[config.clientIdEnv]?.trim();
  const clientSecret = process.env[config.clientSecretEnv]?.trim();
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/settings?tab=integrations&error=not_configured`);
  }

  const redirectUri = `${origin}/api/integrations/${provider}/callback`;

  const body =
    provider === "stripe"
      ? new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          code,
          client_secret: clientSecret,
        })
      : new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        });

  const tokenResponse = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(`${origin}/settings?tab=integrations&error=token_exchange`);
  }

  const tokenJson = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    stripe_user_id?: string;
  };

  let accountLabel: string | null = tokenJson.stripe_user_id ?? null;

  if (provider === "google" && tokenJson.access_token) {
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    if (profileRes.ok) {
      const profile = (await profileRes.json()) as { email?: string };
      accountLabel = profile.email ?? null;
    }
  }

  const expiresAt =
    tokenJson.expires_in != null
      ? new Date(Date.now() + tokenJson.expires_in * 1000).toISOString()
      : null;

  await upsertIntegrationConnection({
    workspaceId: state.workspaceId,
    provider,
    accessToken: tokenJson.access_token,
    refreshToken: tokenJson.refresh_token ?? null,
    expiresAt,
    scope: tokenJson.scope ?? config.scopes.join(" "),
    accountLabel,
    metadata: { connected_by: state.userId },
  });

  return NextResponse.redirect(`${origin}/settings?tab=integrations&connected=${provider}`);
}
