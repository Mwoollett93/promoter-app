"use client";

import * as React from "react";

import { migrateLocalEventsToWorkspace } from "@/lib/data/events-migrate";
import { publishManagedEvents, type ManagedEventRecord } from "@/lib/data/events";
import {
  normalizeWorkspaceMember,
  normalizeWorkspaceMembers,
} from "@/lib/collaboration/member-display";
import { resolveEventCapabilities, type EventCapabilities } from "@/lib/collaboration/permissions";
import {
  listWorkspaceEvents,
  workspaceEventToManaged,
} from "@/lib/supabase/events";
import {
  clearLocalCollaborationMode,
  isLocalCollaborationMode,
} from "@/lib/collaboration/storage-mode";
import {
  acceptPendingWorkspaceInvites,
  ensureLocalWorkspace,
  ensureWorkspaceForUser,
  listWorkspaceMembers,
  probeCloudCollaboration,
} from "@/lib/supabase/workspace";
import { getValidSession } from "@/lib/supabase/browser";
import type { SupabaseSession } from "@/lib/types/artist";
import type {
  Workspace,
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
  role: WorkspaceRole | null;
  capabilities: EventCapabilities;
  error: string | null;
  usingLocalFallback: boolean;
  refresh: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  refreshEvents: () => Promise<void>;
};

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  const [session, setSession] = React.useState<SupabaseSession | null>(null);
  const [workspace, setWorkspace] = React.useState<Workspace | null>(null);
  const [membership, setMembership] = React.useState<WorkspaceMember | null>(null);
  const [members, setMembers] = React.useState<WorkspaceMember[]>([]);
  const [events, setEvents] = React.useState<ManagedEventRecord[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [usingLocalFallback, setUsingLocalFallback] = React.useState(false);

  const refreshMembers = React.useCallback(async () => {
    if (!session || !workspace) return;
    const list = await listWorkspaceMembers(session, workspace.id);
    setMembers(normalizeWorkspaceMembers(list));
  }, [session, workspace]);

  const refreshEvents = React.useCallback(async () => {
    if (!session || !workspace) return;
    const list = await listWorkspaceEvents(session, workspace.id);
    const mapped = list.map(workspaceEventToManaged);
    setEvents(mapped);
    publishManagedEvents(mapped);
  }, [session, workspace]);

  const refresh = React.useCallback(async () => {
    let current: SupabaseSession | null = null;
    try {
      current = await getValidSession();
    } catch {
      current = null;
    }

    if (!current) {
      setSession(null);
      setWorkspace(null);
      setMembership(null);
      setMembers([]);
      setEvents([]);
      setError(
        "Your session expired. Sign out and sign in again to restore cloud sync.",
      );
      setUsingLocalFallback(false);
      setReady(true);
      return;
    }

    setSession(current);
    setError(null);

    try {
      if (isLocalCollaborationMode(current.user.id)) {
        clearLocalCollaborationMode(current.user.id);
      }

      await acceptPendingWorkspaceInvites(current);

      const settings = loadSettings();
      let ws: Workspace;
      let mem: WorkspaceMember;
      let connectionError: string | null = null;

      try {
        const ensured = await ensureWorkspaceForUser(current, {
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
        const fallback = ensureLocalWorkspace(current, {
          companyName: settings.profile.company,
          displayName: settings.profile.fullName,
        });
        ws = fallback.workspace;
        mem = fallback.membership;
        setError(connectionError);
      }

      const localFallback = isLocalCollaborationMode(current.user.id);
      setUsingLocalFallback(localFallback);

      if (localFallback && !connectionError) {
        const probe = await probeCloudCollaboration(current);
        if (!probe.ok) {
          setError(probe.error);
        }
      }

      try {
        await migrateLocalEventsToWorkspace(current, ws.id);
      } catch {
        // Migration is best-effort; do not block the shell.
      }

      const [memberList, eventList] = await Promise.all([
        listWorkspaceMembers(current, ws.id),
        listWorkspaceEvents(current, ws.id),
      ]);

      const resolvedMembership =
        mem ??
        memberList.find((m) => m.userId === current.user.id && m.status === "active") ??
        memberList.find((m) => m.status === "active") ??
        mem;

      setWorkspace(ws);
      setMembership(normalizeWorkspaceMember(resolvedMembership));
      setMembers(
        normalizeWorkspaceMembers(memberList.length > 0 ? memberList : [mem]),
      );
      const mapped = eventList.map(workspaceEventToManaged);
      setEvents(mapped);
      publishManagedEvents(mapped);
    } catch (err) {
      const settings = loadSettings();
      const fallback = ensureLocalWorkspace(current, {
        companyName: settings.profile.company,
        displayName: settings.profile.fullName,
      });
      setWorkspace(fallback.workspace);
      setMembership(normalizeWorkspaceMember(fallback.membership));
      setMembers([fallback.membership]);
      setEvents([]);
      setUsingLocalFallback(true);
      setError(
        err instanceof Error ? err.message : "Unable to load workspace. Using offline mode.",
      );
    } finally {
      setReady(true);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  React.useEffect(() => {
    function onEventsUpdated() {
      void refreshEvents();
    }
    window.addEventListener("promosync:events-updated", onEventsUpdated);
    return () => window.removeEventListener("promosync:events-updated", onEventsUpdated);
  }, [refreshEvents]);

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
