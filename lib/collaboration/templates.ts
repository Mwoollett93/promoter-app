import { newId } from "@/lib/collaboration/local-store";
import { createTask } from "@/lib/collaboration/tasks";
import { saveWizardEventDraft } from "@/lib/data/wizard-event-draft";
import type { SupabaseSession } from "@/lib/types/artist";
import type { TaskTemplate, EventTemplate } from "@/lib/types/collaboration";

const TASK_TEMPLATES_KEY = "promosync:collab:task-templates";
const EVENT_TEMPLATES_KEY = "promosync:collab:event-templates";

export const BUILTIN_TASK_TEMPLATES: Omit<TaskTemplate, "id" | "workspaceId" | "createdAt">[] = [
  {
    name: "Marketing rollout",
    description: "Standard promo push before doors",
    tasksJson: [
      { title: "Announce headliner", column: "todo" },
      { title: "Post ticket link", column: "todo" },
      { title: "Stories / reels push", column: "backlog" },
    ],
  },
  {
    name: "Hospitality checklist",
    description: "Green room and drinks",
    tasksJson: [
      { title: "Confirm rider", column: "todo" },
      { title: "Stock bar", column: "backlog" },
    ],
  },
  {
    name: "Artist advance workflow",
    description: "Tech and travel",
    tasksJson: [
      { title: "Collect tech rider", column: "todo" },
      { title: "Book transport", column: "waiting" },
    ],
  },
];

export const BUILTIN_EVENT_TEMPLATES: Omit<EventTemplate, "id" | "workspaceId" | "createdAt">[] = [
  {
    name: "DnB Event Template",
    description: "High-energy club night defaults",
    templateJson: { genre: "dnb", defaultCapacity: 800 },
  },
  {
    name: "Outdoor Event Template",
    description: "Festival-style planning hooks",
    templateJson: { genre: "outdoor", requiresWeatherPlan: true },
  },
];

function loadJson<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "[]") as T[];
  } catch {
    return [];
  }
}

export function listTaskTemplates(workspaceId: string): TaskTemplate[] {
  const custom = loadJson<TaskTemplate>(TASK_TEMPLATES_KEY).filter(
    (t) => t.workspaceId === workspaceId,
  );
  const now = new Date().toISOString();
  const builtins: TaskTemplate[] = BUILTIN_TASK_TEMPLATES.map((t) => ({
    ...t,
    id: `builtin-${t.name}`,
    workspaceId,
    createdAt: now,
  }));
  return [...builtins, ...custom];
}

export async function applyTaskTemplate(
  session: SupabaseSession,
  workspaceId: string,
  template: TaskTemplate,
  eventId?: string,
) {
  const items = template.tasksJson as Array<{ title: string; column?: string }>;
  for (const item of items) {
    await createTask(session, {
      workspaceId,
      eventId: eventId ?? null,
      title: item.title,
      column: (item.column as "todo") ?? "todo",
      labels: [template.name],
    });
  }
}

export function applyEventTemplate(template: EventTemplate): void {
  const json = (template.templateJson ?? {}) as Record<string, unknown>;
  const defaultCapacity =
    typeof json.defaultCapacity === "number" && Number.isFinite(json.defaultCapacity)
      ? json.defaultCapacity
      : undefined;

  const eventName = template.name.replace(/\s+template$/i, "").trim() || template.name;

  saveWizardEventDraft({
    date: new Date(),
    startTime: "22:00",
    eventName,
    description: template.description ?? undefined,
    venueCapacity: defaultCapacity,
  });
}

export function listEventTemplates(workspaceId: string): EventTemplate[] {
  const custom = loadJson<EventTemplate>(EVENT_TEMPLATES_KEY).filter(
    (t) => t.workspaceId === workspaceId,
  );
  const now = new Date().toISOString();
  const builtins: EventTemplate[] = BUILTIN_EVENT_TEMPLATES.map((t) => ({
    ...t,
    id: `builtin-ev-${t.name}`,
    workspaceId,
    createdAt: now,
  }));
  return [...builtins, ...custom];
}

export function saveCustomTaskTemplate(workspaceId: string, name: string, tasksJson: unknown[]) {
  const templates = loadJson<TaskTemplate>(TASK_TEMPLATES_KEY);
  templates.push({
    id: newId(),
    workspaceId,
    name,
    description: null,
    tasksJson,
    createdAt: new Date().toISOString(),
  });
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TASK_TEMPLATES_KEY, JSON.stringify(templates));
  }
}
