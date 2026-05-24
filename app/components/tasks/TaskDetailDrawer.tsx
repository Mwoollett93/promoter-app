"use client";

import * as React from "react";
import { Trash2, X } from "lucide-react";

import CommentThread from "@/app/components/collaboration/CommentThread";
import DateInput from "@/app/components/ui/DateInput";
import { getWorkspaceMemberLabel } from "@/lib/collaboration/member-display";
import { createTask, updateTask } from "@/lib/collaboration/tasks";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { newId } from "@/lib/collaboration/local-store";
import type { Task, TaskChecklistItem } from "@/lib/types/collaboration";
import type { WorkspaceMember } from "@/lib/types/collaboration";

const fieldClassName =
  "mt-1 w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 py-2 text-[#F5F5F7] outline-none transition-colors focus:border-[#8B5CF6] focus:ring-0 focus-visible:outline-none focus-visible:border-[#8B5CF6]";

function parseDueDate(iso?: string | null) {
  if (!iso) return undefined;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

type TaskDetailDrawerProps = {
  task: Task;
  members: WorkspaceMember[];
  isNew?: boolean;
  onClose: () => void;
  onUpdated: (task: Task) => void;
};

export default function TaskDetailDrawer({
  task,
  members,
  isNew = false,
  onClose,
  onUpdated,
}: TaskDetailDrawerProps) {
  const { session, workspace } = useWorkspace();
  const [title, setTitle] = React.useState(task.title);
  const [description, setDescription] = React.useState(task.description ?? "");
  const [assigneeId, setAssigneeId] = React.useState(task.assigneeId ?? "");
  const [dueDate, setDueDate] = React.useState<Date | undefined>(() => parseDueDate(task.dueAt));
  const [priority, setPriority] = React.useState(task.priority);
  const [checklist, setChecklist] = React.useState<TaskChecklistItem[]>(task.checklist);
  const [saving, setSaving] = React.useState(false);
  const newItemRef = React.useRef<HTMLInputElement | null>(null);

  async function save() {
    if (!session || !workspace || !title.trim()) return;
    setSaving(true);
    try {
      const dueAt = dueDate
        ? new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 12, 0, 0).toISOString()
        : null;
      const checklistPayload = checklist.map((item) => ({
        ...item,
        text: item.text.trim() || "Untitled item",
      }));

      if (isNew) {
        const created = await createTask(session, {
          workspaceId: workspace.id,
          eventId: task.eventId,
          title: title.trim(),
          column: task.column,
          description: description.trim() || undefined,
          assigneeId: assigneeId || null,
          dueAt,
          priority,
          checklist: checklistPayload,
        });
        onUpdated(created);
        onClose();
        return;
      }

      const updated = await updateTask(session, workspace.id, task.id, {
        title,
        description,
        assigneeId: assigneeId || null,
        dueAt,
        priority,
        checklist: checklistPayload,
      });
      onUpdated(updated);
    } finally {
      setSaving(false);
    }
  }

  function toggleChecklistItem(id: string) {
    setChecklist((items) =>
      items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
    );
  }

  function updateChecklistText(id: string, text: string) {
    setChecklist((items) =>
      items.map((item) => (item.id === id ? { ...item, text } : item)),
    );
  }

  function removeChecklistItem(id: string) {
    setChecklist((items) => items.filter((item) => item.id !== id));
  }

  function addChecklistItem() {
    setChecklist((items) => [...items, { id: newId(), text: "", done: false }]);
    requestAnimationFrame(() => newItemRef.current?.focus());
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <div className="flex h-full w-full max-w-md flex-col border-l border-[#232330] bg-[#11111A] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#232330] px-4 py-3">
          <h2 className="text-[16px] font-semibold text-[#F5F5F7]">
            {isNew ? "New task" : "Task"}
          </h2>
          <button type="button" onClick={onClose} className="text-[#A1A1AA] hover:text-[#F5F5F7]">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <label className="block">
            <span className="text-[11px] uppercase text-[#71717A]">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`${fieldClassName} text-[14px]`}
            />
          </label>

          <label className="block">
            <span className="text-[11px] uppercase text-[#71717A]">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${fieldClassName} text-[13px]`}
            />
          </label>

          <label className="block">
            <span className="text-[11px] uppercase text-[#71717A]">Assignee</span>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className={`${fieldClassName} text-[13px]`}
            >
              <option value="">Unassigned</option>
              {members
                .filter((m) => m.status === "active" && m.userId)
                .map((m) => (
                  <option key={m.id} value={m.userId!}>
                    {getWorkspaceMemberLabel(m)}
                  </option>
                ))}
            </select>
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DateInput
              label="Due date"
              required={false}
              value={dueDate}
              onChange={setDueDate}
              className="min-w-0"
            />
            <label className="block">
              <span className="text-[11px] uppercase text-[#71717A]">Priority</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task["priority"])}
                className={`${fieldClassName} text-[13px]`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase text-[#71717A]">Checklist</span>
              <button
                type="button"
                onClick={addChecklistItem}
                className="text-[12px] font-medium text-[#8B5CF6] hover:text-[#A855F7]"
              >
                + Add item
              </button>
            </div>
            <ul className="mt-2 space-y-2">
              {checklist.map((item, index) => (
                <li key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleChecklistItem(item.id)}
                    className="size-4 shrink-0 rounded border-[#3F3F46] bg-[#0B0B10] accent-[#7C3AED]"
                  />
                  <input
                    ref={index === checklist.length - 1 && item.text === "" ? newItemRef : undefined}
                    type="text"
                    value={item.text}
                    onChange={(e) => updateChecklistText(item.id, e.target.value)}
                    placeholder="Checklist item…"
                    className={`${fieldClassName} mt-0 flex-1 py-1.5 text-[13px]`}
                  />
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(item.id)}
                    className="shrink-0 text-[#71717A] hover:text-[#FCA5A5]"
                    aria-label="Remove checklist item"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
              {checklist.length === 0 ? (
                <li className="text-[12px] text-[#71717A]">No checklist items yet.</li>
              ) : null}
            </ul>
          </div>

          {isNew ? (
            <p className="text-[12px] text-[#71717A]">Save the task to add comments.</p>
          ) : (
            <CommentThread targetType="task" targetId={task.id} eventId={task.eventId ?? undefined} />
          )}
        </div>

        <div className="border-t border-[#232330] p-4">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || !title.trim()}
            className="w-full rounded-lg border border-[rgba(139,92,246,0.45)] bg-[#7C3AED] py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#6D28D9] disabled:opacity-50"
          >
            {saving ? "Saving…" : isNew ? "Create task" : "Save task"}
          </button>
        </div>
      </div>
    </div>
  );
}
