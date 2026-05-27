import {
  clearWizardEventDraft,
  loadWizardEventDraft,
} from "@/lib/data/wizard-event-draft";
import {
  clearWizardFinanceDraft,
  loadWizardFinanceDraft,
} from "@/lib/data/wizard-finance-draft";
import { buildFinanceDraft, calculateFinanceSummary } from "@/lib/data/wizard-finance-logic";
import { upsertManagedEvent } from "@/lib/data/events";
import {
  ensureDefaultSeason,
  findSeasonForDate,
} from "@/lib/data/seasons";
import {
  clearWizardScheduleSlots,
  loadWizardScheduleSlots,
} from "@/lib/data/wizard-schedule-persist";
import {
  createWorkspaceEvent,
  updateWorkspaceEvent,
  workspaceEventToManaged,
} from "@/lib/supabase/events";
import {
  clearWizardEditingEventId,
  getWizardEditingEventId,
} from "@/lib/event-wizard/wizard-editing-event";
import type { SupabaseSession } from "@/lib/types/artist";
import type { ScheduleSlot } from "@/lib/types/event-schedule";

export const WIZARD_FLUSH_REQUEST = "promosync:wizard-flush-request";

export function requestWizardFlush() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(WIZARD_FLUSH_REQUEST));
}

export function hasWizardProgress() {
  const draft = loadWizardEventDraft();
  return Boolean(draft?.eventName?.trim() || draft?.dateKey);
}

function countUniqueArtists(slots: ScheduleSlot[]) {
  const ids = new Set<string>();
  for (const slot of slots) {
    if (slot.kind === "b2b") {
      for (const id of slot.artistIds) ids.add(id);
    } else {
      ids.add(slot.artistId);
    }
  }
  return ids.size;
}

function countB2b(slots: ScheduleSlot[]) {
  return slots.filter((slot) => slot.kind === "b2b").length;
}

export async function saveWizardProgressAsDraft(
  session: SupabaseSession,
  workspaceId: string,
): Promise<{ ok: true; name: string } | { ok: false; message: string }> {
  requestWizardFlush();
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0);
  });

  const eventDraft = loadWizardEventDraft();
  if (!eventDraft?.eventName?.trim()) {
    return {
      ok: false,
      message: "Enter an event name on Event Basics before saving a draft.",
    };
  }

  const scheduleSlots = loadWizardScheduleSlots() ?? [];
  const financeDraft = buildFinanceDraft({
    stored: loadWizardFinanceDraft(),
    venueCapacity: eventDraft.venueCapacity,
  });
  const artistFees = scheduleSlots.reduce((sum, slot) => sum + slot.feeCents, 0) / 100;
  const financeSummary = calculateFinanceSummary(financeDraft, { artistFees, venueFee: 0 });

  const seasonId =
    eventDraft.seasonId ??
    (eventDraft.dateKey
      ? findSeasonForDate(workspaceId, eventDraft.dateKey)?.id
      : undefined) ??
    ensureDefaultSeason(workspaceId).id;

  const payload = {
    workspaceId,
    name: eventDraft.eventName.trim(),
    status: "draft" as const,
    venueId: eventDraft.venueId ?? null,
    venueName: eventDraft.venueName ?? "Venue TBD",
    description: eventDraft.description,
    dateKey: eventDraft.dateKey,
    startTime: eventDraft.startTime,
    seasonId,
    artistCount: countUniqueArtists(scheduleSlots),
    slotCount: scheduleSlots.length,
    b2bCount: countB2b(scheduleSlots),
    ticketInventory: financeDraft.ticketInventory,
    expectedRevenue: financeSummary.expectedRevenue,
    totalCosts: financeSummary.totalCosts,
    projectedProfit: financeSummary.projectedProfit,
    scheduleJson: scheduleSlots,
    financeJson: financeDraft as unknown as Record<string, unknown>,
  };

  try {
    const editingId = getWizardEditingEventId();
    const saved = editingId
      ? await updateWorkspaceEvent(session, editingId, payload)
      : await createWorkspaceEvent(session, payload);

    clearWizardEventDraft();
    clearWizardScheduleSlots();
    clearWizardFinanceDraft();
    clearWizardEditingEventId();
    upsertManagedEvent({ ...workspaceEventToManaged(saved), seasonId });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("promosync:events-updated"));
    }

    return { ok: true, name: saved.name };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Unable to save draft event.",
    };
  }
}
