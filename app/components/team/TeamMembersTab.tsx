"use client";

import InviteMemberCard from "@/app/components/team/InviteMemberCard";
import TeamMembersGrid from "@/app/components/team/TeamMembersGrid";
import type { useTeamWorkspaceData } from "@/lib/team/use-team-workspace-data";
import { PAGE_STACK_GAP } from "@/lib/layout/page-layout";

type TeamMembersTabProps = {
  data: ReturnType<typeof useTeamWorkspaceData>;
};

export default function TeamMembersTab({ data }: TeamMembersTabProps) {
  const {
    session,
    activeMembers,
    workloads,
    canManage,
    pendingRows,
    refreshAll,
    handleRoleChange,
    handleRemove,
  } = data;

  return (
    <div className={`flex flex-col ${PAGE_STACK_GAP}`}>
      <InviteMemberCard
        pendingRows={pendingRows}
        onRefresh={refreshAll}
        variant="full"
      />
      <TeamMembersGrid
        members={activeMembers}
        workloads={workloads}
        currentUserId={session?.user.id}
        canManage={canManage}
        onRoleChange={handleRoleChange}
        onRemove={handleRemove}
        dense
      />
    </div>
  );
}
