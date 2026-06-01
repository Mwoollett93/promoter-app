import { upsertManagedEvent } from "@/lib/data/events";
import {
  createWorkspaceEvent,
  listWorkspaceEvents,
  workspaceEventToManaged,
  type CreateEventPayload,
} from "@/lib/supabase/events";
import type { SupabaseSession } from "@/lib/types/artist";

export const BETA_SAMPLE_EVENT_NAME = "Beta Launch Night (Sample)";
const BETA_SAMPLE_MARKER_KEY = "betaSample";

function formatDateKey(daysFromNow: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildSamplePayload(workspaceId: string): CreateEventPayload {
  return {
    workspaceId,
    name: BETA_SAMPLE_EVENT_NAME,
    status: "draft",
    venueName: "The Warehouse",
    description:
      "Sample event for beta testing — explore the event workspace, run overview, and tasks without creating a show from scratch.",
    dateKey: formatDateKey(14),
    startTime: "22:00",
    artistCount: 4,
    slotCount: 5,
    b2bCount: 0,
    ticketInventory: 400,
    expectedRevenue: 12000,
    totalCosts: 6500,
    projectedProfit: 5500,
    scheduleJson: [],
    financeJson: {},
    seasonId: null,
  };
}

export async function betaSampleEventExists(
  session: SupabaseSession,
  workspaceId: string,
): Promise<boolean> {
  const events = await listWorkspaceEvents(session, workspaceId);
  return events.some(
    (event) =>
      event.name === BETA_SAMPLE_EVENT_NAME ||
      event.planningJson?.[BETA_SAMPLE_MARKER_KEY] === true ||
      (event.financeJson as Record<string, unknown> | undefined)?.[BETA_SAMPLE_MARKER_KEY] === true,
  );
}

export type CreateBetaSampleEventResult =
  | { ok: true; created: true; name: string }
  | { ok: true; created: false; name: string }
  | { ok: false; message: string };

export async function createBetaSampleEvent(
  session: SupabaseSession,
  workspaceId: string,
): Promise<CreateBetaSampleEventResult> {
  if (await betaSampleEventExists(session, workspaceId)) {
    return { ok: true, created: false, name: BETA_SAMPLE_EVENT_NAME };
  }

  const payload = buildSamplePayload(workspaceId);

  try {
    const created = await createWorkspaceEvent(session, {
      ...payload,
      financeJson: { [BETA_SAMPLE_MARKER_KEY]: true },
    });

    upsertManagedEvent(workspaceEventToManaged(created));

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("promosync:events-updated"));
    }

    return { ok: true, created: true, name: created.name };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Unable to create sample event.",
    };
  }
}
