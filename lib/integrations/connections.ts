import type { IntegrationId } from "@/lib/settings/settings";
import { serviceRest } from "@/lib/supabase/service";

export type IntegrationConnectionRow = {
  id: string;
  workspace_id: string;
  provider: IntegrationId;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  scope: string | null;
  account_label: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function listIntegrationConnections(
  workspaceId: string,
): Promise<IntegrationConnectionRow[]> {
  return serviceRest<IntegrationConnectionRow[]>(
    `integration_connections?workspace_id=eq.${workspaceId}&select=id,workspace_id,provider,expires_at,scope,account_label,metadata,created_at`,
  );
}

export async function upsertIntegrationConnection(input: {
  workspaceId: string;
  provider: IntegrationId;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: string | null;
  scope?: string | null;
  accountLabel?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await serviceRest("integration_connections", {
    method: "POST",
    body: {
      workspace_id: input.workspaceId,
      provider: input.provider,
      access_token: input.accessToken,
      refresh_token: input.refreshToken ?? null,
      expires_at: input.expiresAt ?? null,
      scope: input.scope ?? null,
      account_label: input.accountLabel ?? null,
      metadata: input.metadata ?? {},
    },
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}

export async function deleteIntegrationConnection(workspaceId: string, provider: IntegrationId) {
  await serviceRest(
    `integration_connections?workspace_id=eq.${workspaceId}&provider=eq.${provider}`,
    { method: "DELETE", prefer: "return=minimal" },
  );
}
