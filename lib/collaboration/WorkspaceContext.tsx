"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { migrateLocalEventsToWorkspace } from "@/lib/data/events-migrate";
import { publishManagedEvents, type ManagedEventRecord } from "@/lib/data/events";
import {
  normalizeWorkspaceMember,
  normalizeWorkspaceMembers,
} from "@/lib/collaboration/member-display";
import { resolveEventCapabilities, type EventCapabilities } from "@/lib/collaboration/permissions";
import { shouldUseLocalCollaboration, isLocalCollaborationMode, clearLocalCollaborationMode } from "@/lib/collaboration/storage-mode";
import {
  includesForPath,
  type WorkspaceDataInclude,
} from "@/lib/collaboration/workspace-data-types";
import {
  useWorkspaceDataSWR,
  WorkspaceBootstrapRequiredError,
} from "@/lib/collaboration/workspace-data-client";
import {
  listWorkspaceEvents,
  workspaceEventToManaged,
} from "@/lib/supabase/events";
import {
  ensureLocalWorkspace,
  ensureWorkspaceForUser,
  listWorkspaceMembers,
  probeCloudCollaboration,
} from "@/lib/supabase/workspace";
import { getValidSession } from "@/lib/supabase/browser";
import type { SupabaseSession } from "@/lib/types/artist";
import type {
  AppNotification,
  Task,
  Workspace,
  WorkspaceInvite,
  WorkspaceMember,
  WorkspaceRole,
} from "@/lib/types/collaboration";
import { loadSettings } from "@/lib/settings/settings";

type WorkspaceContextValue = {
  ready: boolean;
  session: SupabaseSession | null;
  workspace: Workspace | null;
  membership: WorkspaceMember | null;
  members: WorkspaceMember[];
  events: ManagedEventRecord[];
  tasks: Task[];
  invites: WorkspaceInvite[];
  taskCommentCounts: Record<string, number>;
  notifications: AppNotification[];
  role: WorkspaceRole | null;
  capabilities: EventCapabilities;
  error: string | null;
  usingLocalFallback: boolean;
  refresh: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  refreshEvents: () => Promise<void>;
};

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(null);

