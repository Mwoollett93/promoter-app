import { newId } from "@/lib/collaboration/local-store";

const STORAGE_KEY = "promosync:seasons";

export type SeasonRecord = {
  id: string;
  workspaceId: string;
  name: string;
  /** YYYY-MM-DD */
  startDateKey: string;
  /** YYYY-MM-DD */
  endDateKey: string;
  description?: string;
  /** Optional season profit target in major currency units */
  targetProfit?: number;
  createdAt: string;
  updatedAt: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function dateKeyFromDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseDateKey(dateKey: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(y, mo, day);
  if (d.getFullYear() !== y || d.getMonth() !== mo || d.getDate() !== day) return null;
  return d;
}

function loadAll(): Record<string, SeasonRecord[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, SeasonRecord[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, SeasonRecord[]>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event("promosync:seasons-updated"));
  } catch {
    /* quota */
  }
}

export function loadSeasons(workspaceId: string): SeasonRecord[] {
  const list = loadAll()[workspaceId] ?? [];
  return [...list].sort((a, b) => a.startDateKey.localeCompare(b.startDateKey));
}

export function saveSeasons(workspaceId: string, seasons: SeasonRecord[]) {
  const all = loadAll();
  all[workspaceId] = seasons;
  saveAll(all);
}

export function upsertSeason(season: SeasonRecord): SeasonRecord {
  const list = loadSeasons(season.workspaceId);
  const index = list.findIndex((s) => s.id === season.id);
  const next =
    index === -1
      ? [...list, season]
      : list.map((s, i) => (i === index ? season : s));
  saveSeasons(season.workspaceId, next);
  return season;
}

export function deleteSeason(workspaceId: string, seasonId: string) {
  saveSeasons(
    workspaceId,
    loadSeasons(workspaceId).filter((s) => s.id !== seasonId),
  );
}

/** Default season label for a calendar quarter. */
export function defaultSeasonName(start: Date) {
  const q = Math.floor(start.getMonth() / 3) + 1;
  return `Q${q} ${start.getFullYear()}`;
}

export function quarterBounds(year: number, quarter: 1 | 2 | 3 | 4) {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0);
  return { startDateKey: dateKeyFromDate(start), endDateKey: dateKeyFromDate(end) };
}

export function currentQuarter(): { year: number; quarter: 1 | 2 | 3 | 4 } {
  const now = new Date();
  return { year: now.getFullYear(), quarter: (Math.floor(now.getMonth() / 3) + 1) as 1 | 2 | 3 | 4 };
}

/** Ensure at least one season exists for the workspace (current quarter). */
export function ensureDefaultSeason(workspaceId: string): SeasonRecord {
  const existing = loadSeasons(workspaceId);
  if (existing.length > 0) return existing[existing.length - 1]!;

  const { year, quarter } = currentQuarter();
  const bounds = quarterBounds(year, quarter);
  const now = new Date().toISOString();
  const season: SeasonRecord = {
    id: newId(),
    workspaceId,
    name: defaultSeasonName(new Date(year, (quarter - 1) * 3, 1)),
    startDateKey: bounds.startDateKey,
    endDateKey: bounds.endDateKey,
    createdAt: now,
    updatedAt: now,
  };
  upsertSeason(season);
  return season;
}

export function createSeason(input: {
  workspaceId: string;
  name: string;
  startDateKey: string;
  endDateKey: string;
  description?: string;
  targetProfit?: number;
}): SeasonRecord {
  const now = new Date().toISOString();
  return upsertSeason({
    id: newId(),
    workspaceId: input.workspaceId,
    name: input.name.trim(),
    startDateKey: input.startDateKey,
    endDateKey: input.endDateKey,
    description: input.description?.trim() || undefined,
    targetProfit: input.targetProfit,
    createdAt: now,
    updatedAt: now,
  });
}

export function seasonContainsDate(season: SeasonRecord, dateKey: string) {
  return dateKey >= season.startDateKey && dateKey <= season.endDateKey;
}

export function findSeasonForDate(workspaceId: string, dateKey: string): SeasonRecord | null {
  const seasons = loadSeasons(workspaceId);
  return seasons.find((s) => seasonContainsDate(s, dateKey)) ?? null;
}
