"use client";

import { MessageSquare, Paperclip, X } from "lucide-react";

import {
  formatDueLabel,
  isTaskOverdue,
  memberInitials,
  priorityAccent,
} from "@/lib/tasks/task-board-utils";
import type { Task } from "@/lib/types/collaboration";

export type TaskCardMeta = {
  eventName?: string;
  assigneeName?: string;
  creatorName?: string;
  commentCount?: number;
};

type TaskKanbanCardProps = {
  task: Task;
  meta: TaskCardMeta;
  compact?: boolean;
  dragging?: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  className?: string;
};

export default function TaskKanbanCard({
  task,
  meta,
  compact = false,
  dragging = false,
  onSelect,
  onDelete,
  className = "",
}: TaskKanbanCardProps) {
  const isComplete = task.column === "complete";
  const dueLabel = formatDueLabel(task.dueAt);
  const overdue = isTaskOverdue(task);
  const checklistDone = task.checklist.filter((c) => c.done).length;
  const checklistTotal = task.checklist.length;
  const categoryLabel = task.labels[0];

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-lg border bg-[#11111A]/95 transition-all duration-200",
        dragging
          ? "border-[#8B5CF6]/50 shadow-[0_12px_40px_rgba(0,0,0,0.45),0_0_24px_rgba(139,92,246,0.25)]"
          : "border-[#2A2A35] hover:border-[#52525B] hover:shadow-[0_8px_24px_rgba(0,0,0,0.35),0_0_12px_rgba(139,92,246,0.08)]",
        isComplete ? "opacity-75" : "",
        className,
      ].join(" ")}
    >
      <div
        className={`absolute left-0 top-0 h-full w-0.5 ${priorityAccent(task.priority)}`}
        aria-hidden
      />

      <button type="button" onClick={onSelect} className="w-full text-left">
        {meta.eventName ? (
          <div className="px-2.5 pt-2">
            <span className="inline-block max-w-full truncate rounded-md border border-[#8B5CF6]/30 bg-[#1A1630]/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#C4B5FD]">
              {meta.eventName}
            </span>
          </div>
        ) : null}

        <div className={compact ? "px-2.5 py-1.5" : "px-2.5 py-2"}>
          <p
            className={[
              compact ? "text-[12px]" : "text-[13px]",
              "font-medium leading-snug",
              isComplete ? "text-[#71717A] line-through" : "text-[#F5F5F7]",
            ].join(" ")}
          >
            {task.title}
          </p>

          <div
            className={[
              "mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]",
              isComplete ? "text-[#52525B]" : "text-[#71717A]",
            ].join(" ")}
          >
            {dueLabel ? (
              <span className={overdue && !isComplete ? "font-medium text-[#FCA5A5]" : ""}>
                {dueLabel}
              </span>
            ) : null}
            {meta.assigneeName ? <span>{meta.assigneeName} assigned</span> : null}
            {meta.creatorName ? <span>Added by {meta.creatorName}</span> : null}
            {(meta.commentCount ?? 0) > 0 ? (
              <span className="inline-flex items-center gap-0.5">
                <MessageSquare className="size-2.5" />
                {meta.commentCount} comment{(meta.commentCount ?? 0) === 1 ? "" : "s"}
              </span>
            ) : null}
            {checklistTotal > 0 ? (
              <span>
                {checklistDone}/{checklistTotal} checklist
              </span>
            ) : null}
            {categoryLabel ? <span className="capitalize">{categoryLabel}</span> : null}
            {task.priority !== "medium" && !isComplete ? (
              <span className="capitalize text-[#A1A1AA]">{task.priority}</span>
            ) : null}
          </div>
        </div>
      </button>

      {task.labels.includes("attachment") ? (
        <Paperclip
          className="absolute bottom-2 right-2 size-3 text-[#52525B]"
          aria-label="Has attachments"
        />
      ) : null}

      {!isComplete && onDelete ? (
        <button
          type="button"
          aria-label={`Delete ${task.title}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-md text-[#71717A] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#27272F] hover:text-[#FCA5A5]"
        >
          <X className="size-3.5" strokeWidth={2} />
        </button>
      ) : null}

      {meta.assigneeName ? (
        <div
          className="absolute bottom-2 right-2 flex size-5 items-center justify-center rounded-full border border-[#3F3F46] bg-[#18181F] text-[8px] font-semibold text-[#C4B5FD]"
          title={meta.assigneeName}
        >
          {memberInitials(meta.assigneeName)}
        </div>
      ) : null}
    </div>
  );
}
