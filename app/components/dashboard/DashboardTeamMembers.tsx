"use client";

import Link from "next/link";

import MemberAvatar from "@/app/components/team/MemberAvatar";
import PresenceIndicator from "@/app/components/team/PresenceIndicator";
import RoleBadge from "@/app/components/team/RoleBadge";
import { getWorkspaceMemberLabel } from "@/lib/collaboration/member-display";
import type { MemberWorkload } from "@/lib/team/member-workload";
import { resolveMemberPresence } from "@/lib/team/presence";
import type { WorkspaceMember } from "@/lib/types/collaboration";

const WORKLOAD_COLOR: Record<MemberWorkload["workloadLevel"], string> = {
  low: "bg-emerald-500",
  medium: "bg-amber-400",
  overloaded: "bg-red-500",
};

type DashboardTeamMembersProps = {
  members: WorkspaceMember[];
  workloads: Map<string, MemberWorkload>;
  currentUserId?: string;
  limit?: number;
};

export default function DashboardTeamMembers({
  members,
  workloads,
  currentUserId,
  limit = 2,
}: DashboardTeamMembersProps) {
  const visible = members.slice(0, limit);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl border border-[#232330] bg-[#11111A] p-3 shadow-[0px_8px_24px_rgba(0,0,0,0.35)]">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold text-[#F5F5F7]">Team members</h2>
        <Link href="/team?tab=members" className="text-[11px] font-medium text-[#8B5CF6] hover:text-[#A855F7]">
          View all →
        </Link>
      </div>
      {visible.length === 0 ? (
        <p className="mt-2 text-[11px] text-[#71717A]">Invite your crew from Team.</p>
      ) : (
        <ul className="mt-2 min-h-0 flex-1 space-y-2 overflow-hidden">
          {visible.map((member) => {
            const name = getWorkspaceMemberLabel(member);
            const workload =
              workloads.get(member.id) ?? {
                memberId: member.id,
                userId: member.userId,
                activeTasks: 0,
                overdueTasks: 0,
                assignedEvents: 0,
                workloadLevel: "low" as const,
                lastActiveAt: member.createdAt,
              };
            const presence = resolveMemberPresence(member.userId, currentUserId);
            const barPct =
              workload.workloadLevel === "overloaded"
                ? 100
                : workload.workloadLevel === "medium"
                  ? 55
                  : 25;

            return (
              <li
                key={member.id}
                className="rounded-lg border border-[#232330] bg-[#0B0B10] px-2 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <div className="relative shrink-0">
                    <MemberAvatar name={name} avatarUrl={member.avatarUrl} size={28} />
                    <span className="absolute -bottom-0.5 -right-0.5 rounded-full border border-[#0F0F17] bg-[#0F0F17]">
                      <PresenceIndicator state={presence.state} />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-[#F5F5F7]">{name}</p>
                    <RoleBadge role={member.role} size="sm" />
                  </div>
                </div>
                <div className="mt-1.5 grid grid-cols-3 gap-1 text-center text-[9px]">
                  <div>
                    <span className="text-[#71717A]">Tasks</span>
                    <p className="font-semibold tabular-nums text-[#F5F5F7]">
                      {workload.activeTasks}
                      {workload.overdueTasks > 0 ? (
                        <span className="text-[#FCA5A5]"> ({workload.overdueTasks})</span>
                      ) : null}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#71717A]">Events</span>
                    <p className="font-semibold tabular-nums text-[#F5F5F7]">{workload.assignedEvents}</p>
                  </div>
                  <div>
                    <span className="text-[#71717A]">Load</span>
                    <p className="font-medium capitalize text-[#E4E4E7]">{workload.workloadLevel}</p>
                  </div>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#232330]">
                  <div
                    className={`h-full rounded-full ${WORKLOAD_COLOR[workload.workloadLevel]}`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
