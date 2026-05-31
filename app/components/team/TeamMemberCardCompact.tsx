"use client";

import MemberAvatar from "@/app/components/team/MemberAvatar";
import PresenceIndicator from "@/app/components/team/PresenceIndicator";
import RoleBadge from "@/app/components/team/RoleBadge";
import { getWorkspaceMemberLabel } from "@/lib/collaboration/member-display";
import { formatLastActive, type MemberWorkload } from "@/lib/team/member-workload";
import { resolveMemberPresence } from "@/lib/team/presence";
import { SECTION_CARD_INNER } from "@/lib/ui/page-surfaces";
import type { WorkspaceMember } from "@/lib/types/collaboration";

type TeamMemberCardCompactProps = {
  member: WorkspaceMember;
  workload: MemberWorkload;
  currentUserId?: string;
  onOpenMembers?: () => void;
};

export default function TeamMemberCardCompact({
  member,
  workload,
  currentUserId,
  onOpenMembers,
}: TeamMemberCardCompactProps) {
  const presence = resolveMemberPresence(member.userId, currentUserId);
  const name = getWorkspaceMemberLabel(member);
  const isSelf = member.userId === currentUserId;

  return (
    <button
      type="button"
      onClick={onOpenMembers}
      className={[
        SECTION_CARD_INNER,
        "flex w-full items-center gap-2.5 p-2.5 text-left transition-colors hover:border-[#3F3F46]",
      ].join(" ")}
    >
      <div className="relative shrink-0">
        <MemberAvatar name={name} avatarUrl={member.avatarUrl} size={32} />
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full border border-[#0F0F17] bg-[#0F0F17]">
          <PresenceIndicator state={presence.state} />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-[#F5F5F7]">
          {name}
          {isSelf ? <span className="text-[#71717A]"> · you</span> : null}
        </p>
        <p className="mt-0.5 text-[11px] text-[#71717A]">
          {workload.activeTasks} tasks · {workload.assignedEvents} events ·{" "}
          {formatLastActive(workload.lastActiveAt)}
        </p>
      </div>
      <RoleBadge role={member.role} size="sm" />
    </button>
  );
}
