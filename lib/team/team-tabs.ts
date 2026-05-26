export const TEAM_TABS = [
  { id: "overview", label: "Overview" },
  { id: "members", label: "Members" },
  { id: "templates", label: "Templates" },
  { id: "activity", label: "Activity" },
  { id: "settings", label: "Settings" },
] as const;

export type TeamTabId = (typeof TEAM_TABS)[number]["id"];

export function parseTeamTab(value: string | null): TeamTabId {
  if (value === "members" || value === "templates" || value === "activity" || value === "settings") {
    return value;
  }
  return "overview";
}
