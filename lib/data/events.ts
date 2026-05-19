export type ManagedEventStatus = "active" | "draft" | "canceled" | "completed";

export type ManagedEventRecord = {
  id: string;
  name: string;
  status: ManagedEventStatus;
  dateKey?: string;
  startTime?: string;
  venueName: string;
  description?: string;
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

const DEFAULT_EVENTS: ManagedEventRecord[] = [
  {
    id: "seed-abyssal-007",
    name: "ABYSSAL 007",
    status: "active",
    dateKey: "2026-05-24",
    startTime: "22:00",
    venueName: "Sub Club, Melbourne",
    description: "Headline warehouse-style club night with a full four-tier ticket build.",
    artistCount: 5,
    slotCount: 4,
    b2bCount: 1,
    ticketInventory: 900,
    expectedRevenue: 24350,
    totalCosts: 13100,
    projectedProfit: 11250,
    createdAt: "2026-05-01T08:00:00.000Z",
    updatedAt: "2026-05-12T11:15:00.000Z",
  },
  {
    id: "seed-night-shift",
    name: "Night Shift",
    status: "active",
    dateKey: "2026-06-02",
    startTime: "21:00",
    venueName: "Revolver Upstairs, Melbourne",
    description: "Late-night club concept with local support and strong early-bird demand.",
    artistCount: 4,
    slotCount: 4,
    b2bCount: 0,
    ticketInventory: 500,
    expectedRevenue: 12800,
    totalCosts: 7900,
    projectedProfit: 4900,
    createdAt: "2026-05-03T09:30:00.000Z",
    updatedAt: "2026-05-10T14:05:00.000Z",
  },
  {
    id: "seed-warehouse-sessions",
    name: "Warehouse Sessions",
    status: "draft",
    venueName: "Venue TBD",
    description: "Draft concept still waiting on venue confirmation and final lineup lock.",
    artistCount: 0,
    slotCount: 0,
    b2bCount: 0,
    ticketInventory: 0,
    expectedRevenue: 0,
    totalCosts: 0,
    projectedProfit: 0,
    createdAt: "2026-05-09T10:20:00.000Z",
    updatedAt: "2026-05-13T16:45:00.000Z",
  },
  {
    id: "seed-eclipse-open-air",
    name: "Eclipse Open Air",
    status: "canceled",
    dateKey: "2026-04-18",
    startTime: "16:00",
    venueName: "Brown Alley, Melbourne",
    description: "Outdoor concept paused after permit approval timelines shifted.",
    artistCount: 6,
    slotCount: 5,
    b2bCount: 1,
    ticketInventory: 1200,
    expectedRevenue: 0,
    totalCosts: 4200,
    projectedProfit: -4200,
    createdAt: "2026-03-11T07:45:00.000Z",
    updatedAt: "2026-04-01T12:10:00.000Z",
  },
  {
    id: "seed-summer-closing",
    name: "Summer Closing",
    status: "completed",
    dateKey: "2026-02-21",
    startTime: "20:00",
    venueName: "Forum, Melbourne",
    description: "Completed end-of-season show with strong secondary-tier conversion.",
    artistCount: 7,
    slotCount: 6,
    b2bCount: 1,
    ticketInventory: 1500,
    expectedRevenue: 38400,
    totalCosts: 22650,
    projectedProfit: 15750,
    createdAt: "2026-01-06T06:30:00.000Z",
    updatedAt: "2026-02-22T09:00:00.000Z",
  },
  {
    id: "seed-neon-drift",
    name: "Neon Drift",
    status: "active",
    dateKey: "2026-06-14",
    startTime: "23:00",
    venueName: "Brown Alley, Melbourne",
    description: "Peak-time techno night with stacked support and strong member presales.",
    artistCount: 6,
    slotCount: 5,
    b2bCount: 2,
    ticketInventory: 1100,
    expectedRevenue: 19800,
    totalCosts: 11200,
    projectedProfit: 8600,
    createdAt: "2026-05-11T10:00:00.000Z",
    updatedAt: "2026-05-14T09:20:00.000Z",
  },
  {
    id: "seed-pulse-friday",
    name: "Pulse Friday",
    status: "active",
    dateKey: "2026-05-30",
    startTime: "22:30",
    venueName: "Sub Club, Melbourne",
    description: "Weekly Friday residency testing tiered pricing and bar split assumptions.",
    artistCount: 3,
    slotCount: 3,
    b2bCount: 0,
    ticketInventory: 650,
    expectedRevenue: 9200,
    totalCosts: 5400,
    projectedProfit: 3800,
    createdAt: "2026-05-04T12:00:00.000Z",
    updatedAt: "2026-05-12T08:45:00.000Z",
  },
  {
    id: "seed-afterhours-collective",
    name: "Afterhours Collective",
    status: "draft",
    dateKey: "2026-07-04",
    startTime: "04:00",
    venueName: "Revolver Upstairs, Melbourne",
    description: "Early-hours concept draft with lineup and ticket structure still in review.",
    artistCount: 2,
    slotCount: 2,
    b2bCount: 0,
    ticketInventory: 300,
    expectedRevenue: 4500,
    totalCosts: 2800,
    projectedProfit: 1700,
    createdAt: "2026-05-13T15:30:00.000Z",
    updatedAt: "2026-05-15T11:00:00.000Z",
  },
  {
    id: "seed-basement-theory",
    name: "Basement Theory",
    status: "draft",
    venueName: "Venue TBD",
    description: "Underground showcase waiting on final venue lock and artist confirmations.",
    artistCount: 0,
    slotCount: 0,
    b2bCount: 0,
    ticketInventory: 0,
    expectedRevenue: 0,
    totalCosts: 0,
    projectedProfit: 0,
    createdAt: "2026-05-14T18:00:00.000Z",
    updatedAt: "2026-05-14T18:00:00.000Z",
  },
  {
    id: "seed-solstice-open-air",
    name: "Solstice Open Air",
    status: "canceled",
    dateKey: "2026-03-28",
    startTime: "14:00",
    venueName: "Flemington Racecourse, Melbourne",
    description: "Outdoor festival format canceled after weather insurance thresholds changed.",
    artistCount: 12,
    slotCount: 10,
    b2bCount: 2,
    ticketInventory: 4000,
    expectedRevenue: 0,
    totalCosts: 18500,
    projectedProfit: -18500,
    createdAt: "2026-02-01T07:00:00.000Z",
    updatedAt: "2026-03-05T16:30:00.000Z",
  },
  {
    id: "seed-winter-formal",
    name: "Winter Formal",
    status: "completed",
    dateKey: "2026-01-18",
    startTime: "19:00",
    venueName: "Forum, Melbourne",
    description: "Completed seasonal event with strong VIP table uptake and low refund rate.",
    artistCount: 4,
    slotCount: 4,
    b2bCount: 0,
    ticketInventory: 800,
    expectedRevenue: 22100,
    totalCosts: 14300,
    projectedProfit: 7800,
    createdAt: "2025-12-10T09:00:00.000Z",
    updatedAt: "2026-01-19T10:15:00.000Z",
  },
  {
    id: "seed-late-license",
    name: "Late License",
    status: "completed",
    dateKey: "2025-12-31",
    startTime: "21:00",
    venueName: "Revolver Upstairs, Melbourne",
    description: "NYE completed event used to benchmark forecast accuracy against actuals.",
    artistCount: 8,
    slotCount: 7,
    b2bCount: 1,
    ticketInventory: 700,
    expectedRevenue: 31500,
    totalCosts: 19800,
    projectedProfit: 11700,
    createdAt: "2025-11-20T08:00:00.000Z",
    updatedAt: "2026-01-02T12:00:00.000Z",
  },
];

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
    venueName: value.venueName.trim(),
    description: isNonEmptyString(value.description) ? value.description.trim() : undefined,
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

export function loadManagedEvents(): ManagedEventRecord[] {
  if (typeof window === "undefined") {
    return sortManagedEvents(DEFAULT_EVENTS);
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EVENTS));
      return sortManagedEvents(DEFAULT_EVENTS);
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EVENTS));
      return sortManagedEvents(DEFAULT_EVENTS);
    }

    const events = parsed
      .map(parseManagedEventRecord)
      .filter((event): event is ManagedEventRecord => event !== null);

    if (events.length === 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EVENTS));
      return sortManagedEvents(DEFAULT_EVENTS);
    }

    return sortManagedEvents(events);
  } catch {
    return sortManagedEvents(DEFAULT_EVENTS);
  }
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

  saveManagedEvents(next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("promosync:events-updated"));
  }
  return sortManagedEvents(next);
}

