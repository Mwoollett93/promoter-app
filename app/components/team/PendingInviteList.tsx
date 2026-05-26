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
};

export default function PendingInviteList({
  rows,
  canManage,
  onResend,
  onRevoke,
  busyId,
}: PendingInviteListProps) {
  if (rows.length === 0) return null;

  return (
    <div className="mt-4 border-t border-[#232330] pt-4">
      <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[#71717A]">
        Pending invites ({rows.length})
      </h3>
      <ul className="mt-3 space-y-2">
        {rows.map((row) => {
          const email = row.member.invitedEmail ?? row.invite?.email ?? "—";
          const sentAt = row.invite?.createdAt ?? row.member.createdAt;
          return (
            <li
              key={row.member.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#232330] bg-[#0B0B10] px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-[#F5F5F7]">{email}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <RoleBadge role={row.member.role} />
                  <span className="text-[10px] text-[#71717A]">
                    Invited by {row.inviterName} · {new Date(sentAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {canManage ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === row.member.id}
                    onClick={() => onResend(row)}
                    className="rounded-md border border-[#3F3F46] px-2.5 py-1 text-[11px] font-medium text-[#E4E4E7] hover:border-[#52525B] disabled:opacity-50"
                  >
                    Resend
                  </button>
                  <button
                    type="button"
                    disabled={busyId === row.member.id}
                    onClick={() => onRevoke(row)}
                    className="rounded-md border border-[#7F1D1D]/50 px-2.5 py-1 text-[11px] font-medium text-[#FCA5A5] hover:bg-[#450A0A]/30 disabled:opacity-50"
                  >
                    Revoke
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
