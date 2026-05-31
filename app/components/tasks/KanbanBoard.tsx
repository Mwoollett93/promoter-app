"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import OperationalSuggestionsBar from "@/app/components/tasks/OperationalSuggestionsBar";
import TaskBoardMetrics from "@/app/components/tasks/TaskBoardMetrics";
import TaskBoardToolbar, { type BoardViewMode } from "@/app/components/tasks/TaskBoardToolbar";
import TaskDetailDrawer from "@/app/components/tasks/TaskDetailDrawer";
import TaskKanbanCard, { type TaskCardMeta } from "@/app/components/tasks/TaskKanbanCard";
import { listTaskCommentCounts } from "@/lib/collaboration/comments";
import {
  readTasksBoardCache,
  tasksBoardCacheKey,
  writeTasksBoardCache,
} from "@/lib/collaboration/tasks-board-cache";
import { logActivity } from "@/lib/collaboration/activity";
import { getWorkspaceMemberLabel } from "@/lib/collaboration/member-display";
import { createTask, deleteTask, listTasks, moveTask } from "@/lib/collaboration/tasks";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { newId } from "@/lib/collaboration/local-store";
import { notifyTaskAssigned } from "@/lib/notifications/rules";
import { KANBAN_COLUMN_THEME } from "@/lib/tasks/kanban-column-theme";
import {
  buildOperationalSuggestions,
  type OperationalSuggestion,
} from "@/lib/tasks/operational-suggestions";
import { boardMetrics, filterTasks } from "@/lib/tasks/task-board-utils";
import type { Task, TaskColumn } from "@/lib/types/collaboration";
import { TASK_COLUMN_LABELS, TASK_COLUMNS } from "@/lib/types/collaboration";
import { useIsMobile } from "@/lib/ui/use-breakpoint";

function isDraftTaskId(taskId: string) {
  return taskId.startsWith("draft-");
}

type KanbanBoardProps = {
  workspaceId: string;
  eventId?: string;
};

