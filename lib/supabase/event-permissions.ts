import { newId } from "@/lib/collaboration/local-store";
import type { SupabaseSession } from "@/lib/types/artist";
import type { EventMemberOverride } from "@/lib/types/collaboration";

import { getSupabaseConfig, isDemoSession } from "./browser";
import { supabaseRest } from "./client-rest";

const LOCAL_KEY = "promosync:collab:event-overrides";

type OverrideRow = {
  id: string;
  event_id: string;
  user_id: string;
  can_edit_finance: boolean | null;
  can_edit_lineup: boolean | null;
  can_upload_docs: boolean | null;
  comment_only: boolean;
};

function mapRow(row: OverrideRow): EventMemberOverride {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    canEditFinance: row.can_edit_finance,
    canEditLineup: row.can_edit_lineup,
    canUploadDocs: row.can_upload_docs,
    commentOnly: row.comment_only,
  };
}

function loadLocalOverrides(): EventMemberOverride[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_KEY) ?? "[]") as EventMemberOverride[];
  } catch {
    return [];
  }
}

function saveLocalOverrides(overrides: EventMemberOverride[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(overrides));
}

export async function listEventMemberOverrides(
  session: SupabaseSession,
  eventId: string,
): Promise<EventMemberOverride[]> {
  if (isDemoSession(session) || !getSupabaseConfig()) {
    return loadLocalOverrides().filter((o) => o.eventId === eventId);
  }

  try {
    const rows = await supabaseRest<OverrideRow[]>(
      `event_member_overrides?event_id=eq.${eventId}`,
      session,
    );
    return rows.map(mapRow);
  } catch {
    return loadLocalOverrides().filter((o) => o.eventId === eventId);
  }
}

export async function upsertEventMemberOverride(
  session: SupabaseSession,
  input: Omit<EventMemberOverride, "id"> & { id?: string },
): Promise<EventMemberOverride> {
  const record: EventMemberOverride = {
    id: input.id ?? newId(),
    eventId: input.eventId,
    userId: input.userId,
    canEditFinance: input.canEditFinance,
    canEditLineup: input.canEditLineup,
    canUploadDocs: input.canUploadDocs,
    commentOnly: input.commentOnly,
  };

  if (isDemoSession(session) || !getSupabaseConfig()) {
    const all = loadLocalOverrides().filter(
      (o) => !(o.eventId === record.eventId && o.userId === record.userId),
    );
    all.push(record);
    saveLocalOverrides(all);
    return record;
  }

  const rows = await supabaseRest<OverrideRow[]>("event_member_overrides", session, {
    method: "POST",
    body: {
      id: record.id,
      event_id: record.eventId,
      user_id: record.userId,
      can_edit_finance: record.canEditFinance,
      can_edit_lineup: record.canEditLineup,
      can_upload_docs: record.canUploadDocs,
      comment_only: record.commentOnly,
    },
    prefer: "resolution=merge-duplicates,return=representation",
  });
  return mapRow(rows[0]);
}
