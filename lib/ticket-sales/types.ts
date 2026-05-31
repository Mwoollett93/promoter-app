/** Ticket sales monitoring — provider labels shown in UI. */
export type SalesProvider = "ra" | "eventbrite" | "humanitix" | "other";

export type SalesSourceType = "manual" | "csv" | "api" | "email";

export type SalesSourceStatus = "active" | "connected" | "not_connected" | "placeholder";

export type SalesSource = {
  id: string;
  eventId: string;
  provider: SalesProvider;
  sourceType: SalesSourceType;
  status: SalesSourceStatus;
  label?: string;
  createdAt: string;
  updatedAt: string;
};

export type SalesCheckpoint = {
  id: string;
  eventId: string;
  sourceId: string;
  provider: SalesProvider;
  ticketsSold: number;
  capacity: number;
  grossRevenue: number;
  netRevenue: number;
  fees: number;
  checkedAt: string;
  notes?: string;
  createdAt: string;
};

export type TicketTier = {
  id: string;
  eventId: string;
  name: string;
  price: number;
  capacity: number;
  sold: number;
  revenue: number;
  sourceId?: string;
  updatedAt: string;
};

export type TicketSalesImport = {
  id: string;
  eventId: string;
  sourceId: string;
  filename: string;
  importedAt: string;
  rawRows: Record<string, string>[];
  mappedFields: Record<string, string>;
  totalTickets: number;
  grossRevenue: number;
  netRevenue: number;
  fees: number;
};

export type ManualCheckpointInput = {
  provider: SalesProvider;
  ticketsSold: number;
  capacity: number;
  grossRevenue: number;
  netRevenue: number;
  fees: number;
  checkedAt: string;
  notes?: string;
};

export type CsvFieldKey =
  | "tierName"
  | "ticketsSold"
  | "price"
  | "grossRevenue"
  | "netRevenue"
  | "fees"
  | "capacity";

export type CsvImportInput = {
  provider: SalesProvider;
  filename: string;
  rawRows: Record<string, string>[];
  mappedFields: Record<CsvFieldKey, string | null>;
};

export type TicketSalesSnapshot = {
  sources: SalesSource[];
  checkpoints: SalesCheckpoint[];
  imports: TicketSalesImport[];
  tiers: TicketTier[];
};

export type SalesMetrics = {
  ticketsSold: number;
  capacity: number;
  capacityPct: number;
  grossRevenue: number;
  netRevenue: number;
  fees: number;
  salesVelocity: number | null;
  forecastFinalAttendance: number | null;
};

export type BreakEvenMetrics = {
  totalCosts: number;
  netRevenue: number;
  amountRemaining: number;
  percentToBreakEven: number;
  averageTicketPrice: number;
  ticketsRequiredRemaining: number;
  isBreakEven: boolean;
};

export type SalesChartSeries = {
  ticketsOverTime: Array<{ at: string; value: number }>;
  revenueOverTime: Array<{ at: string; gross: number; net: number }>;
  dailyVelocity: Array<{ date: string; tickets: number }>;
  tierBreakdown: Array<{ name: string; sold: number; revenue: number }>;
};

export const SALES_PROVIDER_LABELS: Record<SalesProvider, string> = {
  ra: "Resident Advisor",
  eventbrite: "Eventbrite",
  humanitix: "Humanitix",
  other: "Other",
};

export const SOURCE_STATUS_LABELS: Record<
  SalesSourceType,
  { label: string; description: string }
> = {
  manual: { label: "Manual tracking", description: "Checkpoints entered by your team" },
  csv: { label: "CSV imported", description: "Reports uploaded from your ticketing platform" },
  api: { label: "Live API connected", description: "Official integration — coming soon" },
  email: { label: "Email report connected", description: "Forwarded sales reports — coming soon" },
};
