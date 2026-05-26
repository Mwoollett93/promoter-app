"use client";

import * as React from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";

import PresenceIndicator from "@/app/components/team/PresenceIndicator";
import RoleBadge from "@/app/components/team/RoleBadge";
import { getWorkspaceMemberLabel } from "@/lib/collaboration/member-display";
import { formatLastActive, type MemberWorkload } from "@/lib/team/member-workload";
import { resolveMemberPresence } from "@/lib/team/presence";
import {
  ROLE_PERMISSION_SUMMARIES,
  TEAM_ROLES,
  TEAM_ROLE_LABELS,
} from "@/lib/team/role-display";
import { memberInitials } from "@/lib/tasks/task-board-utils";
import type { WorkspaceMember, WorkspaceRole } from "@/lib/types/collaboration";

type TeamMemberCardProps = {
  member: WorkspaceMember;
  workload: MemberWorkload;
  currentUserId?: string;
  canManage: boolean;
  isSelf: boolean;
  onRoleChange: (memberId: string, role: WorkspaceRole) => void;
  onRemove: (memberId: string) => void;
};

const WORKLOAD_BAR: Record<MemberWorkload["workloadLevel"], string> = {
  low: "bg-[#22C55E]",
  medium: "bg-[#F59E0B]",
  overloaded: "bg-[#EF4444]",
};

const WORKLOAD_WIDTH: Record<MemberWorkload["workloadLevel"], string> = {
  low: "w-1/3",
  medium: "w-2/3",
  overloaded: "w-full",
};

export default function TeamMemberCard({
  member,
  workload,
  currentUserId,
  canManage,
  isSelf,
  onRoleChange,
  onRemove,
}: TeamMemberCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [showPermissions, setShowPermissions] = React.useState(false);
  const presence = resolveMemberPresence(member.userId, currentUserId);
  const name = getWorkspaceMemberLabel(member);
  const email =
    member.invitedEmail ??
    (isSelf ? "You" : member.userId ? "Active member" : "—");
  const permissions = ROLE_PERMISSION_SUMMARIES[member.role];

  return (
    <article className="group relative rounded-xl border border-[#232330]/90 bg-gradient-to-b from-[#14141F] to-[#11111A] p-4 transition-all hover:border-[#3F3F46] hover:shadow-[0_12px_32px_rgba(0,0,0,0.35),0_0_16px_rgba(139,92,246,0.06)]">
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="flex size-11 items-center justify-center rounded-full border border-[#3F3F46] bg-[#1A1630] text-[13px] font-bold text-[#C4B5FD]">
            {memberInitials(name)}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 rounded-full border border-[#11111A] p-0.5">
            <PresenceIndicator state={presence.state} activity={presence.activity} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-[14px] font-semibold text-[#F5F5F7]">{name}</h3>
              <p className="truncate text-[11px] text-[#71717A]">{email}</p>
            </div>
            {canManage && member.role !== "admin" && !isSelf ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="rounded-md p-1 text-[#71717A] opacity-0 transition-opacity hover:bg-[#232330] hover:text-[#F5F5F7] group-hover:opacity-100"
                  aria-label="Member actions"
                >
                  <MoreHorizontal className="size-4" />
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-[#232330] bg-[#0F0F17] py-1 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPermissions((s) => !s);
                        setMenuOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-[12px] text-[#E4E4E7] hover:bg-[#18181F]"
                    >
                      View permissions
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void onRemove(member.id);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-[#FCA5A5] hover:bg-[#18181F]"
                    >
                      <Trash2 className="size-3.5" />
                      Remove
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RoleBadge role={member.role} />
            <span
              className={[
                "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                member.status === "active"
                  ? "bg-[#14532D]/50 text-[#86EFAC]"
                  : "bg-[#27272F] text-[#A1A1AA]",
              ].join(" ")}
            >
              {member.status}
            </span>
          </div>

          {canManage && member.role !== "admin" && !isSelf ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {TEAM_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => onRoleChange(member.id, role)}
                  className={[
                    "rounded-md border px-1.5 py-0.5 text-[9px] font-medium transition-colors",
                    member.role === role
                      ? "border-[#8B5CF6]/50 bg-[#1A1630] text-[#C4B5FD]"
                      : "border-[#232330] text-[#71717A] hover:border-[#3F3F46] hover:text-[#A1A1AA]",
                  ].join(" ")}
                >
                  {TEAM_ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-[#232330]/80 bg-[#0B0B10]/80 px-2 py-1.5">
          <dt className="text-[9px] uppercase text-[#71717A]">Tasks</dt>
          <dd className="text-[13px] font-semibold tabular-nums text-[#F5F5F7]">
            {workload.activeTasks}
          </dd>
        </div>
        <div className="rounded-lg border border-[#232330]/80 bg-[#0B0B10]/80 px-2 py-1.5">
          <dt className="text-[9px] uppercase text-[#71717A]">Events</dt>
          <dd className="text-[13px] font-semibold tabular-nums text-[#F5F5F7]">
            {workload.assignedEvents}
          </dd>
        </div>
        <div className="rounded-lg border border-[#232330]/80 bg-[#0B0B10]/80 px-2 py-1.5">
          <dt className="text-[9px] uppercase text-[#71717A]">Overdue</dt>
          <dd
            className={[
              "text-[13px] font-semibold tabular-nums",
              workload.overdueTasks > 0 ? "text-[#FCA5A5]" : "text-[#F5F5F7]",
            ].join(" ")}
          >
            {workload.overdueTasks}
          </dd>
        </div>
      </dl>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] text-[#71717A]">
          <span className="capitalize">Workload: {workload.workloadLevel}</span>
          <span>Last active {formatLastActive(workload.lastActiveAt)}</span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#232330]">
          <div
            className={[
              "h-full rounded-full transition-all",
              WORKLOAD_BAR[workload.workloadLevel],
              WORKLOAD_WIDTH[workload.workloadLevel],
            ].join(" ")}
          />
        </div>
        {presence.activity ? (
          <p className="mt-1 text-[10px] text-[#52525B]">{presence.activity}</p>
        ) : null}
      </div>

      {showPermissions ? (
        <div className="mt-3 rounded-lg border border-[#8B5CF6]/20 bg-[#1A1630]/40 p-2.5 text-[10px] text-[#A1A1AA]">
          <p>
            <span className="text-[#71717A]">Pages:</span> {permissions.pages}
          </p>
          <p className="mt-1">
            <span className="text-[#71717A]">Edits:</span> {permissions.edits}
          </p>
          <p className="mt-1">
            <span className="text-[#71717A]">Finance:</span> {permissions.finance}
          </p>
          <p className="mt-1">
            <span className="text-[#71717A]">Tasks:</span> {permissions.tasks}
          </p>
        </div>
      ) : null}
    </article>
  );
}
