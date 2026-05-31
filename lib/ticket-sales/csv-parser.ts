import type { CsvFieldKey } from "./types";

export type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
};

/** Minimal RFC-style CSV parse (handles quoted fields). */
export function parseCsvText(text: string): ParsedCsv {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = splitCsvLine(lines[0]).map(normalizeHeader);
  const rows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = (cells[index] ?? "").trim();
    });
    return row;
  });

  return { headers, rows: rows.filter((row) => Object.values(row).some(Boolean)) };
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

/** Known header aliases per platform — extend when official mappings are defined. */
export const CSV_FIELD_ALIASES: Record<CsvFieldKey, string[]> = {
  tierName: ["tier", "tier_name", "ticket_type", "ticket_name", "name", "product", "listing"],
  ticketsSold: ["tickets_sold", "sold", "quantity", "qty", "units", "tickets", "sales_count"],
  price: ["price", "unit_price", "ticket_price", "face_value"],
  grossRevenue: ["gross_revenue", "gross", "revenue", "total_revenue", "sales_total"],
  netRevenue: ["net_revenue", "net", "payout", "organiser_revenue", "organizer_revenue"],
  fees: ["fees", "booking_fee", "service_fee", "platform_fee", "fee_total"],
  capacity: ["capacity", "allocation", "max_tickets", "inventory"],
};

export function autoDetectFieldMapping(headers: string[]): Record<CsvFieldKey, string | null> {
  const mapping = {} as Record<CsvFieldKey, string | null>;
  for (const key of Object.keys(CSV_FIELD_ALIASES) as CsvFieldKey[]) {
    const aliases = CSV_FIELD_ALIASES[key];
    mapping[key] = headers.find((header) => aliases.includes(header)) ?? null;
  }
  return mapping;
}

export function parseNumber(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

export type MappedCsvRow = {
  tierName: string;
  ticketsSold: number;
  price: number;
  grossRevenue: number;
  netRevenue: number;
  fees: number;
  capacity: number;
};

export function mapCsvRows(
  rows: Record<string, string>[],
  mapping: Record<CsvFieldKey, string | null>,
): MappedCsvRow[] {
  return rows.map((row) => {
    const pick = (key: CsvFieldKey) => {
      const header = mapping[key];
      return header ? row[header] ?? "" : "";
    };

    const ticketsSold = parseNumber(pick("ticketsSold"));
    const price = parseNumber(pick("price"));
    const gross = parseNumber(pick("grossRevenue"));
    const net = parseNumber(pick("netRevenue"));
    const fees = parseNumber(pick("fees"));

    return {
      tierName: pick("tierName") || "General",
      ticketsSold,
      price,
      grossRevenue: gross || ticketsSold * price,
      netRevenue: net || Math.max(0, gross - fees),
      fees,
      capacity: parseNumber(pick("capacity")),
    };
  });
}

export function aggregateMappedRows(rows: MappedCsvRow[]) {
  const totalTickets = rows.reduce((sum, row) => sum + row.ticketsSold, 0);
  const grossRevenue = rows.reduce((sum, row) => sum + row.grossRevenue, 0);
  const netRevenue = rows.reduce((sum, row) => sum + row.netRevenue, 0);
  const fees = rows.reduce((sum, row) => sum + row.fees, 0);
  const capacity = rows.reduce((sum, row) => sum + (row.capacity || row.ticketsSold), 0);

  return { totalTickets, grossRevenue, netRevenue, fees, capacity };
}
