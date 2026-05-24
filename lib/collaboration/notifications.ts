import {
  loadLocalNotifications,
  newId,
  saveLocalNotifications,
} from "@/lib/collaboration/local-store";
import type { SupabaseSession } from "@/lib/types/artist";
import type { AppNotification, NotificationType } from "@/lib/types/collaboration";

import { shouldUseLocalCollaboration } from "@/lib/collaboration/storage-mode";
import { supabaseRest } from "@/lib/supabase/client-rest";

type NotificationRow = {
  id: string;
  user_id: string;
  workspace_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link_path: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

function mapRow(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    workspaceId: row.workspace_id,
    type: row.type,
    title: row.title,
    body: row.body,
    linkPath: row.link_path,
    metadata: row.metadata ?? {},
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export async function listNotifications(
  session: SupabaseSession,
  unreadOnly = false,
): Promise<AppNotification[]> {
  if (shouldUseLocalCollaboration(session)) {
    let list = loadLocalNotifications(session.user.id);
    if (unreadOnly) list = list.filter((n) => !n.readAt);
    return list.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  try {
    let path = `notifications?user_id=eq.${session.user.id}&order=created_at.desc&limit=50`;
    if (unreadOnly) path += "&read_at=is.null";
    const rows = await supabaseRest<NotificationRow[]>(path, session);
    return rows.map(mapRow);
  } catch {
    return loadLocalNotifications(session.user.id);
  }
}

export async function createNotification(
  session: SupabaseSession,
  input: {
    userId: string;
    workspaceId: string;
    type: NotificationType;
    title: string;
    body: string;
    linkPath?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<AppNotification> {
  const notification: AppNotification = {
    id: newId(),
    userId: input.userId,
    workspaceId: input.workspaceId,
    type: input.type,
    title: input.title,
    body: input.body,
    linkPath: input.linkPath ?? null,
    metadata: input.metadata ?? {},
    readAt: null,
    createdAt: new Date().toISOString(),
  };

  if (shouldUseLocalCollaboration(session, input.workspaceId)) {
    const list = loadLocalNotifications(input.userId);
    list.unshift(notification);
    saveLocalNotifications(input.userId, list);
    window.dispatchEvent(new Event("promosync:notifications-updated"));
    return notification;
  }

  try {
    const rows = await supabaseRest<NotificationRow[]>("notifications", session, {
      method: "POST",
      body: {
        user_id: input.userId,
        workspace_id: input.workspaceId,
        type: input.type,
        title: input.title,
        body: input.body,
        link_path: input.linkPath ?? null,
        metadata: input.metadata ?? {},
      },
      prefer: "return=representation",
    });
    return mapRow(rows[0]);
  } catch {
    const list = loadLocalNotifications(input.userId);
    list.unshift(notification);
    saveLocalNotifications(input.userId, list);
    return notification;
  }
}

export async function markNotificationRead(
  session: SupabaseSession,
  notificationId: string,
): Promise<void> {
  const now = new Date().toISOString();

  if (shouldUseLocalCollaboration(session)) {
    const list = loadLocalNotifications(session.user.id).map((n) =>
      n.id === notificationId ? { ...n, readAt: now } : n,
    );
    saveLocalNotifications(session.user.id, list);
    window.dispatchEvent(new Event("promosync:notifications-updated"));
    return;
  }

  await supabaseRest(`notifications?id=eq.${notificationId}`, session, {
    method: "PATCH",
    body: { read_at: now },
    prefer: "return=minimal",
  });
}

export async function markAllNotificationsRead(session: SupabaseSession): Promise<void> {
  const now = new Date().toISOString();

  if (shouldUseLocalCollaboration(session)) {
    const list = loadLocalNotifications(session.user.id).map((n) => ({ ...n, readAt: n.readAt ?? now }));
    saveLocalNotifications(session.user.id, list);
    window.dispatchEvent(new Event("promosync:notifications-updated"));
    return;
  }

  await supabaseRest(`notifications?user_id=eq.${session.user.id}&read_at=is.null`, session, {
    method: "PATCH",
    body: { read_at: now },
    prefer: "return=minimal",
  });
}