export default function KanbanBoard({ workspaceId, eventId: lockedEventId }: KanbanBoardProps) {
  const {
    session,
    members,
    events,
    membership,
    tasks: workspaceTasks,
    taskCommentCounts: workspaceCommentCounts,
    usingLocalFallback,
    refresh: refreshWorkspace,
    ready: workspaceReady,
  } = useWorkspace();
  const cacheKey = tasksBoardCacheKey(workspaceId, lockedEventId);

  const contextTasks = React.useMemo(() => {
    if (lockedEventId) {
      return workspaceTasks.filter((task) => task.eventId === lockedEventId);
    }
    return workspaceTasks;
  }, [workspaceTasks, lockedEventId]);

  const [tasks, setTasks] = React.useState<Task[]>(() => readTasksBoardCache(cacheKey) ?? contextTasks);
  const [commentCounts, setCommentCounts] = React.useState<Record<string, number>>(workspaceCommentCounts);
  const [loadingTasks, setLoadingTasks] = React.useState(
    () => readTasksBoardCache(cacheKey) == null && contextTasks.length === 0,
  );
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [overColumn, setOverColumn] = React.useState<TaskColumn | null>(null);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [newTitle, setNewTitle] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [eventFilter, setEventFilter] = React.useState<string | null>(lockedEventId ?? null);
  const [assigneeFilter, setAssigneeFilter] = React.useState<string | null>(null);
  const [assignedToMe, setAssignedToMe] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<TaskColumn | null>(null);
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = React.useState<BoardViewMode>("kanban");
  const [compact, setCompact] = React.useState(false);

  React.useEffect(() => {
    if (isMobile) setViewMode("list");
  }, [isMobile]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const refresh = React.useCallback(
    async (options?: { silent?: boolean }) => {
      if (!session) return;

      if (!usingLocalFallback) {
        if (!options?.silent && tasks.length === 0) setLoadingTasks(true);
        await refreshWorkspace();
        setLoadingTasks(false);
        return;
      }

      if (!options?.silent && tasks.length === 0) setLoadingTasks(true);

      const list = await listTasks(session, workspaceId, {
        eventId: lockedEventId,
      });
      setTasks(list);
      writeTasksBoardCache(cacheKey, list);
      setLoadingTasks(false);

      void listTaskCommentCounts(session, workspaceId)
        .then(setCommentCounts)
        .catch(() => setCommentCounts({}));
    },
    [session, workspaceId, lockedEventId, cacheKey, tasks.length, usingLocalFallback, refreshWorkspace],
  );

  React.useEffect(() => {
    if (!workspaceReady || usingLocalFallback) return;
    setTasks(contextTasks);
    writeTasksBoardCache(cacheKey, contextTasks);
    setCommentCounts(workspaceCommentCounts);
    setLoadingTasks(false);
  }, [workspaceReady, usingLocalFallback, contextTasks, workspaceCommentCounts, cacheKey]);

  React.useEffect(() => {
    if (!usingLocalFallback) return;
    const cached = readTasksBoardCache(cacheKey);
    void refresh({ silent: cached != null });
  }, [refresh, cacheKey, usingLocalFallback]);

  React.useEffect(() => {
    if (lockedEventId) setEventFilter(lockedEventId);
  }, [lockedEventId]);

  const eventNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const ev of events) map.set(ev.id, ev.name);
    return map;
  }, [events]);

  const assigneeNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) {
      if (m.userId) map.set(m.userId, getWorkspaceMemberLabel(m));
    }
    return map;
  }, [members]);

  const filteredTasks = React.useMemo(
    () =>
      filterTasks(tasks, {
        search,
        eventId: eventFilter,
        assigneeId: assigneeFilter,
        assignedToMe,
        statusColumn: statusFilter,
        currentUserId: membership?.userId ?? session?.user.id,
      }),
    [
      tasks,
      search,
      eventFilter,
      assigneeFilter,
      assignedToMe,
      statusFilter,
      membership?.userId,
      session?.user.id,
    ],
  );

  const metrics = React.useMemo(() => boardMetrics(filteredTasks), [filteredTasks]);

  const suggestions = React.useMemo(
    () => buildOperationalSuggestions(events),
    [events],
  );

  const tasksByColumn = React.useMemo(() => {
    const map: Record<TaskColumn, Task[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      waiting: [],
      complete: [],
    };
    for (const task of filteredTasks) {
      map[task.column].push(task);
    }
    for (const col of TASK_COLUMNS) {
      map[col].sort((a, b) => a.position - b.position);
    }
    return map;
  }, [filteredTasks]);

  const taskMeta = React.useCallback(
    (task: Task): TaskCardMeta => ({
      eventName: task.eventId ? eventNameById.get(task.eventId) : undefined,
      assigneeName: task.assigneeId
        ? (task.assigneeName ?? assigneeNameById.get(task.assigneeId))
        : undefined,
      creatorName: assigneeNameById.get(task.createdBy),
      commentCount: commentCounts[task.id],
    }),
    [eventNameById, assigneeNameById, commentCounts],
  );

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over ? String(event.over.id) : null;
    if (!overId) {
      setOverColumn(null);
      return;
    }
    if (TASK_COLUMNS.includes(overId as TaskColumn)) {
      setOverColumn(overId as TaskColumn);
      return;
    }
    const overTask = tasks.find((t) => t.id === overId);
    setOverColumn(overTask?.column ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setOverColumn(null);
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
        eventId: lockedEventId ?? task.eventId,
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
        eventId: lockedEventId ?? task.eventId,
        entityType: "task",
        entityId: task.id,
        verb: "deleted",
        summary: `Deleted task "${task.title}"`,
      });
    } catch {
      void refresh();
    }
  }

  function buildDraftTask(title: string, partial?: Partial<Task>): Task {
    const now = new Date().toISOString();
    return {
      id: `draft-${newId()}`,
      workspaceId,
      eventId: partial?.eventId ?? lockedEventId ?? eventFilter ?? null,
      artistId: null,
      venueId: null,
      bookingId: null,
      column: partial?.column ?? "todo",
      position: 0,
      title,
      description: partial?.description ?? null,
      assigneeId: null,
      dueAt: null,
      priority: "medium",
      labels: partial?.labels ?? [],
      checklist: [],
      createdBy: session!.user.id,
      createdAt: now,
      updatedAt: now,
    };
  }

  async function handleQuickAdd() {
    if (!session || !newTitle.trim()) return;
    const task = await createTask(session, {
      workspaceId,
      eventId: lockedEventId ?? eventFilter ?? null,
      title: newTitle.trim(),
      column: "todo",
    });
    setNewTitle("");
    setTasks((prev) => [...prev, task]);
  }

  function handleCreateTask() {
    if (!session) return;
    const trimmed = newTitle.trim();
    if (trimmed) {
      void handleQuickAdd();
      return;
    }
    setSelectedTask(buildDraftTask(""));
  }

  async function handleSuggestionCreate(suggestion: OperationalSuggestion) {
    if (!session) return;
    const task = await createTask(session, {
      workspaceId,
      eventId: suggestion.eventId,
      title: suggestion.title,
      description: suggestion.detail,
      column: "todo",
      labels: [suggestion.label, "auto"],
    });
    setTasks((prev) => [...prev, task]);
  }

  const activeTask = tasks.find((t) => t.id === activeId) ?? null;
  const isNewDrawerTask = selectedTask ? isDraftTaskId(selectedTask.id) : false;
  const columnMinH = compact ? "min-h-[140px]" : "min-h-[180px]";
  const columnMaxH = compact
    ? "max-h-[calc(100vh-300px)]"
    : "max-h-[calc(100vh-340px)]";

  return (
    <div className="space-y-3">
      <TaskBoardToolbar
        events={events}
        members={members}
        search={search}
        onSearchChange={setSearch}
        eventFilter={eventFilter}
        onEventFilterChange={setEventFilter}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        assignedToMe={assignedToMe}
        onAssignedToMeChange={setAssignedToMe}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        compact={compact}
        onCompactChange={setCompact}
        quickAddValue={newTitle}
        onQuickAddChange={setNewTitle}
        onQuickAdd={handleCreateTask}
      />

      {loadingTasks ? (
        <div className="rounded-xl border border-[#232330] bg-[#11111A] px-4 py-8 text-center text-[13px] text-[#71717A]">
          Loading tasks…
        </div>
      ) : (
        <TaskBoardMetrics {...metrics} />
      )}

      {!loadingTasks ? (
        <OperationalSuggestionsBar
          suggestions={suggestions}
          onCreateFromSuggestion={(s) => void handleSuggestionCreate(s)}
        />
      ) : null}

      {viewMode === "list" ? (
        <TaskListView
          tasks={filteredTasks}
          taskMeta={taskMeta}
          compact={compact}
          onSelect={setSelectedTask}
          onDelete={handleDeleteTask}
        />
      ) : loadingTasks ? null : (
        <DndContext
          sensors={sensors}
          onDragStart={(e) => setActiveId(String(e.active.id))}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            setActiveId(null);
            setOverColumn(null);
          }}
        >
          <div className="grid gap-2 lg:grid-cols-5">
            {TASK_COLUMNS.map((column) => (
              <KanbanColumn
                key={column}
                column={column}
                tasks={tasksByColumn[column]}
                compact={compact}
                columnMinH={columnMinH}
                columnMaxH={columnMaxH}
                isDropTarget={overColumn === column}
                taskMeta={taskMeta}
                onSelect={setSelectedTask}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
            {activeTask ? (
              <TaskKanbanCard
                task={activeTask}
                meta={taskMeta(activeTask)}
                compact={compact}
                dragging
                onSelect={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {selectedTask && session ? (
        <TaskDetailDrawer
          task={selectedTask}
          members={members}
          events={events}
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
                lockedEventId
                  ? `/events/${lockedEventId}/workspace?tab=tasks`
                  : "/tasks",
              );
            }
            void refresh({ silent: true });
          }}
        />
      ) : null}
    </div>
  );
}

function KanbanColumn({
  column,
  tasks,
  compact,
  columnMinH,
  columnMaxH,
  isDropTarget,
  taskMeta,
  onSelect,
  onDelete,
}: {
  column: TaskColumn;
  tasks: Task[];
  compact: boolean;
  columnMinH: string;
  columnMaxH: string;
  isDropTarget: boolean;
  taskMeta: (task: Task) => TaskCardMeta;
  onSelect: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const theme = KANBAN_COLUMN_THEME[column];
  const { setNodeRef, isOver } = useDroppable({ id: column });
  const highlight = isOver || isDropTarget;
  const Icon = theme.Icon;

  return (
    <div
      ref={setNodeRef}
      className={[
        "flex flex-col rounded-xl border backdrop-blur-sm transition-all duration-200",
        theme.columnClass,
        columnMinH,
        columnMaxH,
        highlight ? `ring-1 ring-inset ${theme.dropGlow}` : "",
        highlight ? "border-[#8B5CF6]/30" : "",
      ].join(" ")}
    >
      <div
        className={[
          "flex shrink-0 items-center justify-between gap-2 rounded-t-xl border-b px-2.5 py-2",
          theme.headerClass,
        ].join(" ")}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <Icon
            className={[
              "size-3.5 shrink-0",
              column === "in_progress" && highlight ? "animate-spin" : "",
            ].join(" ")}
            strokeWidth={2}
          />
          <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-[#E4E4E7]">
            {theme.label}
          </span>
        </div>
        <span
          className={[
            "shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
            theme.badgeClass,
          ].join(" ")}
        >
          {tasks.length}
        </span>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul
          className={[
            "flex flex-1 flex-col overflow-y-auto p-1.5",
            compact ? "gap-1" : "gap-1.5",
          ].join(" ")}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              meta={taskMeta(task)}
              compact={compact}
              onSelect={() => onSelect(task)}
              onDelete={() => onDelete(task)}
            />
          ))}
          {highlight && tasks.length === 0 ? (
            <li className="rounded-lg border border-dashed border-[#8B5CF6]/40 bg-[#1A1630]/30 px-2 py-3 text-center text-[10px] text-[#A78BFA]">
              Drop here
            </li>
          ) : null}
        </ul>
      </SortableContext>
    </div>
  );
}

