import { NextResponse } from "next/server";

import { integrationEnvReady, INTEGRATION_PROVIDERS } from "@/lib/integrations/providers";
import { listIntegrationConnections } from "@/lib/integrations/connections";
import type { IntegrationId } from "@/lib/settings/settings";
import { getBearerToken, getUserFromAccessToken } from "@/lib/supabase/server-user";

const PROVIDER_IDS: IntegrationId[] = ["google", "spotify", "mailchimp", "stripe"];

export async function GET(request: Request) {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromAccessToken(accessToken);
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspaceId = new URL(request.url).searchParams.get("workspaceId")?.trim();
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
    }

    const connections = await listIntegrationConnections(workspaceId);
    const connected = new Set(connections.map((c) => c.provider));

    const providers = PROVIDER_IDS.map((id) => ({
      id,
      connected: connected.has(id),
      configured: integrationEnvReady(id) || INTEGRATION_PROVIDERS[id] === null,
      accountLabel: connections.find((c) => c.provider === id)?.account_label ?? null,
      unavailable: INTEGRATION_PROVIDERS[id] === null,
    }));

    return NextResponse.json({ providers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to load integrations.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
