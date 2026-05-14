import { getEventStartForWizard } from "./event-context";

const STORAGE_KEY = "promosync:wizard-event-draft";

export type WizardEventDraftV1 = {
  v: 1;
  /** Local calendar date YYYY-MM-DD (from `Date` in the viewer's timezone). */
  dateKey: string;
  /** 24h `HH:mm` as entered on Event Basics. */
  startTime: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Encode a calendar day in the local timezone (stable round-trip with parse). */
export function dateKeyFromLocalDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseDateKey(dateKey: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(day)) return null;
  const d = new Date(y, mo, day);
  if (d.getFullYear() !== y || d.getMonth() !== mo || d.getDate() !== day) return null;
  return d;
}

/** Combine local calendar day + `HH:mm` into a single `Date`. */
export function localDateTimeFromParts(day: Date, time24: string): Date | null {
  const [hRaw, mRaw] = time24.trim().split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0);
}

/**
 * Persist Event Basics date + start time for the Lineup step.
 * Call on Continue from Event Basics (client only).
 */
export function saveWizardEventDraft(input: { date?: Date; startTime: string }): void {
  if (typeof window === "undefined" || !input.date) return;
  const payload: WizardEventDraftV1 = {
    v: 1,
    dateKey: dateKeyFromLocalDate(input.date),
    startTime: input.startTime.trim(),
  };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

function loadWizardEventDraft(): WizardEventDraftV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WizardEventDraftV1>;
    if (parsed?.v !== 1 || typeof parsed.dateKey !== "string" || typeof parsed.startTime !== "string") {
      return null;
    }
    return { v: 1, dateKey: parsed.dateKey, startTime: parsed.startTime };
  } catch {
    return null;
  }
}

/**
 * Event door time from Event Basics if the user saved a draft; otherwise `null`.
 */
export function tryWizardEventStartFromStorage(): Date | null {
  const draft = loadWizardEventDraft();
  if (!draft) return null;
  const day = parseDateKey(draft.dateKey);
  if (!day) return null;
  return localDateTimeFromParts(day, draft.startTime);
}

/**
 * Lineup & Schedule: prefer Event Basics draft, else demo default from {@link getEventStartForWizard}.
 */
export function getWizardEventStartOrFallback(): Date {
  return tryWizardEventStartFromStorage() ?? getEventStartForWizard();
}
