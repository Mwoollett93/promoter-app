import { clearWizardEventDraft } from "@/lib/data/wizard-event-draft";
import { clearWizardFinanceDraft } from "@/lib/data/wizard-finance-draft";
import { clearWizardScheduleSlots } from "@/lib/data/wizard-schedule-persist";

import { clearWizardEditingEventId } from "./wizard-editing-event";

const WIZARD_IN_PROGRESS_KEY = "promosync:wizard-in-progress";
/** Bump when wizard session shape/defaults change so stale drafts are cleared once. */
const WIZARD_STORAGE_VERSION = "2";
const WIZARD_STORAGE_VERSION_KEY = "promosync:wizard-storage-version";

/** Clear all wizard session data when starting a brand-new event. */
export function resetEventWizardForNewEvent() {
  clearWizardEventDraft();
  clearWizardScheduleSlots();
  clearWizardFinanceDraft();
  clearWizardEditingEventId();
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(WIZARD_IN_PROGRESS_KEY);
    } catch {
      /* ignore */
    }
  }
}

export function markWizardInProgress() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(WIZARD_IN_PROGRESS_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function isWizardInProgress(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(WIZARD_IN_PROGRESS_KEY) === "1";
  } catch {
    return false;
  }
}

/** One-time migration: clears legacy demo/test wizard data from earlier builds. */
export function ensureWizardStorageVersion() {
  if (typeof window === "undefined") return;
  try {
    const current = sessionStorage.getItem(WIZARD_STORAGE_VERSION_KEY);
    if (current === WIZARD_STORAGE_VERSION) return;
    resetEventWizardForNewEvent();
    sessionStorage.setItem(WIZARD_STORAGE_VERSION_KEY, WIZARD_STORAGE_VERSION);
  } catch {
    /* ignore */
  }
}
