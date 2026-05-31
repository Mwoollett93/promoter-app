import type { SupabaseSession } from "@/lib/types/artist";

export const SESSION_KEY = "promosync.supabase.session";

export function isDemoSession(session: SupabaseSession | null | undefined) {
  return Boolean(session?.demo);
}

export function getStoredSession(): SupabaseSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw) as SupabaseSession;
    if (!session.accessToken || !session.user?.id) return null;
    return session;
  } catch {
    return null;
  }
}

export function storeSessionRecord(session: SupabaseSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSessionRecord() {
  window.localStorage.removeItem(SESSION_KEY);
}
