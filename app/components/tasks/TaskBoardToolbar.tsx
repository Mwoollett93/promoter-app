"use client";

import {
  CalendarDays,
  Columns3,
  LayoutList,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import type { ManagedEventRecord } from "@/lib/data/events";
import type { WorkspaceMember } from "@/lib/types/collaboration";
import { getWorkspaceMemberLabel } from "@/lib/collaboration/member-display";
import { TASK_COLUMN_LABELS, TASK_COLUMNS, type TaskColumn } from "@/lib/types/collaboration";

export type BoardViewMode = "kanban" | "list";

type TaskBoardToolbarProps = {
  events: ManagedEventRecord[];
  members: WorkspaceMember[];
  search: string;
  onSearchChange: (value: string) => void;
  eventFilter: string | null;
  onEventFilterChange: (value: string | null) => void;
  assigneeFilter: string | null;
  onAssigneeFilterChange: (value: string | null) => void;
  assignedToMe: boolean;
  onAssignedToMeChange: (value: boolean) => void;
  statusFilter: TaskColumn | null;
  onStatusFilterChange: (value: TaskColumn | null) => void;
  viewMode: BoardViewMode;
  onViewModeChange: (mode: BoardViewMode) => void;
  compact: boolean;
  onCompactChange: (value: boolean) => void;
  quickAddValue: string;
  onQuickAddChange: (value: string) => void;
  onQuickAdd: () => void;
};

const selectClass =
  "h-9 min-w-0 rounded-lg border border-[#3F3F46]/90 bg-[#11111A]/90 px-2.5 text-[12px] text-[#F5F5F7] outline-none transition-colors focus:border-[#8B5CF6]";

const inputClass =
  "h-9 w-full min-w-[140px] rounded-lg border border-[#3F3F46]/90 bg-[#11111A]/90 px-2.5 pl-8 text-[12px] text-[#F5F5F7] outline-none transition-colors placeholder:text-[#71717A] focus:border-[#8B5CF6]";

export default function TaskBoardToolbar({
  events,
  members,
  search,
  onSearchChange,
  eventFilter,
  onEventFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  assignedToMe,
  onAssignedToMeChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  compact,
  onCompactChange,
  quickAddValue,
  onQuickAddChange,
  onQuickAdd,
}: TaskBoardToolbarProps) {
  return (
    <div className="space-y-3 rounded-xl border border-[#232330]/90 bg-gradient-to-b from-[#14141F]/95 to-[#0F0F17] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-lg border border-[#3F3F46]/80 bg-[#0B0B10] p-0.5">
          <span className="px-2 text-[11px] font-medium text-[#71717A]">Board</span>
          <span className="rounded-md bg-[#1A1630] px-2 py-1 text-[11px] font-semibold text-[#C4B5FD]">
            Season ops
          </span>
        </div>

        <select
          value={eventFilter ?? ""}
          onChange={(e) => onEventFilterChange(e.target.value || null)}
          className={selectClass}
          aria-label="Filter by event"
        >
          <option value="">All events</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>

        <select
          value={assigneeFilter ?? ""}
          onChange={(e) => onAssigneeFilterChange(e.target.value || null)}
          className={selectClass}
          aria-label="Filter by assignee"
        >
          <option value="">Anyone</option>
          {members
            .filter((m) => m.status === "active" && m.userId)
            .map((m) => (
              <option key={m.id} value={m.userId!}>
                {getWorkspaceMemberLabel(m)}
              </option>
            ))}
        </select>

        <select
          value={statusFilter ?? ""}
          onChange={(e) =>
            onStatusFilterChange((e.target.value || null) as TaskColumn | null)
          }
          className={selectClass}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {TASK_COLUMNS.map((col) => (
            <option key={col} value={col}>
              {TASK_COLUMN_LABELS[col]}
            </option>
          ))}
        </select>

        <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#3F3F46]/80 px-2.5 text-[12px] text-[#A1A1AA]">
          <input
            type="checkbox"
            checked={assignedToMe}
            onChange={(e) => onAssignedToMeChange(e.target.checked)}
            className="size-3.5 rounded border-[#3F3F46] accent-[#7C3AED]"
          />
          Assigned to me
        </label>

        <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#3F3F46]/80 px-2.5 text-[12px] text-[#A1A1AA]">
          <SlidersHorizontal className="size-3.5" />
          <input
            type="checkbox"
            checked={compact}
            onChange={(e) => onCompactChange(e.target.checked)}
            className="size-3.5 rounded border-[#3F3F46] accent-[#7C3AED]"
          />
          Compact
        </label>

        <div className="ml-auto flex items-center gap-1 rounded-lg border border-[#3F3F46]/80 bg-[#0B0B10] p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange("kanban")}
            className={[
              "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
              viewMode === "kanban"
                ? "bg-[#1A1630] text-[#C4B5FD]"
                : "text-[#71717A] hover:text-[#A1A1AA]",
            ].join(" ")}
          >
            <Columns3 className="size-3.5" />
            Kanban
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={[
              "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
              viewMode === "list"
                ? "bg-[#1A1630] text-[#C4B5FD]"
                : "text-[#71717A] hover:text-[#A1A1AA]",
            ].join(" ")}
          >
            <LayoutList className="size-3.5" />
            List
          </button>
          <button
            type="button"
            disabled
            title="Calendar view coming soon"
            className="flex cursor-not-allowed items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#52525B]"
          >
            <CalendarDays className="size-3.5" />
            Calendar
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#71717A]" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks…"
            className={inputClass}
          />
        </div>
        <input
          value={quickAddValue}
          onChange={(e) => onQuickAddChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onQuickAdd();
          }}
          placeholder="Quick add task…"
          className={`${inputClass} pl-2.5`}
        />
        <button
          type="button"
          onClick={onQuickAdd}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-[rgba(139,92,246,0.45)] bg-[#7C3AED] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#6D28D9]"
        >
          <Plus className="size-3.5" />
          Add task
        </button>
      </div>
    </div>
  );
}
