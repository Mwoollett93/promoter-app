"use client";

import Link from "next/link";

import PresenceIndicator from "@/app/components/team/PresenceIndicator";
import RoleBadge from "@/app/components/team/RoleBadge";
import { getWorkspaceMemberLabel } from "@/lib/collaboration/member-display";
import type { MemberWorkload } from "@/lib/team/member-workload";
import { resolveMemberPresence } from "@/lib/team/presence";
import { memberInitials } from "@/lib/tasks/task-board-utils";
import { SECTION_CARD, SECTION_CARD_PADDING, SECTION_TITLE, LINK_ACCENT } from "@/lib/ui/page-surfaces";
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
  limit = 3,
}: DashboardTeamMembersProps) {
  const visible = members.slice(0, limit);

  return (
    <section className={[SECTION_CARD, SECTION_CARD_PADDING].join(" ")}>
      <div className="flex items-center justify-between gap-2">
        <h2 className={SECTION_TITLE}>Team members</h2>
        <Link href="/team?tab=members" className={LINK_ACCENT}>
          View all →
        </Link>
      </div>
      {visible.length === 0 ? (
        <p className="mt-3 text-[13px] text-[#71717A]">Invite your crew from the Team page.</p>
      ) : (
        <ul className="mt-3 space-y-3">
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
                className="rounded-lg border border-[#232330] bg-[#0B0B10] p-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative shrink-0">
                    <div className="flex size-9 items-center justify-center rounded-full border border-[#3F3F46] bg-[#1A1630] text-[11px] font-bold text-[#C4B5FD]">
                      {memberInitials(name)}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 rounded-full border border-[#0F0F17] bg-[#0F0F17]">
                      <PresenceIndicator state={presence.state} />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-[#F5F5F7]">{name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <RoleBadge role={member.role} size="sm" />
                    </div>
                  </div>
                </div>
                <dl className="mt-2.5 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-[#71717A]">Tasks</dt>
                    <dd className="text-[14px] font-semibold tabular-nums text-[#F5F5F7]">
                      {workload.activeTasks}
                      {workload.overdueTasks > 0 ? (
                        <span className="ml-1 text-[10px] font-normal text-[#FCA5A5]">
                          ({workload.overdueTasks} overdue)
                        </span>
                      ) : null}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-[#71717A]">Events</dt>
                    <dd className="text-[14px] font-semibold tabular-nums text-[#F5F5F7]">
                      {workload.assignedEvents}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-[#71717A]">Workload</dt>
                    <dd className="text-[11px] font-medium capitalize text-[#E4E4E7]">
                      {workload.workloadLevel}
                    </dd>
                  </div>
                </dl>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#232330]">
                  <div
                    className={`h-full rounded-full transition-all ${WORKLOAD_COLOR[workload.workloadLevel]}`}
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
