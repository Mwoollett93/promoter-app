import type { Task } from "@/lib/types/collaboration";

const TTL_MS = 20_000;

type CacheEntry = {
  tasks: Task[];
  at: number;
};

const cache = new Map<string, CacheEntry>();

export function tasksBoardCacheKey(workspaceId: string, eventId?: string) {
  return `${workspaceId}:${eventId ?? "*"}`;
}

export function readTasksBoardCache(key: string): Task[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.tasks;
}

export function writeTasksBoardCache(key: string, tasks: Task[]) {
  cache.set(key, { tasks, at: Date.now() });
}

export function invalidateTasksBoardCache(workspaceId: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(`${workspaceId}:`)) cache.delete(key);
  }
}
