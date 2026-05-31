"use client";

import * as React from "react";

import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { buildDashboardOpsStats } from "@/lib/data/dashboard-ops-stats";
import { computeMemberWorkloads } from "@/lib/team/member-workload";
import { buildTeamNotifications } from "@/lib/team/team-notifications";

export function useDashboardOpsData() {
  const { session, workspace, members, events, membership, ready, tasks } = useWorkspace();

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
    ready,
    session,
    workspace,
    events,
    tasks,
    opsStats,
    notifications,
    workloads,
    activeMembers,
    assignedToYou,
  };
}
