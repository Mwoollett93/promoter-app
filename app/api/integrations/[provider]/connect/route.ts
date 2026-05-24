import { NextResponse } from "next/server";

import { integrationEnvReady, INTEGRATION_PROVIDERS } from "@/lib/integrations/providers";
import type { IntegrationId } from "@/lib/settings/settings";
import { getBearerToken, getUserFromAccessToken } from "@/lib/supabase/server-user";

function appOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: providerParam } = await context.params;
  const provider = providerParam as IntegrationId;
  const config = INTEGRATION_PROVIDERS[provider];

  if (!config) {
    return NextResponse.json({ error: "This integration is not available yet." }, { status: 400 });
  }

  if (!integrationEnvReady(provider)) {
    return NextResponse.json(
      { error: `${config.clientIdEnv} is not configured on the server.` },
      { status: 503 },
    );
  }

  const accessToken = getBearerToken(request);
  if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromAccessToken(accessToken);
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { workspaceId?: string };
  const workspaceId = body.workspaceId?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
  }

  const clientId = process.env[config.clientIdEnv]!.trim();
  const origin = appOrigin(request);
  const redirectUri = `${origin}/api/integrations/${provider}/callback`;
  const state = Buffer.from(JSON.stringify({ workspaceId, userId: user.id })).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    state,
    access_type: "offline",
    prompt: "consent",
  });

  if (provider === "stripe") {
    params.set("stripe_user[product_description]", "PromoSync revenue sync");
  }

  return NextResponse.json({ url: `${config.authUrl}?${params.toString()}` });
}
