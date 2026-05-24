import {
  loadLocalActivity,
  newId,
  saveLocalActivity,
} from "@/lib/collaboration/local-store";
import type { SupabaseSession } from "@/lib/types/artist";
import type { ActivityEntity, ActivityLogEntry } from "@/lib/types/collaboration";

import { getSupabaseConfig, isDemoSession } from "@/lib/supabase/browser";
import { supabaseRest } from "@/lib/supabase/client-rest";

type ActivityRow = {
  id: string;
  workspace_id: string;
  event_id: string | null;
  entity_type: ActivityEntity;
  entity_id: string | null;
  actor_id: string;
  verb: string;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

function mapRow(row: ActivityRow): ActivityLogEntry {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    eventId: row.event_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    actorId: row.actor_id,
    verb: row.verb,
    summary: row.summary,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

export async function listActivity(
  session: SupabaseSession,
  workspaceId: string,
  filters?: { eventId?: string; limit?: number },
): Promise<ActivityLogEntry[]> {
  const limit = filters?.limit ?? 50;

  if (isDemoSession(session) || !getSupabaseConfig()) {
    let entries = loadLocalActivity(workspaceId);
    if (filters?.eventId) entries = entries.filter((e) => e.eventId === filters.eventId);
    return entries
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, limit);
  }

  try {
    let path = `activity_log?workspace_id=eq.${workspaceId}&order=created_at.desc&limit=${limit}`;
    if (filters?.eventId) path += `&event_id=eq.${filters.eventId}`;
    const rows = await supabaseRest<ActivityRow[]>(path, session);
    return rows.map(mapRow);
  } catch {
    return loadLocalActivity(workspaceId).slice(0, limit);
  }
}

export async function logActivity(
  session: SupabaseSession,
  input: {
    workspaceId: string;
    eventId?: string | null;
    entityType: ActivityEntity;
    entityId?: string | null;
    verb: string;
    summary: string;
    metadata?: Record<string, unknown>;
    actorName?: string;
  },
): Promise<ActivityLogEntry> {
  const entry: ActivityLogEntry = {
    id: newId(),
    workspaceId: input.workspaceId,
    eventId: input.eventId ?? null,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    actorId: session.user.id,
    actorName: input.actorName,
    verb: input.verb,
    summary: input.summary,
    metadata: input.metadata ?? {},
    createdAt: new Date().toISOString(),
  };

  if (isDemoSession(session) || !getSupabaseConfig()) {
    const entries = loadLocalActivity(input.workspaceId);
    entries.unshift(entry);
    saveLocalActivity(input.workspaceId, entries);
    return entry;
  }

  try {
    const rows = await supabaseRest<ActivityRow[]>("activity_log", session, {
      method: "POST",
      body: {
        workspace_id: input.workspaceId,
        event_id: input.eventId ?? null,
        entity_type: input.entityType,
        entity_id: input.entityId ?? null,
        actor_id: session.user.id,
        verb: input.verb,
        summary: input.summary,
        metadata: input.metadata ?? {},
      },
      prefer: "return=representation",
    });
    return { ...mapRow(rows[0]), actorName: input.actorName };
  } catch {
    const entries = loadLocalActivity(input.workspaceId);
    entries.unshift(entry);
    saveLocalActivity(input.workspaceId, entries);
    return entry;
  }
}
