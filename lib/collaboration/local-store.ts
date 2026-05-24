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

export function getDemoWorkspaceId(userId: string) {
  return `demo-ws-${userId}`;
}

export function loadLocalWorkspace(userId: string): Workspace | null {
  return readJson<Workspace | null>(`${PREFIX}workspace:${userId}`, null);
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
