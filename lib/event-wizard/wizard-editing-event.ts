const STORAGE_KEY = "promosync:wizard-editing-event-id";

export function setWizardEditingEventId(eventId: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, eventId);
  } catch {
    /* ignore */
  }
}

export function getWizardEditingEventId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const id = sessionStorage.getItem(STORAGE_KEY);
    return id?.trim() || null;
  } catch {
    return null;
  }
}

export function clearWizardEditingEventId() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
