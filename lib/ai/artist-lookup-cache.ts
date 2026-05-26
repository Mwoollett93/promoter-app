type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

export function normalizeArtistCacheKey(artistName: string): string {
  return artistName
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}

export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function setCached<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export const CACHE_TTL = {
  success: 7 * 24 * 60 * 60 * 1000,
  partial: 24 * 60 * 60 * 1000,
  failure: 24 * 60 * 60 * 1000,
} as const;
