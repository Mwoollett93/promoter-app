import {
  aggregateMappedRows,
  mapCsvRows,
  type MappedCsvRow,
} from "./csv-parser";
import { localTicketSalesStore } from "./storage";
import type {
  CsvImportInput,
  ManualCheckpointInput,
  SalesCheckpoint,
  SalesProvider,
  SalesSource,
  TicketSalesImport,
  TicketSalesSnapshot,
  TicketTier,
} from "./types";

function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function ensureManualSource(eventId: string, provider: SalesProvider): SalesSource {
  const snapshot = localTicketSalesStore.load(eventId);
  const existing = snapshot.sources.find(
    (s) => s.sourceType === "manual" && s.provider === provider,
  );
  if (existing) {
    const updated: SalesSource = { ...existing, status: "active", updatedAt: nowIso() };
    localTicketSalesStore.saveSource(eventId, updated);
    return updated;
  }

  const source: SalesSource = {
    id: newId("src"),
    eventId,
    provider,
    sourceType: "manual",
    status: "active",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  localTicketSalesStore.saveSource(eventId, source);
  return source;
}

function ensureCsvSource(eventId: string, provider: SalesProvider): SalesSource {
  const snapshot = localTicketSalesStore.load(eventId);
  const existing = snapshot.sources.find(
    (s) => s.sourceType === "csv" && s.provider === provider,
  );
  if (existing) {
    const updated: SalesSource = { ...existing, status: "active", updatedAt: nowIso() };
    localTicketSalesStore.saveSource(eventId, updated);
    return updated;
  }

  const source: SalesSource = {
    id: newId("src"),
    eventId,
    provider,
    sourceType: "csv",
    status: "active",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  localTicketSalesStore.saveSource(eventId, source);
  return source;
}

function ensurePlaceholderSources(eventId: string) {
  const snapshot = localTicketSalesStore.load(eventId);
  for (const sourceType of ["api", "email"] as const) {
    if (!snapshot.sources.some((s) => s.sourceType === sourceType)) {
      localTicketSalesStore.saveSource(eventId, {
        id: newId("src"),
        eventId,
        provider: "other",
        sourceType,
        status: "placeholder",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    }
  }
}

export function loadTicketSales(eventId: string): TicketSalesSnapshot {
  ensurePlaceholderSources(eventId);
  return localTicketSalesStore.load(eventId);
}

export function addManualCheckpoint(
  eventId: string,
  input: ManualCheckpointInput,
): SalesCheckpoint {
  const source = ensureManualSource(eventId, input.provider);
  const checkpoint: SalesCheckpoint = {
    id: newId("cp"),
    eventId,
    sourceId: source.id,
    provider: input.provider,
    ticketsSold: Math.max(0, Math.round(input.ticketsSold)),
    capacity: Math.max(0, Math.round(input.capacity)),
    grossRevenue: Math.max(0, input.grossRevenue),
    netRevenue: Math.max(0, input.netRevenue),
    fees: Math.max(0, input.fees),
    checkedAt: input.checkedAt,
    notes: input.notes?.trim() || undefined,
    createdAt: nowIso(),
  };
  localTicketSalesStore.saveCheckpoint(eventId, checkpoint);
  return checkpoint;
}

function mappedRowsToTiers(
  eventId: string,
  sourceId: string,
  rows: MappedCsvRow[],
): TicketTier[] {
  const ts = nowIso();
  return rows.map((row) => ({
    id: newId("tier"),
    eventId,
    sourceId,
    name: row.tierName,
    price: row.price,
    capacity: row.capacity || row.ticketsSold,
    sold: row.ticketsSold,
    revenue: row.grossRevenue,
    updatedAt: ts,
  }));
}

export function importTicketSalesCsv(
  eventId: string,
  input: CsvImportInput,
): { import: TicketSalesImport; checkpoint: SalesCheckpoint; tiers: TicketTier[] } {
  const source = ensureCsvSource(eventId, input.provider);
  const mapped = mapCsvRows(input.rawRows, input.mappedFields);
  const totals = aggregateMappedRows(mapped);

  const importRecord: TicketSalesImport = {
    id: newId("imp"),
    eventId,
    sourceId: source.id,
    filename: input.filename,
    importedAt: nowIso(),
    rawRows: input.rawRows,
  mappedFields: Object.fromEntries(
      Object.entries(input.mappedFields).filter(([, v]) => v != null),
    ) as Record<string, string>,
    totalTickets: totals.totalTickets,
    grossRevenue: totals.grossRevenue,
    netRevenue: totals.netRevenue,
    fees: totals.fees,
  };
  localTicketSalesStore.saveImport(eventId, importRecord);

  const tiers = mappedRowsToTiers(eventId, source.id, mapped);
  const snapshot = localTicketSalesStore.load(eventId);
  localTicketSalesStore.saveTiers(eventId, [...snapshot.tiers, ...tiers]);

  const checkpoint = addManualCheckpoint(eventId, {
    provider: input.provider,
    ticketsSold: totals.totalTickets,
    capacity: totals.capacity,
    grossRevenue: totals.grossRevenue,
    netRevenue: totals.netRevenue,
    fees: totals.fees,
    checkedAt: nowIso(),
    notes: `CSV import: ${input.filename}`,
  });

  return { import: importRecord, checkpoint, tiers };
}

/** Future: swap implementation to call Supabase RPC / REST. */
export const ticketSalesRepository = {
  load: loadTicketSales,
  addManualCheckpoint,
  importTicketSalesCsv,
};
