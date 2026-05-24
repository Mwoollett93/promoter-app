/**
 * Demo / offline fallback when Supabase collaboration tables are unavailable.
 */

import type {
  ActivityLogEntry,
  AppNotification,
  Comment,
  Task,
  Workspace,
  WorkspaceEvent,
  WorkspaceInvite,
  WorkspaceMember,
} from "@/lib/types/collaboration";

const PREFIX = "promosync:collab:";

function key(suffix: string, workspaceId: string) {
  return `${PREFIX}${suffix}:${workspaceId}`;
}

function readJson<T>(storageKey: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(storageKey: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(value));
}

/** @deprecated Legacy ids — use createLocalWorkspaceId() */
export function getDemoWorkspaceId(userId: string) {
  return `demo-ws-${userId}`;
}

export function createLocalWorkspaceId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return newId();
}

export function clearLocalWorkspaceForUser(userId: string) {
  if (typeof window === "undefined") return;
  const ws = loadLocalWorkspace(userId);
  window.localStorage.removeItem(`${PREFIX}workspace:${userId}`);
  if (ws?.id) {
    window.localStorage.removeItem(key("members", ws.id));
    window.localStorage.removeItem(key("events", ws.id));
    window.localStorage.removeItem(key("activity", ws.id));
    window.localStorage.removeItem(key("comments", ws.id));
    window.localStorage.removeItem(key("tasks", ws.id));
    window.localStorage.removeItem(key("invites", ws.id));
  }
}

/** Strip legacy `demo-ws-` prefix if the suffix is a valid UUID shape. */
export function normalizeLegacyWorkspaceId(workspaceId: string) {
  const match = /^demo-ws-([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.exec(
    workspaceId,
  );
  return match ? match[1] : workspaceId;
}

export function loadLocalWorkspace(userId: string): Workspace | null {
  return readJson<Workspace | null>(`${PREFIX}workspace:${userId}`, null);
}

export function findLocalWorkspaceById(workspaceId: string): Workspace | null {
  if (typeof window === "undefined") return null;
  for (let i = 0; i < window.localStorage.length; i++) {
    const storageKey = window.localStorage.key(i);
    if (!storageKey?.startsWith(`${PREFIX}workspace:`)) continue;
    const workspace = readJson<Workspace | null>(storageKey, null);
    if (workspace?.id === workspaceId) return workspace;
  }
  return null;
}

export function findLocalMembershipForUser(userId: string): {
  workspaceId: string;
  membership: WorkspaceMember;
} | null {
  if (typeof window === "undefined") return null;
  const prefix = `${PREFIX}members:`;
  for (let i = 0; i < window.localStorage.length; i++) {
    const storageKey = window.localStorage.key(i);
    if (!storageKey?.startsWith(prefix)) continue;
    const workspaceId = storageKey.slice(prefix.length);
    const membership = loadLocalMembers(workspaceId).find(
      (member) => member.userId === userId && member.status === "active",
    );
    if (membership) return { workspaceId, membership };
  }
  return null;
}

export function saveLocalWorkspace(userId: string, workspace: Workspace) {
  writeJson(`${PREFIX}workspace:${userId}`, workspace);
}

export function loadLocalMembers(workspaceId: string): WorkspaceMember[] {
  return readJson(key("members", workspaceId), []);
}

export function saveLocalMembers(workspaceId: string, members: WorkspaceMember[]) {
  writeJson(key("members", workspaceId), members);
}

export function loadLocalInvites(workspaceId: string): WorkspaceInvite[] {
  return readJson(key("invites", workspaceId), []);
}

export function saveLocalInvites(workspaceId: string, invites: WorkspaceInvite[]) {
  writeJson(key("invites", workspaceId), invites);
}

export function loadLocalEvents(workspaceId: string): WorkspaceEvent[] {
  return readJson(key("events", workspaceId), []);
}

export function saveLocalEvents(workspaceId: string, events: WorkspaceEvent[]) {
  writeJson(key("events", workspaceId), events);
  window.dispatchEvent(new Event("promosync:events-updated"));
}

export function loadLocalActivity(workspaceId: string): ActivityLogEntry[] {
  return readJson(key("activity", workspaceId), []);
}

export function saveLocalActivity(workspaceId: string, entries: ActivityLogEntry[]) {
  writeJson(key("activity", workspaceId), entries);
}

export function loadLocalComments(workspaceId: string): Comment[] {
  return readJson(key("comments", workspaceId), []);
}

export function saveLocalComments(workspaceId: string, comments: Comment[]) {
  writeJson(key("comments", workspaceId), comments);
}

export function loadLocalTasks(workspaceId: string): Task[] {
  return readJson(key("tasks", workspaceId), []);
}

export function saveLocalTasks(workspaceId: string, tasks: Task[]) {
  writeJson(key("tasks", workspaceId), tasks);
}

export function loadLocalNotifications(userId: string): AppNotification[] {
  return readJson(`${PREFIX}notifications:${userId}`, []);
}

export function saveLocalNotifications(userId: string, notifications: AppNotification[]) {
  writeJson(`${PREFIX}notifications:${userId}`, notifications);
}

export function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
