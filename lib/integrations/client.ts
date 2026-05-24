import { getStoredSession } from "@/lib/supabase/browser";
import type { IntegrationId } from "@/lib/settings/settings";

function authHeaders() {
  const session = getStoredSession();
  if (!session?.accessToken) throw new Error("Sign in required.");
  return {
    Authorization: `Bearer ${session.accessToken}`,
    "Content-Type": "application/json",
  };
}

export type IntegrationStatusItem = {
  id: IntegrationId;
  connected: boolean;
  configured: boolean;
  accountLabel: string | null;
  unavailable: boolean;
};

export async function fetchIntegrationStatus(workspaceId: string) {
  const response = await fetch(
    `/api/integrations/status?workspaceId=${encodeURIComponent(workspaceId)}`,
    { headers: authHeaders() },
  );
  const payload = (await response.json()) as {
    error?: string;
    providers?: IntegrationStatusItem[];
  };
  if (!response.ok) throw new Error(payload.error ?? "Unable to load integrations.");
  return payload.providers ?? [];
}

export async function connectIntegration(workspaceId: string, provider: IntegrationId) {
  const response = await fetch(`/api/integrations/${provider}/connect`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ workspaceId }),
  });
  const payload = (await response.json()) as { error?: string; url?: string };
  if (!response.ok) throw new Error(payload.error ?? "Connect failed.");
  if (!payload.url) throw new Error("Missing OAuth URL.");
  window.location.href = payload.url;
}

export async function disconnectIntegration(workspaceId: string, provider: IntegrationId) {
  const response = await fetch(`/api/integrations/${provider}/disconnect`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ workspaceId }),
  });
  const payload = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Disconnect failed.");
}
