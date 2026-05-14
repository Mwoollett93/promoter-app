import type { B2BSlot, ScheduleSlot, SingleSlot } from "../types/event-schedule";

const STORAGE_KEY = "promosync:wizard-schedule";

type WizardScheduleV1 = {
  v: 1;
  slots: ScheduleSlot[];
};

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.length > 0;
}

function isFiniteNumber(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

function parseSingleSlot(raw: unknown): SingleSlot | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.kind !== "single") return null;
  if (!isNonEmptyString(o.slotId) || !isNonEmptyString(o.artistId)) return null;
  if (!isFiniteNumber(o.durationMinutes) || !isFiniteNumber(o.feeCents)) return null;
  if (o.durationMinutes <= 0) return null;
  if (o.feeCents < 0) return null;
  return {
    kind: "single",
    slotId: o.slotId,
    artistId: o.artistId,
    durationMinutes: o.durationMinutes,
    feeCents: Math.round(o.feeCents),
  };
}

function parseB2BSlot(raw: unknown): B2BSlot | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.kind !== "b2b") return null;
  if (!isNonEmptyString(o.slotId)) return null;
  if (!Array.isArray(o.artistIds) || o.artistIds.length === 0) return null;
  const ids = o.artistIds.filter((id): id is string => isNonEmptyString(id));
  if (ids.length !== o.artistIds.length) return null;
  if (!isFiniteNumber(o.durationMinutes) || !isFiniteNumber(o.feeCents)) return null;
  if (o.durationMinutes <= 0) return null;
  if (o.feeCents < 0) return null;
  return {
    kind: "b2b",
    slotId: o.slotId,
    artistIds: ids,
    durationMinutes: o.durationMinutes,
    feeCents: Math.round(o.feeCents),
  };
}

function parseScheduleSlot(raw: unknown): ScheduleSlot | null {
  if (!raw || typeof raw !== "object") return null;
  const kind = (raw as { kind?: unknown }).kind;
  if (kind === "single") return parseSingleSlot(raw);
  if (kind === "b2b") return parseB2BSlot(raw);
  return null;
}

/**
 * Restore lineup rows saved from the Lineup & Schedule step (`sessionStorage`).
 * Returns `null` if nothing valid is stored (use fixtures / initial API).
 */
export function loadWizardScheduleSlots(): ScheduleSlot[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WizardScheduleV1>;
    if (parsed?.v !== 1 || !Array.isArray(parsed.slots)) return null;
    const slots: ScheduleSlot[] = [];
    for (const item of parsed.slots) {
      const slot = parseScheduleSlot(item);
      if (!slot) return null;
      slots.push(slot);
    }
    return slots;
  } catch {
    return null;
  }
}

/**
 * Persist schedule edits so navigating Event Basics ↔ Lineup does not lose work.
 */
export function saveWizardScheduleSlots(slots: ScheduleSlot[]): void {
  if (typeof window === "undefined") return;
  const payload: WizardScheduleV1 = { v: 1, slots };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}
