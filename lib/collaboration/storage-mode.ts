import { getSupabaseConfig, isDemoSession } from "@/lib/supabase/browser";
import { isUuid } from "@/lib/supabase/client-rest";
import type { SupabaseSession } from "@/lib/types/artist";

/** True when collaboration data must stay in browser localStorage (not Supabase REST). */
export function shouldUseLocalCollaboration(
  session: SupabaseSession,
  workspaceId?: string,
): boolean {
  if (isDemoSession(session)) return true;
  if (!getSupabaseConfig()) return true;
  if (workspaceId && !isUuid(workspaceId)) return true;
  return false;
}

export function isPersistedWorkspaceId(workspaceId: string) {
  return isUuid(workspaceId);
}
