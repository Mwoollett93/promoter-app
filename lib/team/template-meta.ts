import type { EventTemplate, TaskTemplate } from "@/lib/types/collaboration";

export function taskTemplateMeta(template: TaskTemplate) {
  const items = (template.tasksJson ?? []) as Array<{ title?: string; column?: string }>;
  const categories = new Set<string>();
  for (const item of items) {
    if (item.column) categories.add(item.column.replace("_", " "));
  }
  if (categories.size === 0) categories.add("operations");

  return {
    taskCount: items.length,
    estimatedDuration: items.length <= 2 ? "~1 day" : items.length <= 5 ? "~3 days" : "~1 week",
    categories: Array.from(categories).slice(0, 4),
  };
}

export function eventTemplateMeta(template: EventTemplate) {
  const json = template.templateJson ?? {};
  const genre = typeof json.genre === "string" ? json.genre : "club";
  const capacity =
    typeof json.defaultCapacity === "number" ? `${json.defaultCapacity} cap` : "Flexible cap";

  return {
    eventType: genre.toUpperCase(),
    workflows: ["Lineup", "Finance", "Marketing"],
    ticketing: "Multi-tier defaults",
    finance: "Break-even model included",
    venue: typeof json.requiresWeatherPlan === "boolean" ? "Outdoor requirements" : "Standard specs",
    marketing: "4-week rollout schedule",
    capacity,
  };
}
