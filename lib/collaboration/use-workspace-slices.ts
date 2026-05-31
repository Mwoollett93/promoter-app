"use client";

import useSWR from "swr";

import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { listTasks } from "@/lib/collaboration/tasks";
import type { Task } from "@/lib/types/collaboration";

/** Shared tasks cache — dedupes dashboard, team, and kanban fetches. */
export function useWorkspaceTasks(options?: { enabled?: boolean; eventId?: string }) {
  const { session, workspace, tasks: cachedTasks, usingLocalFallback, ready } = useWorkspace();
  const enabled = options?.enabled !== false;

  const swr = useSWR(
    enabled && ready && session && workspace
      ? (["workspace-tasks", workspace.id, usingLocalFallback] as const)
      : null,
    async () => {
      if (!session || !workspace) return [] as Task[];
      if (usingLocalFallback) {
        return listTasks(session, workspace.id, options?.eventId ? { eventId: options.eventId } : undefined);
      }
      return cachedTasks ?? [];
    },
    {
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
      fallbackData: cachedTasks,
    },
  );

  const tasks = swr.data ?? cachedTasks ?? [];
  const filtered = options?.eventId
    ? tasks.filter((task) => task.eventId === options.eventId)
    : tasks;

  return {
    tasks: filtered,
    allTasks: tasks,
    isLoading: !ready || swr.isLoading,
    mutate: swr.mutate,
  };
}

export function useWorkspaceTaskCommentCounts(options?: { enabled?: boolean }) {
  const { taskCommentCounts, ready } = useWorkspace();
  const enabled = options?.enabled !== false;

  return {
    commentCounts: enabled ? (taskCommentCounts ?? {}) : {},
    isLoading: !ready,
  };
}

export function useWorkspaceInvites(options?: { enabled?: boolean }) {
  const { invites, ready } = useWorkspace();
  const enabled = options?.enabled !== false;

  return {
    invites: enabled ? (invites ?? []) : [],
    isLoading: !ready,
  };
}