function SortableTaskCard({
  task,
  meta,
  compact,
  onSelect,
  onDelete,
}: {
  task: Task;
  meta: TaskCardMeta;
  compact: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <li ref={setNodeRef} style={style} className="touch-none">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <TaskKanbanCard
          task={task}
          meta={meta}
          compact={compact}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      </div>
    </li>
  );
}

function TaskListView({
  tasks,
  taskMeta,
  compact,
  onSelect,
  onDelete,
}: {
  tasks: Task[];
  taskMeta: (task: Task) => TaskCardMeta;
  compact: boolean;
  onSelect: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#232330]/90 bg-[#0F0F17]">
      <ul className="divide-y divide-[#232330]">
        {tasks.length === 0 ? (
          <li className="px-4 py-8 text-center text-[13px] text-[#71717A]">No tasks match filters.</li>
        ) : (
          tasks.map((task) => {
            const meta = taskMeta(task);
            const theme = KANBAN_COLUMN_THEME[task.column];
            return (
              <li
                key={task.id}
                className="flex flex-wrap items-center gap-3 px-3 py-2 transition-colors hover:bg-[#14141F]/80"
              >
                <span
                  className={[
                    "rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase",
                    theme.badgeClass,
                  ].join(" ")}
                >
                  {theme.label}
                </span>
                <button
                  type="button"
                  onClick={() => onSelect(task)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-[13px] font-medium text-[#F5F5F7]">{task.title}</p>
                  <p className="text-[11px] text-[#71717A]">
                    {[meta.eventName, meta.assigneeName].filter(Boolean).join(" · ") || "—"}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(task)}
                  className="text-[11px] text-[#71717A] hover:text-[#FCA5A5]"
                >
                  Delete
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
