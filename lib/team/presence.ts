export type PresenceState = "online" | "idle" | "offline";

const PRESENCE_KEY = "promosync:team-presence";

type PresenceRecord = {
  userId: string;
  state: PresenceState;
  updatedAt: string;
  activity?: string;
};

function readPresence(): PresenceRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(PRESENCE_KEY) ?? "[]") as PresenceRecord[];
  } catch {
    return [];
  }
}

function writePresence(records: PresenceRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRESENCE_KEY, JSON.stringify(records));
}

/** Track current user presence locally (realtime sync later). */
export function touchCurrentUserPresence(userId: string, state: PresenceState = "online") {
  const records = readPresence().filter((r) => r.userId !== userId);
  records.push({ userId, state, updatedAt: new Date().toISOString() });
  writePresence(records.slice(-50));
}

function hashPresence(userId: string): PresenceState {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash + userId.charCodeAt(i) * (i + 1)) % 100;
  }
  if (hash < 45) return "online";
  if (hash < 75) return "idle";
  return "offline";
}

export function resolveMemberPresence(
  userId: string | null,
  currentUserId?: string,
): { state: PresenceState; activity?: string } {
  if (!userId) return { state: "offline" };

  if (userId === currentUserId) {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return { state: "idle", activity: "Away from tab" };
    }
    return { state: "online", activity: "Active now" };
  }

  const stored = readPresence().find((r) => r.userId === userId);
  if (stored) {
    const ageMs = Date.now() - Date.parse(stored.updatedAt);
    if (ageMs < 120_000) return { state: stored.state, activity: stored.activity };
    if (ageMs < 900_000) return { state: "idle", activity: "Recently active" };
  }

  const mocked = hashPresence(userId);
  const activities: Record<PresenceState, string> = {
    online: "Viewing workspace",
    idle: "Away",
    offline: "Offline",
  };
  return { state: mocked, activity: activities[mocked] };
}
