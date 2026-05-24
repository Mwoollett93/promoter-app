import { NextResponse } from "next/server";

import { deleteIntegrationConnection } from "@/lib/integrations/connections";
import type { IntegrationId } from "@/lib/settings/settings";
import { getBearerToken, getUserFromAccessToken } from "@/lib/supabase/server-user";

export async function POST(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromAccessToken(accessToken);
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { provider: providerParam } = await context.params;
    const provider = providerParam as IntegrationId;

    const body = (await request.json()) as { workspaceId?: string };
    const workspaceId = body.workspaceId?.trim();
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
    }

    await deleteIntegrationConnection(workspaceId, provider);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Disconnect failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
