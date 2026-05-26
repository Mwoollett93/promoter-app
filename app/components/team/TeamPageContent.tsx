"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";

import PageContent from "@/app/components/layout/PageContent";
import Button from "@/app/components/ui/Button";
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
import { PAGE_STACK_GAP } from "@/lib/layout/page-layout";
import { computeMemberWorkloads } from "@/lib/team/member-workload";
import { touchCurrentUserPresence } from "@/lib/team/presence";
import { buildTeamNotifications } from "@/lib/team/team-notifications";
import { computeWorkspaceTeamStats } from "@/lib/team/workspace-team-stats";
import {
  PAGE_DESCRIPTION,
  PAGE_EYEBROW,
  PAGE_TITLE,
} from "@/lib/ui/page-surfaces";
import {
  listWorkspaceInvites,
  removeWorkspaceMember,
  updateMemberRole,
} from "@/lib/supabase/workspace";
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
  const inviteRef = React.useRef<HTMLDivElement>(null);

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

  const activeMemberCount = members.filter((m) => m.status === "active").length;
  const assignedToYou = tasks.filter(
    (t) => t.assigneeId === session?.user.id && t.column !== "complete",
  ).length;

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

  function scrollToInvite() {
    inviteRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <PageContent fill>
      <header
        className={`flex flex-col ${PAGE_STACK_GAP} sm:flex-row sm:items-start sm:justify-between`}
      >
        <div>
          <p className={PAGE_EYEBROW}>Operations workspace</p>
          <h1 className={PAGE_TITLE}>Team</h1>
          <p className={`${PAGE_DESCRIPTION} max-w-2xl`}>
            Manage your crew, roles, and templates. Everything here is connected to your events
            and tasks.
          </p>
        </div>
        {canManage ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="shrink-0 gap-2"
            onClick={scrollToInvite}
          >
            <UserPlus className="size-4" strokeWidth={2} aria-hidden />
            Invite member
          </Button>
        ) : null}
      </header>

      <div className={PAGE_STACK_GAP}>
        <WorkspaceStatsRow
          stats={stats}
          activeMemberCount={activeMemberCount}
          assignedToYou={assignedToYou}
        />

        <div className={`grid grid-cols-1 gap-[12px] xl:grid-cols-[1fr_360px]`}>
          <div className={`flex flex-col ${PAGE_STACK_GAP}`}>
            <div ref={inviteRef}>
              <InviteMemberCard pendingRows={pendingRows} onRefresh={refreshAll} />
            </div>
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
