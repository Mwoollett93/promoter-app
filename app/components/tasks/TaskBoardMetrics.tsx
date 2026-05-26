"use client";

import { AlertTriangle, CalendarClock, CheckCircle2, ListTodo, PauseCircle } from "lucide-react";

type TaskBoardMetricsProps = {
  total: number;
  overdue: number;
  waiting: number;
  dueThisWeek: number;
  completedPct: number;
};

const METRIC_ITEMS = [
  { key: "total", label: "Total tasks", icon: ListTodo, tone: "text-[#F5F5F7]" },
  { key: "overdue", label: "Overdue", icon: AlertTriangle, tone: "text-[#FCA5A5]" },
  { key: "waiting", label: "Waiting on response", icon: PauseCircle, tone: "text-[#FCD34D]" },
  { key: "dueThisWeek", label: "Due this week", icon: CalendarClock, tone: "text-[#93C5FD]" },
  { key: "completedPct", label: "Completed", icon: CheckCircle2, tone: "text-[#86EFAC]" },
] as const;

export default function TaskBoardMetrics(props: TaskBoardMetricsProps) {
  const values: Record<(typeof METRIC_ITEMS)[number]["key"], string | number> = {
    total: props.total,
    overdue: props.overdue,
    waiting: props.waiting,
    dueThisWeek: props.dueThisWeek,
    completedPct: `${props.completedPct}%`,
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {METRIC_ITEMS.map(({ key, label, icon: Icon, tone }) => (
        <div
          key={key}
          className="rounded-xl border border-[#232330]/90 bg-gradient-to-b from-[#14141F] to-[#0F0F17] px-3 py-2.5 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]"
        >
          <div className="flex items-center gap-2">
            <Icon className={`size-3.5 shrink-0 ${tone}`} strokeWidth={2} />
            <span className="text-[10px] font-medium uppercase tracking-wide text-[#71717A]">
              {label}
            </span>
          </div>
          <p className={`mt-1 text-[20px] font-semibold tabular-nums ${tone}`}>{values[key]}</p>
        </div>
      ))}
    </div>
  );
}
