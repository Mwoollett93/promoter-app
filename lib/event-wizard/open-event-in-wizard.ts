import { clearWizardEventDraft } from "@/lib/data/wizard-event-draft";
import { clearWizardFinanceDraft } from "@/lib/data/wizard-finance-draft";
import { clearWizardScheduleSlots } from "@/lib/data/wizard-schedule-persist";
import { getWorkspaceEvent } from "@/lib/supabase/events";
import type { SupabaseSession } from "@/lib/types/artist";

import { hydrateWizardFromEvent, hydrateWizardFromManagedSummary } from "./hydrate-wizard-from-event";
import {
  clearWizardEditingEventId,
  setWizardEditingEventId,
} from "./wizard-editing-event";

export async function prepareEventForWizardEdit(
  session: SupabaseSession,
  workspaceId: string,
  eventId: string,
  fallback?: {
    name: string;
    dateKey?: string;
    startTime?: string;
    venueId?: string;
    venueName: string;
    description?: string;
  },
): Promise<boolean> {
  clearWizardEventDraft();
  clearWizardScheduleSlots();
  clearWizardFinanceDraft();
  clearWizardEditingEventId();

  const event = await getWorkspaceEvent(session, eventId, workspaceId);

  setWizardEditingEventId(eventId);

  if (event) {
    hydrateWizardFromEvent(event);
    return true;
  }

  if (fallback) {
    hydrateWizardFromManagedSummary({ id: eventId, ...fallback });
    return true;
  }

  clearWizardEditingEventId();
  return false;
}
