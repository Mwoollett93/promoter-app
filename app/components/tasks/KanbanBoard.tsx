"use client";

import * as React from "react";
import { X } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import TaskDetailDrawer from "@/app/components/tasks/TaskDetailDrawer";
import { logActivity } from "@/lib/collaboration/activity";
import { createTask, deleteTask, listTasks, moveTask } from "@/lib/collaboration/tasks";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { newId } from "@/lib/collaboration/local-store";
import { notifyTaskAssigned } from "@/lib/notifications/rules";
import type { Task, TaskColumn } from "@/lib/types/collaboration";
import { TASK_COLUMN_LABELS, TASK_COLUMNS } from "@/lib/types/collaboration";

function isDraftTaskId(taskId: string) {
  return taskId.startsWith("draft-");
}

const fieldClassName =
  "min-w-[200px] flex-1 rounded-lg border border-[#3F3F46] bg-[#11111A] px-3 py-2 text-[13px] text-[#F5F5F7] outline-none transition-colors placeholder:text-[#71717A] focus:border-[#8B5CF6] focus:ring-0 focus-visible:outline-none focus-visible:border-[#8B5CF6]";

type KanbanBoardProps = {
  workspaceId: string;
  eventId?: string;
};

export default function KanbanBoard({ workspaceId, eventId }: KanbanBoardProps) {
  const { session, members } = useWorkspace();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [newTitle, setNewTitle] = React.useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const refresh = React.useCallback(async () => {
    if (!session) return;
    const list = await listTasks(session, workspaceId, { eventId });
    setTasks(list);
  }, [session, workspaceId, eventId]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const tasksByColumn = React.useMemo(() => {
    const map: Record<TaskColumn, Task[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      waiting: [],
      complete: [],
    };
    for (const task of tasks) {
      map[task.column].push(task);
    }
    for (const col of TASK_COLUMNS) {
      map[col].sort((a, b) => a.position - b.position);
    }
    return map;
  }, [tasks]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || !session) return;

    const taskId = String(active.id);
    const overId = String(over.id);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const targetColumn = TASK_COLUMNS.includes(overId as TaskColumn)
      ? (overId as TaskColumn)
      : (tasks.find((t) => t.id === overId)?.column ?? task.column);

    if (targetColumn === task.column) return;

    const position = tasksByColumn[targetColumn].length;
    const optimistic: Task = {
      ...task,
      column: targetColumn,
      position,
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => prev.map((t) => (t.id === taskId ? optimistic : t)));

    try {
      const updated = await moveTask(session, taskId, targetColumn, position);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      void logActivity(session, {
        workspaceId,
        eventId: eventId ?? task.eventId,
        entityType: "task",
        entityId: taskId,
        verb: "moved",
        summary: `Moved "${task.title}" to ${TASK_COLUMN_LABELS[targetColumn]}`,
      });
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
    }
  }

  async function handleDeleteTask(task: Task) {
    if (!session) return;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    if (selectedTask?.id === task.id) setSelectedTask(null);
    try {
      await deleteTask(session, workspaceId, task.id);
      void logActivity(session, {
        workspaceId,
        eventId: eventId ?? task.eventId,
        entityType: "task",
        entityId: task.id,
        verb: "deleted",
        summary: `Deleted task "${task.title}"`,
      });
    } catch {
      void refresh();
    }
  }

  function buildDraftTask(title: string): Task {
    const now = new Date().toISOString();
    return {
      id: `draft-${newId()}`,
      workspaceId,
      eventId: eventId ?? null,
      artistId: null,
      venueId: null,
      bookingId: null,
      column: "todo",
      position: 0,
      title,
      description: null,
      assigneeId: null,
      dueAt: null,
      priority: "medium",
      labels: [],
      checklist: [],
      createdBy: session!.user.id,
      createdAt: now,
      updatedAt: now,
    };
  }

  async function handleQuickAdd(column: TaskColumn) {
    if (!session || !newTitle.trim()) return;
    const task = await createTask(session, {
      workspaceId,
      eventId: eventId ?? null,
      title: newTitle.trim(),
      column,
    });
    setNewTitle("");
    setTasks((prev) => [...prev, task]);
  }

  function handleCreateToDo() {
    if (!session) return;
    const trimmed = newTitle.trim();
    if (trimmed) {
      void handleQuickAdd("todo");
      return;
    }
    setSelectedTask(buildDraftTask(""));
  }

  const activeTask = tasks.find((t) => t.id === activeId) ?? null;
  const isNewDrawerTask = selectedTask ? isDraftTaskId(selectedTask.id) : false;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreateToDo();
          }}
          placeholder="Quick add task…"
          className={fieldClassName}
        />
        <button
          type="button"
          onClick={handleCreateToDo}
          className="rounded-lg border border-[rgba(139,92,246,0.45)] bg-[#7C3AED] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#6D28D9]"
        >
          Create To Do
        </button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={(e) => setActiveId(String(e.active.id))}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-3 lg:grid-cols-5">
          {TASK_COLUMNS.map((column) => (
            <KanbanColumn
              key={column}
              column={column}
              tasks={tasksByColumn[column]}
              onSelect={setSelectedTask}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeTask ? <TaskCardPreview task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      {selectedTask && session ? (
        <TaskDetailDrawer
          task={selectedTask}
          members={members}
          isNew={isNewDrawerTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={(updated) => {
            if (isNewDrawerTask) {
              setTasks((prev) => [...prev, updated]);
              setNewTitle("");
            } else {
              setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
              setSelectedTask(updated);
            }
            if (updated.assigneeId) {
              void notifyTaskAssigned(
                session,
                workspaceId,
                updated.assigneeId,
                updated.title,
                eventId ? `/events/${eventId}/workspace?tab=tasks` : "/tasks",
              );
            }
          }}
        />
      ) : null}
    </div>
  );
}

function KanbanColumn({
  column,
  tasks,
  onSelect,
  onDelete,
}: {
  column: TaskColumn;
  tasks: Task[];
  onSelect: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column });

  return (
    <div
      ref={setNodeRef}
      className={[
        "flex min-h-[320px] flex-col rounded-xl border border-[#232330] bg-[#0F0F17]",
        isOver ? "border-[#8B5CF6]/40 bg-[#14141F]" : "",
      ].join(" ")}
    >
      <div className="border-b border-[#232330] px-3 py-2">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[#A1A1AA]">
          {TASK_COLUMN_LABELS[column]}
        </p>
        <p className="text-[11px] text-[#71717A]">{tasks.length}</p>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-1 flex-col gap-2 p-2">
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </ul>
      </SortableContext>
    </div>
  );
}

function SortableTaskCard({
  task,
  onSelect,
  onDelete,
}: {
  task: Task;
  onSelect: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const isComplete = task.column === "complete";
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="touch-none">
      <div
        className={[
          "relative rounded-lg border bg-[#11111A] transition-colors",
          isComplete ? "border-[#27272F] opacity-80" : "border-[#3F3F46] hover:border-[#52525B]",
        ].join(" ")}
      >
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing pr-7">
          <button
            type="button"
            onClick={() => onSelect(task)}
            className="w-full px-3 py-2 text-left"
          >
            <p
              className={[
                "text-[13px] font-medium",
                isComplete ? "text-[#71717A] line-through" : "text-[#F5F5F7]",
              ].join(" ")}
            >
              {task.title}
            </p>
            {task.dueAt ? (
              <p
                className={[
                  "mt-1 text-[11px]",
                  isComplete ? "text-[#52525B] line-through" : "text-[#71717A]",
                ].join(" ")}
              >
                Due {new Date(task.dueAt).toLocaleDateString()}
              </p>
            ) : null}
          </button>
        </div>

        {!isComplete ? (
          <button
            type="button"
            aria-label={`Delete ${task.title}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task);
            }}
            className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-md text-[#71717A] transition-colors hover:bg-[#27272F] hover:text-[#FCA5A5]"
          >
            <X className="size-3.5" strokeWidth={2} />
          </button>
        ) : null}
      </div>
    </li>
  );
}

function TaskCardPreview({ task }: { task: Task }) {
  const isComplete = task.column === "complete";
  return (
    <div className="rounded-lg border border-[#8B5CF6]/40 bg-[#11111A] px-3 py-2 shadow-lg">
      <p
        className={[
          "text-[13px] font-medium",
          isComplete ? "text-[#71717A] line-through" : "text-[#F5F5F7]",
        ].join(" ")}
      >
        {task.title}
      </p>
    </div>
  );
}
