import { isTaskOverdue } from "@/lib/tasks/task-board-utils";
import type { ManagedEventRecord } from "@/lib/data/events";
import type { Task, WorkspaceMember } from "@/lib/types/collaboration";

export type WorkloadLevel = "low" | "medium" | "overloaded";

export type MemberWorkload = {
  memberId: string;
  userId: string | null;
  activeTasks: number;
  overdueTasks: number;
  assignedEvents: number;
  workloadLevel: WorkloadLevel;
  lastActiveAt: string | null;
};

function workloadLevel(activeTasks: number, overdueTasks: number): WorkloadLevel {
  if (overdueTasks >= 3 || activeTasks >= 12) return "overloaded";
  if (activeTasks >= 6 || overdueTasks >= 1) return "medium";
  return "low";
}

export function computeMemberWorkloads(
  members: WorkspaceMember[],
  tasks: Task[],
  events: ManagedEventRecord[],
): Map<string, MemberWorkload> {
  const map = new Map<string, MemberWorkload>();
  const activeEventIds = new Set(
    events.filter((e) => e.status === "active" || e.status === "draft").map((e) => e.id),
  );

  for (const member of members) {
    if (member.status !== "active" || !member.userId) {
      map.set(member.id, {
        memberId: member.id,
        userId: member.userId,
        activeTasks: 0,
        overdueTasks: 0,
        assignedEvents: 0,
        workloadLevel: "low",
        lastActiveAt: member.joinedAt ?? member.createdAt,
      });
      continue;
    }

    const memberTasks = tasks.filter((t) => t.assigneeId === member.userId);
    const activeTasks = memberTasks.filter((t) => t.column !== "complete");
    const overdueTasks = memberTasks.filter((t) => isTaskOverdue(t));
    const eventIds = new Set(
      memberTasks.map((t) => t.eventId).filter((id): id is string => Boolean(id && activeEventIds.has(id))),
    );

    let lastActiveAt: string | null = member.joinedAt ?? member.createdAt;
    for (const task of memberTasks) {
      if (!lastActiveAt || task.updatedAt > lastActiveAt) lastActiveAt = task.updatedAt;
    }

    map.set(member.id, {
      memberId: member.id,
      userId: member.userId,
      activeTasks: activeTasks.length,
      overdueTasks: overdueTasks.length,
      assignedEvents: eventIds.size,
      workloadLevel: workloadLevel(activeTasks.length, overdueTasks.length),
      lastActiveAt,
    });
  }

  return map;
}

export function formatLastActive(iso: string | null): string {
  if (!iso) return "No activity yet";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "Unknown";
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
