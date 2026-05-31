import type {
  SalesCheckpoint,
  SalesSource,
  TicketSalesImport,
  TicketSalesSnapshot,
  TicketTier,
} from "./types";

const STORAGE_PREFIX = "promosync:ticket-sales:";

function storageKey(eventId: string) {
  return `${STORAGE_PREFIX}${eventId}`;
}

const EMPTY: TicketSalesSnapshot = {
  sources: [],
  checkpoints: [],
  imports: [],
  tiers: [],
};

export function loadTicketSalesSnapshot(eventId: string): TicketSalesSnapshot {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(storageKey(eventId));
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<TicketSalesSnapshot>;
    return {
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      checkpoints: Array.isArray(parsed.checkpoints) ? parsed.checkpoints : [],
      imports: Array.isArray(parsed.imports) ? parsed.imports : [],
      tiers: Array.isArray(parsed.tiers) ? parsed.tiers : [],
    };
  } catch {
    return EMPTY;
  }
}

export function saveTicketSalesSnapshot(eventId: string, snapshot: TicketSalesSnapshot) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(eventId), JSON.stringify(snapshot));
  } catch {
    /* quota */
  }
}

export function upsertSource(eventId: string, source: SalesSource) {
  const snapshot = loadTicketSalesSnapshot(eventId);
  const index = snapshot.sources.findIndex((s) => s.id === source.id);
  snapshot.sources =
    index === -1
      ? [...snapshot.sources, source]
      : snapshot.sources.map((s, i) => (i === index ? source : s));
  saveTicketSalesSnapshot(eventId, snapshot);
  return source;
}

export function appendCheckpoint(eventId: string, checkpoint: SalesCheckpoint) {
  const snapshot = loadTicketSalesSnapshot(eventId);
  snapshot.checkpoints = [...snapshot.checkpoints, checkpoint].sort(
    (a, b) => new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime(),
  );
  saveTicketSalesSnapshot(eventId, snapshot);
  return checkpoint;
}

export function appendImport(eventId: string, record: TicketSalesImport) {
  const snapshot = loadTicketSalesSnapshot(eventId);
  snapshot.imports = [...snapshot.imports, record];
  saveTicketSalesSnapshot(eventId, snapshot);
  return record;
}

export function replaceTiers(eventId: string, tiers: TicketTier[]) {
  const snapshot = loadTicketSalesSnapshot(eventId);
  snapshot.tiers = tiers;
  saveTicketSalesSnapshot(eventId, snapshot);
  return tiers;
}

/** Swap for Supabase-backed repository when tables are live. */
export type TicketSalesStore = {
  load(eventId: string): TicketSalesSnapshot;
  saveCheckpoint(eventId: string, checkpoint: SalesCheckpoint): SalesCheckpoint;
  saveImport(eventId: string, record: TicketSalesImport): TicketSalesImport;
  saveSource(eventId: string, source: SalesSource): SalesSource;
  saveTiers(eventId: string, tiers: TicketTier[]): TicketTier[];
};

export const localTicketSalesStore: TicketSalesStore = {
  load: loadTicketSalesSnapshot,
  saveCheckpoint: appendCheckpoint,
  saveImport: appendImport,
  saveSource: upsertSource,
  saveTiers: replaceTiers,
};
