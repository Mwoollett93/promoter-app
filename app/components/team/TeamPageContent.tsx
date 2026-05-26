"use client";

import * as React from "react";

import PageContent from "@/app/components/layout/PageContent";
import InviteMemberCard from "@/app/components/team/InviteMemberCard";
import type { PendingInviteRow } from "@/app/components/team/PendingInviteList";
import TeamMembersGrid from "@/app/components/team/TeamMembersGrid";
import TeamNotificationsPanel from "@/app/components/team/TeamNotificationsPanel";
import TemplatesSection from "@/app/components/team/TemplatesSection";
import WorkspaceActivityFeed from "@/app/components/team/WorkspaceActivityFeed";
import WorkspaceSettingsPanel from "@/app/components/team/WorkspaceSettingsPanel";
import WorkspaceStatsRow from "@/app/components/team/WorkspaceStatsRow";
import { canInviteMembers } from "@/lib/collaboration/permissions";
import { listTasks } from "@/lib/collaboration/tasks";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { computeMemberWorkloads } from "@/lib/team/member-workload";
import { touchCurrentUserPresence } from "@/lib/team/presence";
import { buildTeamNotifications } from "@/lib/team/team-notifications";
import { computeWorkspaceTeamStats } from "@/lib/team/workspace-team-stats";
import {
  listWorkspaceInvites,
  removeWorkspaceMember,
  updateMemberRole,
} from "@/lib/supabase/workspace";
import { PAGE_STACK_GAP } from "@/lib/layout/page-layout";
import type { Task, WorkspaceInvite, WorkspaceRole } from "@/lib/types/collaboration";

export default function TeamPageContent() {
  const {
    session,
    workspace,
    members,
    events,
    membership,
    role,
    refreshMembers,
  } = useWorkspace();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [invites, setInvites] = React.useState<WorkspaceInvite[]>([]);

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

  const refreshAll = React.useCallback(async () => {
    if (!session || !workspace) return;
    const [taskList, inviteList] = await Promise.all([
      listTasks(session, workspace.id),
      listWorkspaceInvites(session, workspace.id),
    ]);
    setTasks(taskList);
    setInvites(inviteList);
    await refreshMembers();
  }, [session, workspace, refreshMembers]);

  React.useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

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

  const displayMembers =
    members.length > 0 ? members.filter((m) => m.status === "active") : membership ? [membership] : [];

  async function handleRoleChange(memberId: string, newRole: WorkspaceRole) {
    if (!session) return;
    await updateMemberRole(session, memberId, newRole);
    await refreshAll();
  }

  async function handleRemove(memberId: string) {
    if (!session || !workspace) return;
    if (!window.confirm("Remove this team member?")) return;
    await removeWorkspaceMember(session, workspace.id, memberId);
    await refreshAll();
  }

  return (
    <PageContent fill>
      <header className={PAGE_STACK_GAP}>
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8B5CF6]">
          Operations workspace
        </p>
        <h1 className="text-[28px] font-bold tracking-tight text-[#F5F5F7] sm:text-[32px]">
          Team
        </h1>
        <p className="mt-1 max-w-2xl text-[14px] text-[#A1A1AA]">
          Live crew overview — workload, invites, activity, and templates tied to your events and
          task board.
        </p>
      </header>

      <div className={`mt-6 ${PAGE_STACK_GAP}`}>
        <WorkspaceStatsRow stats={stats} />

        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className={`flex flex-col ${PAGE_STACK_GAP}`}>
            <InviteMemberCard pendingRows={pendingRows} onRefresh={refreshAll} />
            <TeamMembersGrid
              members={displayMembers}
              workloads={workloads}
              currentUserId={session?.user.id}
              canManage={canManage}
              onRoleChange={(id, r) => void handleRoleChange(id, r)}
              onRemove={(id) => void handleRemove(id)}
            />
            <TemplatesSection />
            <WorkspaceSettingsPanel />
          </div>

          <aside className={`flex flex-col ${PAGE_STACK_GAP}`}>
            <TeamNotificationsPanel items={notifications} />
            <WorkspaceActivityFeed />
          </aside>
        </div>
      </div>
    </PageContent>
  );
}
