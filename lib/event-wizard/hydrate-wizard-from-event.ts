import { saveWizardEventDraft } from "@/lib/data/wizard-event-draft";
import {
  saveWizardFinanceDraft,
  type WizardFinanceDraftV1,
} from "@/lib/data/wizard-finance-draft";
import { saveWizardScheduleSlots } from "@/lib/data/wizard-schedule-persist";
import type { WorkspaceEvent } from "@/lib/types/collaboration";
import type { ScheduleSlot } from "@/lib/types/event-schedule";

function parseDateKey(dateKey: string): Date | null {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function parseScheduleSlots(raw: unknown[]): ScheduleSlot[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw as ScheduleSlot[];
}

function parseFinanceDraft(raw: Record<string, unknown>): WizardFinanceDraftV1 | null {
  if (
    typeof raw.ticketInventory !== "number" ||
    !Array.isArray(raw.costs) ||
    !Array.isArray(raw.tiers)
  ) {
    return null;
  }

  return {
    v: 1,
    ticketInventory: Math.max(0, Math.round(raw.ticketInventory)),
    costs: raw.costs as WizardFinanceDraftV1["costs"],
    tiers: raw.tiers as WizardFinanceDraftV1["tiers"],
  };
}

/** Load a saved workspace event into wizard session storage for editing. */
export function hydrateWizardFromEvent(event: WorkspaceEvent) {
  if (event.dateKey) {
    const date = parseDateKey(event.dateKey);
    if (date) {
      saveWizardEventDraft({
        date,
        startTime: event.startTime ?? "22:00",
        eventName: event.name,
        venueId: event.venueId ?? undefined,
        venueName: event.venueName,
        description: event.description ?? undefined,
      });
    } else {
      saveWizardEventDraft({
        date: new Date(),
        startTime: event.startTime ?? "22:00",
        eventName: event.name,
        venueId: event.venueId ?? undefined,
        venueName: event.venueName,
        description: event.description ?? undefined,
      });
    }
  } else if (event.name) {
    const today = new Date();
    saveWizardEventDraft({
      date: today,
      startTime: event.startTime ?? "22:00",
      eventName: event.name,
      venueId: event.venueId ?? undefined,
      venueName: event.venueName,
      description: event.description ?? undefined,
    });
  }

  const slots = parseScheduleSlots(event.scheduleJson);
  if (slots.length > 0) {
    saveWizardScheduleSlots(slots);
  }

  const finance = parseFinanceDraft(event.financeJson ?? {});
  if (finance) {
    saveWizardFinanceDraft(finance);
  }
}

/** Convenience when only managed list fields are available (local cache). */
export function hydrateWizardFromManagedSummary(input: {
  id: string;
  name: string;
  dateKey?: string;
  startTime?: string;
  venueId?: string;
  venueName: string;
  description?: string;
}) {
  const date = input.dateKey ? parseDateKey(input.dateKey) : new Date();
  if (!date) return;

  saveWizardEventDraft({
    date,
    startTime: input.startTime ?? "22:00",
    eventName: input.name,
    venueId: input.venueId,
    venueName: input.venueName,
    description: input.description,
  });
}
