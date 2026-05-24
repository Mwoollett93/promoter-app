import { getSupabaseConfig, isDemoSession } from "@/lib/supabase/browser";
import { isUuid } from "@/lib/supabase/client-rest";
import type { SupabaseSession } from "@/lib/types/artist";

const LOCAL_MODE_KEY = "promosync:collab:local-mode";

function localModeKey(userId: string) {
  return `${LOCAL_MODE_KEY}:${userId}`;
}

/** Prefer browser storage when Supabase workspace bootstrap has failed. */
export function markLocalCollaborationMode(userId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(localModeKey(userId), "1");
}

export function clearLocalCollaborationMode(userId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(localModeKey(userId));
}

export function isLocalCollaborationMode(userId: string) {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(localModeKey(userId)) === "1";
}

/** True when collaboration data must stay in browser localStorage (not Supabase REST). */
export function shouldUseLocalCollaboration(
  session: SupabaseSession,
  workspaceId?: string,
): boolean {
  if (isDemoSession(session)) return true;
  if (!getSupabaseConfig()) return true;
  if (isLocalCollaborationMode(session.user.id)) return true;
  if (workspaceId && !isUuid(workspaceId)) return true;
  return false;
}

export function isPersistedWorkspaceId(workspaceId: string) {
  return isUuid(workspaceId);
}

/** Clear offline flag and cached workspace so the next load refetches from Supabase. */
export function reconnectCloudCollaboration(userId: string) {
  clearLocalCollaborationMode(userId);
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(`promosync:collab:workspace:${userId}`);
}
