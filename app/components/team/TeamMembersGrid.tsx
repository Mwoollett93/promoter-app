"use client";

import TeamMemberCard from "@/app/components/team/TeamMemberCard";
import type { MemberWorkload } from "@/lib/team/member-workload";
import {
  SECTION_CARD,
  SECTION_CARD_PADDING,
  SECTION_TITLE,
} from "@/lib/ui/page-surfaces";
import type { WorkspaceMember, WorkspaceRole } from "@/lib/types/collaboration";

type TeamMembersGridProps = {
  members: WorkspaceMember[];
  workloads: Map<string, MemberWorkload>;
  currentUserId?: string;
  canManage: boolean;
  dense?: boolean;
  onRoleChange: (memberId: string, role: WorkspaceRole) => void;
  onRemove: (memberId: string) => void;
};

export default function TeamMembersGrid({
  members,
  workloads,
  currentUserId,
  canManage,
  dense = false,
  onRoleChange,
  onRemove,
}: TeamMembersGridProps) {
  const activeCount = members.filter((m) => m.status === "active").length;

  return (
    <section className={[SECTION_CARD, SECTION_CARD_PADDING].join(" ")}>
      <div className="flex items-center justify-between gap-2">
        <h2 className={SECTION_TITLE}>Team members</h2>
        <span className="text-[13px] text-[#71717A]">{activeCount} active</span>
      </div>
      <div className={`mt-3 grid gap-[12px] ${dense ? "lg:grid-cols-2" : "lg:grid-cols-2"}`}>
        {members.map((member) => (
          <TeamMemberCard
            key={member.id}
            dense={dense}
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
