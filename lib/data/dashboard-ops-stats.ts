import type { ManagedEventRecord } from "@/lib/data/events";
import { isTaskOverdue } from "@/lib/tasks/task-board-utils";
import type { Task } from "@/lib/types/collaboration";

export type DashboardOpsStat = {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
};

function isUpcoming(event: ManagedEventRecord) {
  if (event.status === "canceled" || event.status === "completed") return false;
  if (!event.dateKey) return event.status === "draft" || event.status === "active";
  const [y, m, d] = event.dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date.getTime() >= today.getTime();
}

function eventsInRange(events: ManagedEventRecord[], start: Date, end: Date) {
  return events.filter((event) => {
    const created = Date.parse(event.createdAt);
    return Number.isFinite(created) && created >= start.getTime() && created < end.getTime();
  });
}

function trendLabel(current: number, previous: number, suffix: string) {
  const delta = current - previous;
  if (delta === 0) return `— flat ${suffix}`;
  const up = delta > 0;
  return `${up ? "↑" : "↓"} ${Math.abs(delta)} ${suffix}`;
}

export function buildDashboardOpsStats(
  events: ManagedEventRecord[],
  tasks: Task[],
  assignedToYou: number,
): DashboardOpsStat[] {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisMonth = eventsInRange(events, monthStart, now);
  const lastMonth = eventsInRange(events, prevMonthStart, monthStart);

  const upcoming = events.filter(isUpcoming);
  const confirmed = events.filter((e) => e.status === "active");
  const openTasks = tasks.filter((t) => t.column !== "complete");
  const pendingApprovals = tasks.filter((t) => t.column === "waiting");
  const overdueTasks = tasks.filter((t) => isTaskOverdue(t));

  const upcomingThisMonth = thisMonth.filter(isUpcoming).length;
  const upcomingLastMonth = lastMonth.filter(isUpcoming).length;
  const confirmedThisMonth = thisMonth.filter((e) => e.status === "active").length;
  const confirmedLastMonth = lastMonth.filter((e) => e.status === "active").length;

  return [
    {
      label: "Upcoming Events",
      value: String(upcoming.length),
      trend: trendLabel(upcomingThisMonth, upcomingLastMonth, "vs last month"),
      trendUp: upcomingThisMonth >= upcomingLastMonth,
    },
    {
      label: "Confirmed Events",
      value: String(confirmed.length),
      trend: trendLabel(confirmedThisMonth, confirmedLastMonth, "vs last month"),
      trendUp: confirmedThisMonth >= confirmedLastMonth,
    },
    {
      label: "Open Tasks",
      value: String(openTasks.length),
      trend:
        assignedToYou > 0
          ? `${assignedToYou} assigned to you`
          : "Nothing assigned to you",
      trendUp: assignedToYou > 0,
    },
    {
      label: "Pending Approvals",
      value: String(pendingApprovals.length),
      trend: pendingApprovals.length === 0 ? "All caught up" : "Waiting on response",
      trendUp: pendingApprovals.length === 0,
    },
    {
      label: "Overdue Tasks",
      value: String(overdueTasks.length),
      trend: overdueTasks.length === 0 ? "Great work" : "Needs attention",
      trendUp: overdueTasks.length === 0,
    },
  ];
}
