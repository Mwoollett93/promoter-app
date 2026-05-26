import type { Task } from "@/lib/types/collaboration";

export function formatDueLabel(dueAt: string | null): string | null {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((startOfDue.getTime() - startOfToday.getTime()) / 86_400_000);

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays < 7) return `Due in ${diffDays}d`;
  return due.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function isTaskOverdue(task: Task): boolean {
  if (!task.dueAt || task.column === "complete") return false;
  const due = new Date(task.dueAt);
  if (Number.isNaN(due.getTime())) return false;
  const now = new Date();
  return due < new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function isDueThisWeek(task: Task): boolean {
  if (!task.dueAt || task.column === "complete") return false;
  const due = new Date(task.dueAt);
  if (Number.isNaN(due.getTime())) return false;
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return due >= now && due <= weekEnd;
}

export function priorityAccent(priority: Task["priority"]): string {
  if (priority === "urgent") return "bg-red-500";
  if (priority === "high") return "bg-orange-500";
  if (priority === "medium") return "bg-[#8B5CF6]";
  return "bg-[#52525B]";
}

export function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function filterTasks(
  tasks: Task[],
  filters: {
    search: string;
    eventId: string | null;
    assigneeId: string | null;
    assignedToMe: boolean;
    statusColumn: string | null;
    currentUserId?: string;
  },
): Task[] {
  const needle = filters.search.trim().toLowerCase();
  return tasks.filter((task) => {
    if (filters.eventId && task.eventId !== filters.eventId) return false;
    if (filters.statusColumn && task.column !== filters.statusColumn) return false;
    if (filters.assigneeId && task.assigneeId !== filters.assigneeId) return false;
    if (filters.assignedToMe && filters.currentUserId && task.assigneeId !== filters.currentUserId) {
      return false;
    }
    if (!needle) return true;
    const haystack = [task.title, task.description ?? "", ...(task.labels ?? [])]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function boardMetrics(tasks: Task[]) {
  const total = tasks.length;
  const complete = tasks.filter((t) => t.column === "complete").length;
  const overdue = tasks.filter((t) => isTaskOverdue(t)).length;
  const waiting = tasks.filter((t) => t.column === "waiting").length;
  const dueThisWeek = tasks.filter((t) => isDueThisWeek(t)).length;
  const completedPct = total > 0 ? Math.round((complete / total) * 100) : 0;
  return { total, overdue, waiting, dueThisWeek, completedPct };
}
