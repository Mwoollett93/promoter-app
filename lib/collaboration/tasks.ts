import {
  loadLocalTasks,
  newId,
  saveLocalTasks,
} from "@/lib/collaboration/local-store";
import type { SupabaseSession } from "@/lib/types/artist";
import type { Task, TaskChecklistItem, TaskColumn } from "@/lib/types/collaboration";

import { getSupabaseConfig, isDemoSession } from "@/lib/supabase/browser";
import { supabaseRest } from "@/lib/supabase/client-rest";

type TaskRow = {
  id: string;
  workspace_id: string;
  event_id: string | null;
  artist_id: string | null;
  venue_id: string | null;
  booking_id: string | null;
  column: TaskColumn;
  position: number;
  title: string;
  description: string | null;
  assignee_id: string | null;
  due_at: string | null;
  priority: Task["priority"];
  labels: string[];
  checklist: TaskChecklistItem[];
  created_by: string;
  created_at: string;
  updated_at: string;
};

function mapRow(row: TaskRow): Task {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    eventId: row.event_id,
    artistId: row.artist_id,
    venueId: row.venue_id,
    bookingId: row.booking_id,
    column: row.column,
    position: row.position,
    title: row.title,
    description: row.description,
    assigneeId: row.assignee_id,
    dueAt: row.due_at,
    priority: row.priority,
    labels: row.labels ?? [],
    checklist: row.checklist ?? [],
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listTasks(
  session: SupabaseSession,
  workspaceId: string,
  filters?: { eventId?: string; assigneeId?: string },
): Promise<Task[]> {
  if (isDemoSession(session) || !getSupabaseConfig()) {
    let tasks = loadLocalTasks(workspaceId);
    if (filters?.eventId) tasks = tasks.filter((t) => t.eventId === filters.eventId);
    if (filters?.assigneeId) tasks = tasks.filter((t) => t.assigneeId === filters.assigneeId);
    return tasks.sort((a, b) => a.position - b.position);
  }

  try {
    let path = `tasks?workspace_id=eq.${workspaceId}&order=position.asc`;
    if (filters?.eventId) path += `&event_id=eq.${filters.eventId}`;
    if (filters?.assigneeId) path += `&assignee_id=eq.${filters.assigneeId}`;
    const rows = await supabaseRest<TaskRow[]>(path, session);
    return rows.map(mapRow);
  } catch {
    return loadLocalTasks(workspaceId);
  }
}

export async function createTask(
  session: SupabaseSession,
  input: {
    workspaceId: string;
    title: string;
    column?: TaskColumn;
    eventId?: string | null;
    artistId?: string | null;
    venueId?: string | null;
    description?: string;
    assigneeId?: string | null;
    dueAt?: string | null;
    priority?: Task["priority"];
    labels?: string[];
    checklist?: TaskChecklistItem[];
  },
): Promise<Task> {
  const now = new Date().toISOString();
  const column = input.column ?? "backlog";
  const tasks = await listTasks(session, input.workspaceId, { eventId: input.eventId ?? undefined });
  const position = tasks.filter((t) => t.column === column).length;

  const task: Task = {
    id: newId(),
    workspaceId: input.workspaceId,
    eventId: input.eventId ?? null,
    artistId: input.artistId ?? null,
    venueId: input.venueId ?? null,
    bookingId: null,
    column,
    position,
    title: input.title.trim(),
    description: input.description ?? null,
    assigneeId: input.assigneeId ?? null,
    dueAt: input.dueAt ?? null,
    priority: input.priority ?? "medium",
    labels: input.labels ?? [],
    checklist: input.checklist ?? [],
    createdBy: session.user.id,
    createdAt: now,
    updatedAt: now,
  };

  if (isDemoSession(session) || !getSupabaseConfig()) {
    const all = loadLocalTasks(input.workspaceId);
    all.push(task);
    saveLocalTasks(input.workspaceId, all);
    return task;
  }

  try {
    const rows = await supabaseRest<TaskRow[]>("tasks", session, {
      method: "POST",
      body: {
        workspace_id: input.workspaceId,
        event_id: input.eventId ?? null,
        artist_id: input.artistId ?? null,
        venue_id: input.venueId ?? null,
        column: task.column,
        position: task.position,
        title: task.title,
        description: task.description,
        assignee_id: task.assigneeId,
        due_at: task.dueAt,
        priority: task.priority,
        labels: task.labels,
        checklist: task.checklist,
        created_by: session.user.id,
      },
      prefer: "return=representation",
    });
    return mapRow(rows[0]);
  } catch {
    const all = loadLocalTasks(input.workspaceId);
    all.push(task);
    saveLocalTasks(input.workspaceId, all);
    return task;
  }
}

export async function moveTask(
  session: SupabaseSession,
  taskId: string,
  column: TaskColumn,
  position: number,
): Promise<Task> {
  if (isDemoSession(session) || !getSupabaseConfig()) {
    const allKeys = Object.keys(localStorage).filter((k) => k.startsWith("promosync:collab:tasks:"));
    for (const key of allKeys) {
      const wsId = key.split(":").pop()!;
      const tasks = loadLocalTasks(wsId);
      const index = tasks.findIndex((t) => t.id === taskId);
      if (index !== -1) {
        tasks[index] = { ...tasks[index], column, position, updatedAt: new Date().toISOString() };
        saveLocalTasks(wsId, tasks);
        return tasks[index];
      }
    }
    throw new Error("Task not found");
  }

  try {
    const rows = await supabaseRest<TaskRow[]>("rpc/move_task", session, {
      method: "POST",
      body: { p_task_id: taskId, p_column: column, p_position: position },
    });
    return mapRow(rows[0]);
  } catch {
    const rows = await supabaseRest<TaskRow[]>(`tasks?id=eq.${taskId}`, session, {
      method: "PATCH",
      body: { column, position, updated_at: new Date().toISOString() },
      prefer: "return=representation",
    });
    return mapRow(rows[0]);
  }
}

export async function updateTask(
  session: SupabaseSession,
  workspaceId: string,
  taskId: string,
  patch: Partial<Pick<Task, "title" | "description" | "assigneeId" | "dueAt" | "priority" | "labels" | "checklist">>,
): Promise<Task> {
  const now = new Date().toISOString();

  if (isDemoSession(session) || !getSupabaseConfig()) {
    const tasks = loadLocalTasks(workspaceId);
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) throw new Error("Task not found");
    tasks[index] = { ...tasks[index], ...patch, updatedAt: now };
    saveLocalTasks(workspaceId, tasks);
    return tasks[index];
  }

  const body: Record<string, unknown> = { updated_at: now };
  if (patch.title !== undefined) body.title = patch.title;
  if (patch.description !== undefined) body.description = patch.description;
  if (patch.assigneeId !== undefined) body.assignee_id = patch.assigneeId;
  if (patch.dueAt !== undefined) body.due_at = patch.dueAt;
  if (patch.priority !== undefined) body.priority = patch.priority;
  if (patch.labels !== undefined) body.labels = patch.labels;
  if (patch.checklist !== undefined) body.checklist = patch.checklist;

  const rows = await supabaseRest<TaskRow[]>(`tasks?id=eq.${taskId}`, session, {
    method: "PATCH",
    body,
    prefer: "return=representation",
  });
  return mapRow(rows[0]);
}
