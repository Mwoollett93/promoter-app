"use client";

import * as React from "react";

import { listTasks } from "@/lib/collaboration/tasks";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { buildDashboardOpsStats } from "@/lib/data/dashboard-ops-stats";
import { computeMemberWorkloads } from "@/lib/team/member-workload";
import { buildTeamNotifications } from "@/lib/team/team-notifications";
import type { Task } from "@/lib/types/collaboration";

export function useDashboardOpsData() {
  const { session, workspace, members, events, membership, ready } = useWorkspace();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [tasksReady, setTasksReady] = React.useState(false);

  const refreshTasks = React.useCallback(async () => {
    if (!session || !workspace) {
      setTasks([]);
      setTasksReady(true);
      return;
    }
    try {
      const list = await listTasks(session, workspace.id);
      setTasks(list);
    } catch {
      setTasks([]);
    } finally {
      setTasksReady(true);
    }
  }, [session, workspace]);

  React.useEffect(() => {
    setTasksReady(false);
    void refreshTasks();
  }, [refreshTasks]);

  const assignedToYou = tasks.filter(
    (t) => t.assigneeId === session?.user.id && t.column !== "complete",
  ).length;

  const opsStats = React.useMemo(
    () => buildDashboardOpsStats(events, tasks, assignedToYou),
    [events, tasks, assignedToYou],
  );

  const notifications = React.useMemo(
    () => buildTeamNotifications(tasks, events),
    [tasks, events],
  );

  const workloads = React.useMemo(
    () => computeMemberWorkloads(members, tasks, events),
    [members, tasks, events],
  );

  const activeMembers =
    members.length > 0
      ? members.filter((m) => m.status === "active")
      : membership
        ? [membership]
        : [];

  return {
    ready: ready && tasksReady,
    session,
    workspace,
    events,
    tasks,
    opsStats,
    notifications,
    workloads,
    activeMembers,
    assignedToYou,
    refreshTasks,
  };
}
