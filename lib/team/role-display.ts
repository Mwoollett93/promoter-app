import type { WorkspaceRole } from "@/lib/types/collaboration";
import { WORKSPACE_ROLE_LABELS } from "@/lib/types/collaboration";

/** Display labels for team UI (guest_list → Artist liaison). */
export const TEAM_ROLE_LABELS: Record<WorkspaceRole, string> = {
  ...WORKSPACE_ROLE_LABELS,
  guest_list: "Artist liaison",
};

export const TEAM_ROLES: WorkspaceRole[] = [
  "admin",
  "promoter",
  "marketing",
  "guest_list",
  "finance",
  "read_only",
];

export type RoleBadgeTone = {
  border: string;
  bg: string;
  text: string;
};

export const ROLE_BADGE_TONES: Record<WorkspaceRole, RoleBadgeTone> = {
  admin: {
    border: "border-[#8B5CF6]/40",
    bg: "bg-[#1A1630]/80",
    text: "text-[#C4B5FD]",
  },
  promoter: {
    border: "border-[#3B82F6]/35",
    bg: "bg-[#172554]/40",
    text: "text-[#93C5FD]",
  },
  marketing: {
    border: "border-[#F59E0B]/35",
    bg: "bg-[#422006]/40",
    text: "text-[#FCD34D]",
  },
  finance: {
    border: "border-[#22C55E]/30",
    bg: "bg-[#14532D]/40",
    text: "text-[#86EFAC]",
  },
  guest_list: {
    border: "border-[#EC4899]/35",
    bg: "bg-[#500724]/30",
    text: "text-[#F9A8D4]",
  },
  read_only: {
    border: "border-[#3F3F46]",
    bg: "bg-[#18181F]",
    text: "text-[#A1A1AA]",
  },
};

export type RolePermissionSummary = {
  pages: string;
  edits: string;
  finance: string;
  tasks: string;
};

export const ROLE_PERMISSION_SUMMARIES: Record<WorkspaceRole, RolePermissionSummary> = {
  admin: {
    pages: "All pages",
    edits: "Full edit & manage",
    finance: "Full visibility",
    tasks: "Assign & manage all",
  },
  promoter: {
    pages: "Events, artists, venues, tasks",
    edits: "Edit lineup & events",
    finance: "View & edit forecasts",
    tasks: "Create & assign tasks",
  },
  marketing: {
    pages: "Events, tasks, assets",
    edits: "Docs & comments",
    finance: "Hidden",
    tasks: "Marketing tasks",
  },
  finance: {
    pages: "Finance, events, tasks",
    edits: "Finance & documents",
    finance: "Full finance access",
    tasks: "Finance-related tasks",
  },
  guest_list: {
    pages: "Artists, events, tasks",
    edits: "Artist & hospitality",
    finance: "Limited",
    tasks: "Artist liaison tasks",
  },
  read_only: {
    pages: "View-only access",
    edits: "Comments only",
    finance: "View summaries",
    tasks: "View assigned",
  },
};