async function bootstrapLocalWorkspace(session: SupabaseSession) {
  const settings = loadSettings();
  let connectionError: string | null = null;
  let ws: Workspace;
  let mem: WorkspaceMember;

  try {
    const ensured = await ensureWorkspaceForUser(session, {
      companyName: settings.profile.company,
      displayName: settings.profile.fullName,
      forceCloud: true,
    });
    ws = ensured.workspace;
    mem = ensured.membership;
  } catch (err) {
    connectionError =
      err instanceof Error
        ? err.message
        : "Workspace could not connect to Supabase. Using offline mode on this device.";
    const fallback = ensureLocalWorkspace(session, {
      companyName: settings.profile.company,
      displayName: settings.profile.fullName,
    });
    ws = fallback.workspace;
    mem = fallback.membership;
    return {
      ws,
      mem,
      members: normalizeWorkspaceMembers([mem]),
      events: [] as ManagedEventRecord[],
      connectionError,
      usingLocalFallback: true,
    };
  }

  const localFallback = isLocalCollaborationMode(session.user.id);
  if (localFallback && !connectionError) {
    const probe = await probeCloudCollaboration(session);
    if (!probe.ok) {
      connectionError = probe.error;
    }
  }

  try {
    await migrateLocalEventsToWorkspace(session, ws.id);
  } catch {
    /* best-effort */
  }

  const [memberList, eventList] = await Promise.all([
    listWorkspaceMembers(session, ws.id),
    listWorkspaceEvents(session, ws.id),
  ]);

  const resolvedMembership =
    mem ??
    memberList.find((m) => m.userId === session.user.id && m.status === "active") ??
    memberList.find((m) => m.status === "active") ??
    mem;

  return {
    ws,
    mem: resolvedMembership,
    members: normalizeWorkspaceMembers(memberList.length > 0 ? memberList : [mem]),
    events: eventList.map(workspaceEventToManaged),
    connectionError,
    usingLocalFallback: localFallback || Boolean(connectionError),
  };
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const includes = React.useMemo(() => includesForPath(pathname), [pathname]);

  const [session, setSession] = React.useState<SupabaseSession | null>(null);
  const [sessionReady, setSessionReady] = React.useState(false);
  const [usingLocalFallback, setUsingLocalFallback] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [localPayload, setLocalPayload] = React.useState<{
    workspace: Workspace;
    membership: WorkspaceMember;
    members: WorkspaceMember[];
    events: ManagedEventRecord[];
  } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void getValidSession().then((current) => {
      if (cancelled) return;
      setSession(current);
      setSessionReady(true);
      if (current && shouldUseLocalCollaboration(current)) {
        setUsingLocalFallback(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const cloudQuery = useWorkspaceDataSWR(
    session && !usingLocalFallback ? session : null,
    includes,
    usingLocalFallback,
  );

  React.useEffect(() => {
    if (!session || usingLocalFallback) return;
    if (!(cloudQuery.error instanceof WorkspaceBootstrapRequiredError)) return;

    let cancelled = false;
    void (async () => {
      try {
        const settings = loadSettings();
        await ensureWorkspaceForUser(session, {
          companyName: settings.profile.company,
          displayName: settings.profile.fullName,
          forceCloud: true,
        });
        if (!cancelled) await cloudQuery.mutate();
      } catch (err) {
        if (!cancelled) {
          setUsingLocalFallback(true);
          setError(err instanceof Error ? err.message : "Unable to bootstrap workspace.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cloudQuery.error, cloudQuery.mutate, session, usingLocalFallback]);

  React.useEffect(() => {
    if (!session || !usingLocalFallback || localPayload) return;
    let cancelled = false;

    void bootstrapLocalWorkspace(session).then((result) => {
      if (cancelled) return;
      setLocalPayload({
        workspace: result.ws,
        membership: normalizeWorkspaceMember(result.mem),
        members: result.members,
        events: result.events,
      });
      publishManagedEvents(result.events);
      setError(result.connectionError);
      setUsingLocalFallback(result.usingLocalFallback);
    });

    return () => {
      cancelled = true;
    };
  }, [session, usingLocalFallback, localPayload]);

  React.useEffect(() => {
    if (!cloudQuery.data?.events) return;
    publishManagedEvents(cloudQuery.data.events);
  }, [cloudQuery.data?.events]);

  React.useEffect(() => {
    function onEventsUpdated() {
      void cloudQuery.mutate();
    }
    window.addEventListener("promosync:events-updated", onEventsUpdated);
    return () => window.removeEventListener("promosync:events-updated", onEventsUpdated);
  }, [cloudQuery.mutate]);

  const workspace = usingLocalFallback ? localPayload?.workspace ?? null : cloudQuery.data?.workspace ?? null;
  const membership = usingLocalFallback
    ? localPayload?.membership ?? null
    : cloudQuery.data?.membership
      ? normalizeWorkspaceMember(cloudQuery.data.membership)
      : null;
  const members = usingLocalFallback
    ? localPayload?.members ?? []
    : normalizeWorkspaceMembers(cloudQuery.data?.members ?? []);
  const events = usingLocalFallback ? localPayload?.events ?? [] : cloudQuery.data?.events ?? [];
  const tasks = cloudQuery.data?.tasks ?? [];
  const invites = cloudQuery.data?.invites ?? [];
  const taskCommentCounts = cloudQuery.data?.taskCommentCounts ?? {};
  const notifications = cloudQuery.data?.notifications ?? [];

  const ready =
    sessionReady &&
    (usingLocalFallback ? localPayload != null : !cloudQuery.isLoading || cloudQuery.data != null);

  const refresh = React.useCallback(async () => {
    if (!session) return;
    if (usingLocalFallback) {
      const result = await bootstrapLocalWorkspace(session);
      setLocalPayload({
        workspace: result.ws,
        membership: normalizeWorkspaceMember(result.mem),
        members: result.members,
        events: result.events,
      });
      publishManagedEvents(result.events);
      setError(result.connectionError);
      return;
    }
    if (isLocalCollaborationMode(session.user.id)) {
      clearLocalCollaborationMode(session.user.id);
    }
    await cloudQuery.mutate();
  }, [session, usingLocalFallback, cloudQuery.mutate]);

  const refreshMembers = React.useCallback(async () => {
    await refresh();
  }, [refresh]);

  const refreshEvents = React.useCallback(async () => {
    await refresh();
  }, [refresh]);

  const role = membership?.role ?? null;
  const capabilities = resolveEventCapabilities(
    role ?? (workspace?.createdBy === session?.user.id ? "admin" : "read_only"),
  );

  const value = React.useMemo<WorkspaceContextValue>(
    () => ({
      ready,
      session,
      workspace,
      membership,
      members,
      events,
      tasks,
      invites,
      taskCommentCounts,
      notifications,
      role,
      capabilities,
      error,
      usingLocalFallback,
      refresh,
      refreshMembers,
      refreshEvents,
    }),
    [
      ready,
      session,
      workspace,
      membership,
      members,
      events,
      tasks,
      invites,
      taskCommentCounts,
      notifications,
      role,
      capabilities,
      error,
      usingLocalFallback,
      refresh,
      refreshMembers,
      refreshEvents,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = React.useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}

export function useWorkspaceIncludes(): WorkspaceDataInclude[] {
  const pathname = usePathname();
  return React.useMemo(() => includesForPath(pathname), [pathname]);
}
