export type ManagedEventStatus = "active" | "draft" | "canceled" | "completed";

export type ManagedEventRecord = {
  id: string;
  name: string;
  status: ManagedEventStatus;
  dateKey?: string;
  startTime?: string;
  venueId?: string;
  venueName: string;
  description?: string;
  /** Season / run this event belongs to (local + planning_json sync). */
  seasonId?: string;
  artistCount: number;
  slotCount: number;
  b2bCount: number;
  ticketInventory: number;
  expectedRevenue: number;
  totalCosts: number;
  projectedProfit: number;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "promosync:managed-events";

const DEFAULT_EVENTS: ManagedEventRecord[] = [];

const MANAGED_EVENT_SEEDS: ManagedEventRecord[] = DEFAULT_EVENTS;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isManagedEventStatus(value: unknown): value is ManagedEventStatus {
  return value === "active" || value === "draft" || value === "canceled" || value === "completed";
}

function sanitizeCurrency(value: unknown) {
  if (!isFiniteNumber(value)) return 0;
  return Math.max(0, Math.round(value * 100) / 100);
}

function sanitizeWholeNumber(value: unknown) {
  if (!isFiniteNumber(value)) return 0;
  return Math.max(0, Math.round(value));
}

function parseManagedEventRecord(raw: unknown): ManagedEventRecord | null {
  if (!raw || typeof raw !== "object") return null;

  const value = raw as Record<string, unknown>;
  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.name) ||
    !isManagedEventStatus(value.status) ||
    !isNonEmptyString(value.venueName) ||
    !isNonEmptyString(value.createdAt) ||
    !isNonEmptyString(value.updatedAt)
  ) {
    return null;
  }

  return {
    id: value.id.trim(),
    name: value.name.trim(),
    status: value.status,
    dateKey: isNonEmptyString(value.dateKey) ? value.dateKey.trim() : undefined,
    startTime: isNonEmptyString(value.startTime) ? value.startTime.trim() : undefined,
    venueId: isNonEmptyString(value.venueId) ? value.venueId.trim() : undefined,
    venueName: value.venueName.trim(),
    description: isNonEmptyString(value.description) ? value.description.trim() : undefined,
    seasonId: isNonEmptyString(value.seasonId) ? value.seasonId.trim() : undefined,
    artistCount: sanitizeWholeNumber(value.artistCount),
    slotCount: sanitizeWholeNumber(value.slotCount),
    b2bCount: sanitizeWholeNumber(value.b2bCount),
    ticketInventory: sanitizeWholeNumber(value.ticketInventory),
    expectedRevenue: sanitizeCurrency(value.expectedRevenue),
    totalCosts: sanitizeCurrency(value.totalCosts),
    projectedProfit:
      isFiniteNumber(value.projectedProfit) ? Math.round(value.projectedProfit * 100) / 100 : 0,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function parseEventDateKey(dateKey?: string) {
  if (!dateKey) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

/** Derive status from calendar date (today still counts as active/upcoming). */
export function resolveManagedEventStatus(
  dateKey?: string,
  current?: ManagedEventStatus,
): ManagedEventStatus {
  if (current === "canceled") return "canceled";
  if (!dateKey) return current ?? "draft";

  const eventDate = parseEventDateKey(dateKey);
  if (!eventDate) return current ?? "draft";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);

  if (eventDate.getTime() < today.getTime()) return "completed";
  if (current === "draft") return "draft";
  return "active";
}

export function normalizeManagedEvent(event: ManagedEventRecord): ManagedEventRecord {
  const status = resolveManagedEventStatus(event.dateKey, event.status);
  return status === event.status ? event : { ...event, status };
}

function normalizeManagedEvents(events: ManagedEventRecord[]) {
  return events.map(normalizeManagedEvent);
}

function sortManagedEvents(events: ManagedEventRecord[]) {
  return [...events].sort((a, b) => {
    const aTime = Date.parse(a.updatedAt);
    const bTime = Date.parse(b.updatedAt);
    if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
      return bTime - aTime;
    }

    if (a.status !== b.status) {
      const rank: Record<ManagedEventStatus, number> = {
        active: 0,
        draft: 1,
        canceled: 2,
        completed: 3,
      };
      return rank[a.status] - rank[b.status];
    }

    return a.name.localeCompare(b.name);
  });
}

/** Sync read — prefers workspace cache when available via global hook. */
export function loadManagedEvents(): ManagedEventRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  const cached = (window as unknown as { __promosyncEvents?: ManagedEventRecord[] }).__promosyncEvents;
  if (cached) return sortManagedEvents(normalizeManagedEvents(cached));

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const events = parsed
      .map(parseManagedEventRecord)
      .filter((event): event is ManagedEventRecord => event !== null);

    return sortManagedEvents(normalizeManagedEvents(events));
  } catch {
    return [];
  }
}

export function cacheManagedEventsForSync(events: ManagedEventRecord[]) {
  if (typeof window === "undefined") return;
  (window as unknown as { __promosyncEvents?: ManagedEventRecord[] }).__promosyncEvents =
    sortManagedEvents(events);
}

function managedEventsFingerprint(events: ManagedEventRecord[]) {
  return events
    .map((event) => `${event.id}:${event.updatedAt}:${event.status}:${event.name}`)
    .join("|");
}

/** Persist workspace events for dashboard / events list and notify listeners. */
export function publishManagedEvents(events: ManagedEventRecord[]) {
  const sorted = sortManagedEvents(normalizeManagedEvents(events));
  cacheManagedEventsForSync(sorted);

  if (typeof window === "undefined") return;

  const fingerprint = managedEventsFingerprint(sorted);
  const lastFingerprint = (window as unknown as { __promosyncEventsFp?: string })
    .__promosyncEventsFp;

  if (lastFingerprint === fingerprint) return;

  (window as unknown as { __promosyncEventsFp?: string }).__promosyncEventsFp = fingerprint;
  saveManagedEvents(sorted);
  window.dispatchEvent(new Event("promosync:events-updated"));
}

export function saveManagedEvents(events: ManagedEventRecord[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortManagedEvents(events)));
  } catch {
    /* quota / private mode */
  }
}

export function getManagedEventSeedCount() {
  return MANAGED_EVENT_SEEDS.length;
}

/** Adds sample events that are not already in local storage (dev/testing). */
export function seedManagedEvents(): ManagedEventRecord[] {
  const current = loadManagedEvents();
  const existingIds = new Set(current.map((event) => event.id));
  const now = new Date().toISOString();

  const additions = MANAGED_EVENT_SEEDS.filter((event) => !existingIds.has(event.id)).map((event) => ({
    ...event,
    updatedAt: now,
  }));

  const next = sortManagedEvents([...additions, ...current]);
  saveManagedEvents(next);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("promosync:events-updated"));
  }

  return next;
}

export function upsertManagedEvent(event: ManagedEventRecord) {
  const current = loadManagedEvents();
  const index = current.findIndex((item) => item.id === event.id);
  const next =
    index === -1
      ? [event, ...current]
      : current.map((item, itemIndex) => (itemIndex === index ? event : item));

  publishManagedEvents(next);
  return next;
}

