import { resetEventWizardForNewEvent, markWizardInProgress } from "./reset-wizard";
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
  resetEventWizardForNewEvent();

  const event = await getWorkspaceEvent(session, eventId, workspaceId);

  setWizardEditingEventId(eventId);

  if (event) {
    hydrateWizardFromEvent(event);
    markWizardInProgress();
    return true;
  }

  if (fallback) {
    hydrateWizardFromManagedSummary({ id: eventId, ...fallback });
    markWizardInProgress();
    return true;
  }

  clearWizardEditingEventId();
  return false;
}
