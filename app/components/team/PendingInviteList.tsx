"use client";

import RoleBadge from "@/app/components/team/RoleBadge";
import type { WorkspaceInvite, WorkspaceMember } from "@/lib/types/collaboration";

export type PendingInviteRow = {
  member: WorkspaceMember;
  invite: WorkspaceInvite | null;
  inviterName: string;
};

type PendingInviteListProps = {
  rows: PendingInviteRow[];
  canManage: boolean;
  onResend: (row: PendingInviteRow) => void;
  onRevoke: (row: PendingInviteRow) => void;
  busyId: string | null;
  embedded?: boolean;
};

export default function PendingInviteList({
  rows,
  canManage,
  onResend,
  onRevoke,
  busyId,
  embedded = false,
}: PendingInviteListProps) {
  if (rows.length === 0) return null;

  return (
    <ul className={embedded ? "mt-3 space-y-2" : "mt-3 space-y-2"}>
      {rows.map((row) => {
        const email = row.member.invitedEmail ?? row.invite?.email ?? "—";
        const sentAt = row.invite?.createdAt ?? row.member.createdAt;
        return (
          <li
            key={row.member.id}
            className="rounded-lg border border-[#232330] bg-[#11111A] px-3 py-2.5"
          >
            <p className="truncate text-[13px] font-medium text-[#F5F5F7]">{email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <RoleBadge role={row.member.role} />
            </div>
            <p className="mt-1 text-[11px] text-[#71717A]">
              Invited by {row.inviterName} · {new Date(sentAt).toLocaleDateString()}
            </p>
            {canManage ? (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={busyId === row.member.id}
                  onClick={() => onResend(row)}
                  className="text-[12px] font-medium text-[#8B5CF6] hover:text-[#A855F7] disabled:opacity-50"
                >
                  Resend
                </button>
                <button
                  type="button"
                  disabled={busyId === row.member.id}
                  onClick={() => onRevoke(row)}
                  className="text-[12px] font-medium text-[#FCA5A5] hover:text-red-300 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
