import type { SupabaseSession } from "@/lib/types/artist";
import type { WorkspaceRole } from "@/lib/types/collaboration";

export async function sendWorkspaceInviteEmail(
  session: SupabaseSession,
  input: {
    to: string;
    workspaceId: string;
    workspaceName: string;
    role: WorkspaceRole;
    inviterName: string;
  },
): Promise<{ stub: boolean }> {
  const response = await fetch("/api/workspace/invite-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    stub?: boolean;
    diagnostics?: { hasKey?: boolean; nodeEnv?: string };
  };

  if (!response.ok) {
    let message = payload.error ?? "Failed to send invite email";
    if (payload.diagnostics && !payload.diagnostics.hasKey) {
      message += ` (server NODE_ENV=${payload.diagnostics.nodeEnv ?? "unknown"})`;
    }
    throw new Error(message);
  }

  return { stub: Boolean(payload.stub) };
}
