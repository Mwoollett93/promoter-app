"use client";

import * as React from "react";
import { X } from "lucide-react";

import CommentThread from "@/app/components/collaboration/CommentThread";
import { updateTask } from "@/lib/collaboration/tasks";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import type { Task, TaskChecklistItem } from "@/lib/types/collaboration";
import type { WorkspaceMember } from "@/lib/types/collaboration";
import { newId } from "@/lib/collaboration/local-store";

type TaskDetailDrawerProps = {
  task: Task;
  members: WorkspaceMember[];
  onClose: () => void;
  onUpdated: (task: Task) => void;
};

export default function TaskDetailDrawer({
  task,
  members,
  onClose,
  onUpdated,
}: TaskDetailDrawerProps) {
  const { session, workspace } = useWorkspace();
  const [title, setTitle] = React.useState(task.title);
  const [description, setDescription] = React.useState(task.description ?? "");
  const [assigneeId, setAssigneeId] = React.useState(task.assigneeId ?? "");
  const [dueAt, setDueAt] = React.useState(task.dueAt?.slice(0, 10) ?? "");
  const [priority, setPriority] = React.useState(task.priority);
  const [checklist, setChecklist] = React.useState<TaskChecklistItem[]>(task.checklist);
  const [saving, setSaving] = React.useState(false);

  async function save() {
    if (!session || !workspace) return;
    setSaving(true);
    try {
      const updated = await updateTask(session, workspace.id, task.id, {
        title,
        description,
        assigneeId: assigneeId || null,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        priority,
        checklist,
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

  function addChecklistItem() {
    setChecklist((items) => [...items, { id: newId(), text: "New item", done: false }]);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <div className="flex h-full w-full max-w-md flex-col border-l border-[#232330] bg-[#11111A] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#232330] px-4 py-3">
          <h2 className="text-[16px] font-semibold text-[#F5F5F7]">Task</h2>
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
              className="mt-1 w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 py-2 text-[14px] text-[#F5F5F7]"
            />
          </label>

          <label className="block">
            <span className="text-[11px] uppercase text-[#71717A]">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 py-2 text-[13px] text-[#F5F5F7]"
            />
          </label>

          <label className="block">
            <span className="text-[11px] uppercase text-[#71717A]">Assignee</span>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 py-2 text-[13px] text-[#F5F5F7]"
            >
              <option value="">Unassigned</option>
              {members
                .filter((m) => m.status === "active" && m.userId)
                .map((m) => (
                  <option key={m.id} value={m.userId!}>
                    {m.displayName ?? m.invitedEmail}
                  </option>
                ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] uppercase text-[#71717A]">Due date</span>
              <input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 py-2 text-[13px] text-[#F5F5F7]"
              />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase text-[#71717A]">Priority</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task["priority"])}
                className="mt-1 w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 py-2 text-[13px] text-[#F5F5F7]"
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
                className="text-[12px] text-[#8B5CF6]"
              >
                + Add
              </button>
            </div>
            <ul className="mt-2 space-y-1">
              {checklist.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleChecklistItem(item.id)}
                  />
                  <span className={item.done ? "text-[#71717A] line-through" : "text-[#E4E4E7]"}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <CommentThread targetType="task" targetId={task.id} eventId={task.eventId ?? undefined} />
        </div>

        <div className="border-t border-[#232330] p-4">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="w-full rounded-lg bg-[#7C3AED] py-2.5 text-[14px] font-medium text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save task"}
          </button>
        </div>
      </div>
    </div>
  );
}
