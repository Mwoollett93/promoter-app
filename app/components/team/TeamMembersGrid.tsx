"use client";

import TeamMemberCard from "@/app/components/team/TeamMemberCard";
import type { MemberWorkload } from "@/lib/team/member-workload";
import type { WorkspaceMember, WorkspaceRole } from "@/lib/types/collaboration";

type TeamMembersGridProps = {
  members: WorkspaceMember[];
  workloads: Map<string, MemberWorkload>;
  currentUserId?: string;
  canManage: boolean;
  onRoleChange: (memberId: string, role: WorkspaceRole) => void;
  onRemove: (memberId: string) => void;
};

export default function TeamMembersGrid({
  members,
  workloads,
  currentUserId,
  canManage,
  onRoleChange,
  onRemove,
}: TeamMembersGridProps) {
  const activeMembers = members.filter((m) => m.status === "active");

  return (
    <section className="rounded-xl border border-[#232330]/90 bg-[#0F0F17]/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[16px] font-semibold text-[#F5F5F7]">Team members</h2>
        <span className="text-[12px] text-[#71717A]">{activeMembers.length} active</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => (
          <TeamMemberCard
            key={member.id}
            member={member}
            workload={
              workloads.get(member.id) ?? {
                memberId: member.id,
                userId: member.userId,
                activeTasks: 0,
                overdueTasks: 0,
                assignedEvents: 0,
                workloadLevel: "low",
                lastActiveAt: member.createdAt,
              }
            }
            currentUserId={currentUserId}
            canManage={canManage}
            isSelf={member.userId === currentUserId}
            onRoleChange={onRoleChange}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  );
}
