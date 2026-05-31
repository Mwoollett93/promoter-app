"use client";

import * as React from "react";

import type { PendingInviteRow } from "@/app/components/team/PendingInviteList";
import { canInviteMembers } from "@/lib/collaboration/permissions";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { computeMemberWorkloads } from "@/lib/team/member-workload";
import { touchCurrentUserPresence } from "@/lib/team/presence";
import { buildTeamNotifications } from "@/lib/team/team-notifications";
import { computeWorkspaceTeamStats } from "@/lib/team/workspace-team-stats";
import {
  removeWorkspaceMember,
  updateMemberRole,
} from "@/lib/supabase/workspace";
import type { WorkspaceRole } from "@/lib/types/collaboration";

export function useTeamWorkspaceData() {
  const {
    session,
    workspace,
    members,
    events,
    membership,
    role,
    tasks,
    invites,
    refresh,
  } = useWorkspace();

  const effectiveRole = role ?? membership?.role ?? null;
  const canManage = effectiveRole ? canInviteMembers(effectiveRole) : false;

  const pendingRows = React.useMemo((): PendingInviteRow[] => {
    const inviterNames = new Map<string, string>();
    for (const m of members) {
      if (m.userId) inviterNames.set(m.userId, m.displayName ?? m.invitedEmail ?? "Admin");
    }
    return members
      .filter((m) => m.status === "invited")
      .map((member) => {
        const invite =
          invites.find(
            (i) => i.email.toLowerCase() === (member.invitedEmail ?? "").toLowerCase(),
          ) ?? null;
        const inviterId = invite?.invitedBy;
        return {
          member,
          invite,
          inviterName: inviterId ? (inviterNames.get(inviterId) ?? "Admin") : "Admin",
        };
      });
  }, [members, invites]);

  React.useEffect(() => {
    if (!session?.user.id) return;
    touchCurrentUserPresence(session.user.id, "online");
    const onVis = () => {
      touchCurrentUserPresence(
        session.user.id,
        document.visibilityState === "visible" ? "online" : "idle",
      );
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [session?.user.id]);

  const stats = React.useMemo(
    () => computeWorkspaceTeamStats(members, events, tasks),
    [members, events, tasks],
  );

  const workloads = React.useMemo(
    () => computeMemberWorkloads(members, tasks, events),
    [members, tasks, events],
  );

  const notifications = React.useMemo(
    () => buildTeamNotifications(tasks, events),
    [tasks, events],
  );

  const activeMemberCount = members.filter((m) => m.status === "active").length;
  const assignedToYou = tasks.filter(
    (t) => t.assigneeId === session?.user.id && t.column !== "complete",
  ).length;

  const activeMembers =
    members.length > 0 ? members.filter((m) => m.status === "active") : membership ? [membership] : [];

  async function handleRoleChange(memberId: string, newRole: WorkspaceRole) {
    if (!session) return;
    await updateMemberRole(session, memberId, newRole);
    await refresh();
  }

  async function handleRemove(memberId: string) {
    if (!session || !workspace) return;
    if (!window.confirm("Remove this team member?")) return;
    await removeWorkspaceMember(session, workspace.id, memberId);
    await refresh();
  }

  return {
    session,
    workspace,
    members,
    tasks,
    canManage,
    pendingRows,
    refreshAll: refresh,
    stats,
    workloads,
    notifications,
    activeMemberCount,
    assignedToYou,
    activeMembers,
    handleRoleChange,
    handleRemove,
  };
}
