"use client";

import * as React from "react";

import { resolveEventCapabilities } from "@/lib/collaboration/permissions";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import {
  listEventMemberOverrides,
  upsertEventMemberOverride,
} from "@/lib/supabase/event-permissions";
import { WORKSPACE_ROLE_LABELS } from "@/lib/types/collaboration";

export default function EventPermissionsPanel({ eventId }: { eventId: string }) {
  const { session, members, role } = useWorkspace();
  const [saving, setSaving] = React.useState<string | null>(null);

  if (!session || !role) return null;

  const caps = resolveEventCapabilities(role);

  if (!caps.canManageTeam) {
    return (
      <p className="text-[13px] text-[#71717A]">
        Event permissions are managed by workspace admins.
      </p>
    );
  }

  async function setCommentOnly(userId: string, commentOnly: boolean) {
    if (!session) return;
    setSaving(userId);
    try {
      await upsertEventMemberOverride(session, {
        eventId,
        userId,
        canEditFinance: null,
        canEditLineup: null,
        canUploadDocs: null,
        commentOnly,
      });
      await listEventMemberOverrides(session, eventId);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="rounded-xl border border-[#232330] bg-[#11111A] p-4">
      <h3 className="text-[14px] font-semibold text-[#F5F5F7]">Team access</h3>
      <p className="mt-1 text-[12px] text-[#71717A]">
        Override workspace defaults per member for this event.
      </p>
      <ul className="mt-4 space-y-2">
        {members
          .filter((m) => m.status === "active" && m.userId)
          .map((member) => (
            <li
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#232330] bg-[#0B0B10] px-3 py-2"
            >
              <div>
                <p className="text-[13px] font-medium text-[#E4E4E7]">
                  {member.displayName ?? member.invitedEmail}
                </p>
                <p className="text-[11px] text-[#71717A]">
                  {WORKSPACE_ROLE_LABELS[member.role]}
                </p>
              </div>
              <label className="flex items-center gap-2 text-[12px] text-[#A1A1AA]">
                <input
                  type="checkbox"
                  disabled={saving === member.userId}
                  onChange={(e) =>
                    member.userId && void setCommentOnly(member.userId, e.target.checked)
                  }
                />
                Comment only
              </label>
            </li>
          ))}
      </ul>
    </div>
  );
}
