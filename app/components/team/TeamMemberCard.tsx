"use client";

import * as React from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";

import MemberAvatar from "@/app/components/team/MemberAvatar";
import PresenceIndicator from "@/app/components/team/PresenceIndicator";
import RoleBadge from "@/app/components/team/RoleBadge";
import WorkloadSparkline from "@/app/components/team/WorkloadSparkline";
import { getWorkspaceMemberLabel } from "@/lib/collaboration/member-display";
import { formatLastActive, type MemberWorkload } from "@/lib/team/member-workload";
import { resolveMemberPresence } from "@/lib/team/presence";
import {
  ROLE_PERMISSION_SUMMARIES,
  TEAM_ROLES,
  TEAM_ROLE_LABELS,
} from "@/lib/team/role-display";
import { SECTION_CARD_INNER } from "@/lib/ui/page-surfaces";
import type { WorkspaceMember, WorkspaceRole } from "@/lib/types/collaboration";

type TeamMemberCardProps = {
  member: WorkspaceMember;
  workload: MemberWorkload;
  currentUserId?: string;
  canManage: boolean;
  isSelf: boolean;
  dense?: boolean;
  onRoleChange: (memberId: string, role: WorkspaceRole) => void;
  onRemove: (memberId: string) => void;
};

export default function TeamMemberCard({
  member,
  workload,
  currentUserId,
  canManage,
  isSelf,
  dense = false,
  onRoleChange,
  onRemove,
}: TeamMemberCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [showPermissions, setShowPermissions] = React.useState(false);
  const presence = resolveMemberPresence(member.userId, currentUserId);
  const name = getWorkspaceMemberLabel(member);
  const email =
    member.invitedEmail ??
    (isSelf ? "You on this workspace" : member.userId ? "Active member" : "—");
  const permissions = ROLE_PERMISSION_SUMMARIES[member.role];

  return (
    <article
      className={[
        SECTION_CARD_INNER,
        dense ? "p-3 transition-colors hover:border-[#3F3F46]" : "p-4 transition-colors hover:border-[#3F3F46]",
      ].join(" ")}
    >
      <div className="flex items-start gap-2.5">
        <div className="relative shrink-0">
          <MemberAvatar
            name={name}
            avatarUrl={member.avatarUrl}
            size={dense ? 36 : 44}
          />
          <span className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-[#0F0F17] bg-[#0F0F17]">
            <PresenceIndicator state={presence.state} activity={presence.activity} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-[14px] font-semibold text-[#F5F5F7]">
                {name}
                {isSelf ? (
                  <span className="ml-1.5 text-[12px] font-normal text-[#71717A]">(You)</span>
                ) : null}
              </h3>
              <p className="truncate text-[12px] text-[#71717A]">{email}</p>
            </div>
            {canManage && member.role !== "admin" && !isSelf ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="rounded-md p-1 text-[#71717A] hover:bg-[#232330] hover:text-[#F5F5F7]"
                  aria-label="Member actions"
                >
                  <MoreHorizontal className="size-4" />
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-[#232330] bg-[#11111A] py-1 shadow-[0px_10px_40px_rgba(0,0,0,0.4)]">
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
        </div>
      </div>

      {canManage && member.role !== "admin" && !isSelf ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {TEAM_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => onRoleChange(member.id, role)}
              className={[
                "rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors",
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

      <dl className={`mt-3 grid grid-cols-3 gap-[12px] ${dense ? "" : ""}`}>
        <div className="rounded-lg border border-[#232330] bg-[#11111A] px-2 py-2 text-center">
          <dt className="text-[10px] uppercase tracking-wide text-[#71717A]">Tasks</dt>
          <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-[#F5F5F7]">
            {workload.activeTasks}
          </dd>
          {workload.overdueTasks > 0 ? (
            <dd className="text-[10px] text-[#FCA5A5]">{workload.overdueTasks} overdue</dd>
          ) : null}
        </div>
        <div className="rounded-lg border border-[#232330] bg-[#11111A] px-2 py-2 text-center">
          <dt className="text-[10px] uppercase tracking-wide text-[#71717A]">Events</dt>
          <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-[#F5F5F7]">
            {workload.assignedEvents}
          </dd>
          <dd className="text-[10px] text-[#71717A]">active</dd>
        </div>
        <div
          className={[
            "rounded-lg border border-[#232330] bg-[#11111A] px-2 py-1.5 text-center",
          ].join(" ")}
        >
          <dt className="text-[10px] uppercase tracking-wide text-[#71717A]">Workload</dt>
          <dd className="mt-0.5 text-[11px] font-medium capitalize text-[#E4E4E7]">
            {workload.workloadLevel}
          </dd>
          {!dense ? <WorkloadSparkline level={workload.workloadLevel} /> : null}
        </div>
      </dl>

      <p className="mt-3 text-[11px] text-[#71717A]">
        {presence.activity ?? "Offline"} · Last active {formatLastActive(workload.lastActiveAt)}
      </p>

      {showPermissions ? (
        <div className="mt-3 rounded-lg border border-[#232330] bg-[#11111A] p-3 text-[11px] text-[#A1A1AA]">
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
