export const EVENT_WORKSPACE_TABS = [
  { id: "overview", label: "Overview" },
  { id: "sales", label: "Sales Tracker" },
  { id: "activity", label: "Activity" },
  { id: "tasks", label: "Tasks" },
  { id: "comments", label: "Comments" },
] as const;

export type EventWorkspaceTabId = (typeof EVENT_WORKSPACE_TABS)[number]["id"];

export function parseEventWorkspaceTab(value: string | null): EventWorkspaceTabId {
  const match = EVENT_WORKSPACE_TABS.find((tab) => tab.id === value);
  return match?.id ?? "overview";
}
