import { isTaskOverdue } from "@/lib/tasks/task-board-utils";
import type { ManagedEventRecord } from "@/lib/data/events";
import type { Task, WorkspaceMember } from "@/lib/types/collaboration";

export type WorkspaceTeamStats = {
  teamMembers: number;
  activeEvents: number;
  openTasks: number;
  pendingApprovals: number;
  overdueTasks: number;
};

export function computeWorkspaceTeamStats(
  members: WorkspaceMember[],
  events: ManagedEventRecord[],
  tasks: Task[],
): WorkspaceTeamStats {
  const activeMembers = members.filter((m) => m.status === "active");
  const activeEvents = events.filter((e) => e.status === "active" || e.status === "draft").length;
  const openTasks = tasks.filter((t) => t.column !== "complete").length;
  const pendingApprovals = tasks.filter((t) => t.column === "waiting").length;
  const overdueTasks = tasks.filter((t) => isTaskOverdue(t)).length;

  return {
    teamMembers: activeMembers.length || members.length,
    activeEvents,
    openTasks,
    pendingApprovals,
    overdueTasks,
  };
}
