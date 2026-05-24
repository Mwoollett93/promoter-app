import {
  loadLocalEvents,
  newId,
  saveLocalEvents,
} from "@/lib/collaboration/local-store";
import type { ManagedEventRecord, ManagedEventStatus } from "@/lib/data/events";
import type { SupabaseSession } from "@/lib/types/artist";
import type { WorkspaceEvent } from "@/lib/types/collaboration";

import {
  markLocalCollaborationMode,
  shouldUseLocalCollaboration,
} from "@/lib/collaboration/storage-mode";
import { isUuid, supabaseRest } from "./client-rest";

type EventRow = {
  id: string;
  workspace_id: string;
  created_by: string;
  name: string;
  status: "draft" | "active" | "canceled" | "completed";
  venue_id: string | null;
  venue_name: string;
  description: string | null;
  date_key: string | null;
  start_time: string | null;
  starts_at: string | null;
  artist_count: number;
  slot_count: number;
  b2b_count: number;
  ticket_inventory: number;
  expected_revenue: number;
  total_costs: number;
  projected_profit: number;
  schedule_json: unknown[];
  finance_json: Record<string, unknown>;
  planning_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CreateEventPayload = {
  workspaceId: string;
  name: string;
  status: ManagedEventStatus;
  venueId?: string | null;
  venueName: string;
  description?: string;
  dateKey?: string;
  startTime?: string;
  artistCount: number;
  slotCount: number;
  b2bCount: number;
  ticketInventory: number;
  expectedRevenue: number;
  totalCosts: number;
  projectedProfit: number;
  scheduleJson?: unknown[];
  financeJson?: Record<string, unknown>;
};

function mapRow(row: EventRow): WorkspaceEvent {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    name: row.name,
    status: row.status,
    venueId: row.venue_id,
    venueName: row.venue_name,
    description: row.description,
    dateKey: row.date_key,
    startTime: row.start_time,
    startsAt: row.starts_at,
    artistCount: row.artist_count,
    slotCount: row.slot_count,
    b2bCount: row.b2b_count,
    ticketInventory: row.ticket_inventory,
    expectedRevenue: Number(row.expected_revenue),
    totalCosts: Number(row.total_costs),
    projectedProfit: Number(row.projected_profit),
    scheduleJson: row.schedule_json ?? [],
    financeJson: row.finance_json ?? {},
    planningJson: row.planning_json ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function workspaceEventToManaged(event: WorkspaceEvent): ManagedEventRecord {
  return {
    id: event.id,
    name: event.name,
    status: event.status,
    dateKey: event.dateKey ?? undefined,
    startTime: event.startTime ?? undefined,
    venueId: event.venueId ?? undefined,
    venueName: event.venueName,
    description: event.description ?? undefined,
    artistCount: event.artistCount,
    slotCount: event.slotCount,
    b2bCount: event.b2bCount,
    ticketInventory: event.ticketInventory,
    expectedRevenue: event.expectedRevenue,
    totalCosts: event.totalCosts,
    projectedProfit: event.projectedProfit,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

function buildStartsAt(dateKey?: string, startTime?: string) {
  if (!dateKey) return null;
  const time = startTime ?? "00:00";
  const iso = `${dateKey}T${time}:00`;
  const parsed = Date.parse(iso);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

export async function listWorkspaceEvents(
  session: SupabaseSession,
  workspaceId: string,
): Promise<WorkspaceEvent[]> {
  if (shouldUseLocalCollaboration(session, workspaceId)) {
    return loadLocalEvents(workspaceId).sort(
      (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
    );
  }

  try {
    const rows = await supabaseRest<EventRow[]>(
      `events?workspace_id=eq.${workspaceId}&order=updated_at.desc`,
      session,
    );
    return rows.map(mapRow);
  } catch {
    return loadLocalEvents(workspaceId);
  }
}

export async function getWorkspaceEvent(
  session: SupabaseSession,
  eventId: string,
  workspaceId?: string,
): Promise<WorkspaceEvent | null> {
  if (shouldUseLocalCollaboration(session, workspaceId)) {
    if (workspaceId) {
      return loadLocalEvents(workspaceId).find((e) => e.id === eventId) ?? null;
    }
    if (typeof window !== "undefined") {
      for (const key of Object.keys(localStorage)) {
        if (!key.startsWith("promosync:collab:events:")) continue;
        const wsId = key.replace("promosync:collab:events:", "");
        const found = loadLocalEvents(wsId).find((e) => e.id === eventId);
        if (found) return found;
      }
    }
    return null;
  }

  if (!isUuid(eventId)) return null;

  try {
    const rows = await supabaseRest<EventRow[]>(`events?id=eq.${eventId}&limit=1`, session);
    return rows[0] ? mapRow(rows[0]) : null;
  } catch {
    return null;
  }
}

export async function createWorkspaceEvent(
  session: SupabaseSession,
  payload: CreateEventPayload,
): Promise<WorkspaceEvent> {
  const now = new Date().toISOString();
  const startsAt = buildStartsAt(payload.dateKey, payload.startTime);

  if (shouldUseLocalCollaboration(session, payload.workspaceId)) {
    const event: WorkspaceEvent = {
      id: newId(),
      workspaceId: payload.workspaceId,
      createdBy: session.user.id,
      name: payload.name,
      status: payload.status,
      venueId: payload.venueId ?? null,
      venueName: payload.venueName,
      description: payload.description ?? null,
      dateKey: payload.dateKey ?? null,
      startTime: payload.startTime ?? null,
      startsAt,
      artistCount: payload.artistCount,
      slotCount: payload.slotCount,
      b2bCount: payload.b2bCount,
      ticketInventory: payload.ticketInventory,
      expectedRevenue: payload.expectedRevenue,
      totalCosts: payload.totalCosts,
      projectedProfit: payload.projectedProfit,
      scheduleJson: payload.scheduleJson ?? [],
      financeJson: payload.financeJson ?? {},
      planningJson: {},
      createdAt: now,
      updatedAt: now,
    };
    const events = loadLocalEvents(payload.workspaceId);
    events.unshift(event);
    saveLocalEvents(payload.workspaceId, events);
    return event;
  }

  const body = {
    workspace_id: payload.workspaceId,
    created_by: session.user.id,
    name: payload.name,
    status: payload.status,
    venue_id: payload.venueId ?? null,
    venue_name: payload.venueName,
    description: payload.description ?? null,
    date_key: payload.dateKey ?? null,
    start_time: payload.startTime ?? null,
    starts_at: startsAt,
    artist_count: payload.artistCount,
    slot_count: payload.slotCount,
    b2b_count: payload.b2bCount,
    ticket_inventory: payload.ticketInventory,
    expected_revenue: payload.expectedRevenue,
    total_costs: payload.totalCosts,
    projected_profit: payload.projectedProfit,
    schedule_json: payload.scheduleJson ?? [],
    finance_json: payload.financeJson ?? {},
  };

  try {
    const rows = await supabaseRest<EventRow[]>("events", session, {
      method: "POST",
      body,
      prefer: "return=representation",
    });
    return mapRow(rows[0]);
  } catch {
    markLocalCollaborationMode(session.user.id);
    const event: WorkspaceEvent = {
      id: newId(),
      workspaceId: payload.workspaceId,
      createdBy: session.user.id,
      name: payload.name,
      status: payload.status,
      venueId: payload.venueId ?? null,
      venueName: payload.venueName,
      description: payload.description ?? null,
      dateKey: payload.dateKey ?? null,
      startTime: payload.startTime ?? null,
      startsAt,
      artistCount: payload.artistCount,
      slotCount: payload.slotCount,
      b2bCount: payload.b2bCount,
      ticketInventory: payload.ticketInventory,
      expectedRevenue: payload.expectedRevenue,
      totalCosts: payload.totalCosts,
      projectedProfit: payload.projectedProfit,
      scheduleJson: payload.scheduleJson ?? [],
      financeJson: payload.financeJson ?? {},
      planningJson: {},
      createdAt: now,
      updatedAt: now,
    };
    const events = loadLocalEvents(payload.workspaceId);
    events.unshift(event);
    saveLocalEvents(payload.workspaceId, events);
    return event;
  }
}

export async function updateWorkspaceEvent(
  session: SupabaseSession,
  eventId: string,
  patch: Partial<CreateEventPayload>,
): Promise<WorkspaceEvent> {
  const now = new Date().toISOString();

  if (shouldUseLocalCollaboration(session, patch.workspaceId) || !isUuid(eventId)) {
    const wsId = patch.workspaceId;
    if (!wsId) throw new Error("workspaceId required for local update");
    const events = loadLocalEvents(wsId);
    const index = events.findIndex((e) => e.id === eventId);
    if (index === -1) throw new Error("Event not found");
    const current = events[index];
    const updated: WorkspaceEvent = {
      ...current,
      name: patch.name ?? current.name,
      status: patch.status ?? current.status,
      venueId: patch.venueId !== undefined ? patch.venueId ?? null : current.venueId,
      venueName: patch.venueName ?? current.venueName,
      description: patch.description ?? current.description,
      dateKey: patch.dateKey ?? current.dateKey,
      startTime: patch.startTime ?? current.startTime,
      startsAt: buildStartsAt(patch.dateKey ?? current.dateKey ?? undefined, patch.startTime ?? current.startTime ?? undefined),
      artistCount: patch.artistCount ?? current.artistCount,
      slotCount: patch.slotCount ?? current.slotCount,
      b2bCount: patch.b2bCount ?? current.b2bCount,
      ticketInventory: patch.ticketInventory ?? current.ticketInventory,
      expectedRevenue: patch.expectedRevenue ?? current.expectedRevenue,
      totalCosts: patch.totalCosts ?? current.totalCosts,
      projectedProfit: patch.projectedProfit ?? current.projectedProfit,
      scheduleJson: patch.scheduleJson ?? current.scheduleJson,
      financeJson: patch.financeJson ?? current.financeJson,
      updatedAt: now,
    };
    events[index] = updated;
    saveLocalEvents(wsId, events);
    return updated;
  }

  const body: Record<string, unknown> = { updated_at: now };
  if (patch.name !== undefined) body.name = patch.name;
  if (patch.status !== undefined) body.status = patch.status;
  if (patch.venueName !== undefined) body.venue_name = patch.venueName;
  if (patch.projectedProfit !== undefined) body.projected_profit = patch.projectedProfit;
  if (patch.scheduleJson !== undefined) body.schedule_json = patch.scheduleJson;
  if (patch.financeJson !== undefined) body.finance_json = patch.financeJson;

  const rows = await supabaseRest<EventRow[]>(`events?id=eq.${eventId}`, session, {
    method: "PATCH",
    body,
    prefer: "return=representation",
  });
  return mapRow(rows[0]);
}
