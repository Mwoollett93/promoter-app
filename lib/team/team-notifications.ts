import { buildOperationalSuggestions } from "@/lib/tasks/operational-suggestions";
import { isTaskOverdue } from "@/lib/tasks/task-board-utils";
import type { ManagedEventRecord } from "@/lib/data/events";
import type { Task } from "@/lib/types/collaboration";

export type TeamNotificationItem = {
  id: string;
  tone: "danger" | "warning" | "info";
  title: string;
  detail: string;
  href?: string;
};

export function buildTeamNotifications(
  tasks: Task[],
  events: ManagedEventRecord[],
): TeamNotificationItem[] {
  const items: TeamNotificationItem[] = [];

  const overdue = tasks.filter((t) => isTaskOverdue(t));
  if (overdue.length > 0) {
    items.push({
      id: "overdue-tasks",
      tone: "danger",
      title: `${overdue.length} overdue task${overdue.length === 1 ? "" : "s"}`,
      detail: "Review assignments on the task board before show week slips.",
      href: "/tasks",
    });
  }

  const waiting = tasks.filter((t) => t.column === "waiting");
  if (waiting.length > 0) {
    items.push({
      id: "waiting-tasks",
      tone: "warning",
      title: `${waiting.length} waiting on response`,
      detail: "Follow up on external approvals and artist confirmations.",
      href: "/tasks",
    });
  }

  for (const suggestion of buildOperationalSuggestions(events)) {
    items.push({
      id: suggestion.id,
      tone: "info",
      title: suggestion.title,
      detail: `${suggestion.eventName} — ${suggestion.detail}`,
      href: "/events",
    });
  }

  return items.slice(0, 6);
}
