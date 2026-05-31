import type { ManagedEventRecord } from "@/lib/data/events";
import type {
  AppNotification,
  Task,
  Workspace,
  WorkspaceInvite,
  WorkspaceMember,
} from "@/lib/types/collaboration";

export const WORKSPACE_DATA_INCLUDES = [
  "members",
  "events",
  "tasks",
  "invites",
  "commentCounts",
  "notifications",
] as const;

export type WorkspaceDataInclude = (typeof WORKSPACE_DATA_INCLUDES)[number];

export type WorkspaceDataResponse = {
  workspace: Workspace;
  membership: WorkspaceMember;
  members: WorkspaceMember[];
  events: ManagedEventRecord[];
  tasks?: Task[];
  invites?: WorkspaceInvite[];
  taskCommentCounts?: Record<string, number>;
  notifications?: AppNotification[];
  meta?: {
    invitesAccepted?: number;
  };
};

export type WorkspaceDataApiResult =
  | { ok: true; data: WorkspaceDataResponse }
  | { ok: false; needsBootstrap: true }
  | { ok: false; error: string };

export function parseIncludeParam(raw: string | null): WorkspaceDataInclude[] {
  if (!raw?.trim()) return ["members", "events"];
  const parts = raw.split(",").map((part) => part.trim()) as WorkspaceDataInclude[];
  return parts.filter((part) => WORKSPACE_DATA_INCLUDES.includes(part));
}

/** Fetch only what the destination route needs (lazy slices). */
export function includesForPath(pathname: string): WorkspaceDataInclude[] {
  const base: WorkspaceDataInclude[] = ["members", "events"];

  if (pathname.startsWith("/dashboard")) {
    return [...base, "tasks"];
  }
  if (pathname.startsWith("/team")) {
    return [...base, "tasks", "invites"];
  }
  if (pathname.startsWith("/tasks") || pathname.includes("/workspace")) {
    return [...base, "tasks", "commentCounts"];
  }
  if (pathname.startsWith("/events")) {
    return base;
  }
  if (pathname.startsWith("/run") || pathname.startsWith("/artists") || pathname.startsWith("/venues")) {
    return base;
  }
  if (pathname.startsWith("/settings")) {
    return base;
  }
  if (pathname.startsWith("/event-wizard")) {
    return base;
  }

  return base;
}

export function workspaceDataCacheKey(workspaceId: string, includes: WorkspaceDataInclude[]) {
  return ["workspace-data", workspaceId, ...includes.slice().sort()] as const;
}
