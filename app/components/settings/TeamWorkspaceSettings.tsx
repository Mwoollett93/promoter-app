"use client";

import * as React from "react";

import Button from "@/app/components/ui/Button";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { canInviteMembers } from "@/lib/collaboration/permissions";
import {
  inviteWorkspaceMember,
  removeWorkspaceMember,
  updateMemberRole,
} from "@/lib/supabase/workspace";
import {
  WORKSPACE_ROLE_LABELS,
  type WorkspaceRole,
} from "@/lib/types/collaboration";

const ROLES: WorkspaceRole[] = [
  "admin",
  "promoter",
  "marketing",
  "finance",
  "guest_list",
  "read_only",
];

export default function TeamWorkspaceSettings() {
  const { session, workspace, members, membership, refreshMembers, role } = useWorkspace();
  const [email, setEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<WorkspaceRole>("promoter");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const canInvite = role ? canInviteMembers(role) : false;

  async function handleInvite() {
    if (!session || !workspace || !email.trim() || !canInvite) return;
    setLoading(true);
    setMessage(null);
    try {
      await inviteWorkspaceMember(session, workspace.id, { email, role: inviteRole });
      setEmail("");
      setMessage("Invitation recorded. They can join when they sign up with that email.");
      await refreshMembers();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Invite failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(memberId: string, newRole: WorkspaceRole) {
    if (!session) return;
    await updateMemberRole(session, memberId, newRole);
    await refreshMembers();
  }

  async function handleRemove(memberId: string) {
    if (!session || !workspace) return;
    if (!window.confirm("Remove this team member?")) return;
    await removeWorkspaceMember(session, workspace.id, memberId);
    await refreshMembers();
  }

  return (
    <section className="rounded-[16px] border border-[#232330] bg-[#11111A] p-6 shadow-[0px_10px_40px_0px_rgba(0,0,0,0.35)]">
      <h2 className="text-[18px] font-semibold text-[#F5F5F7]">Team Members</h2>
      <div className="mt-5">
      {message ? (
        <p className="mb-4 rounded-lg border border-[#232330] bg-[#0F0F17] px-3 py-2 text-[13px] text-[#A1A1AA]">
          {message}
        </p>
      ) : null}

      {canInvite ? (
        <div className="mb-6 flex flex-wrap gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@collective.com"
            className="min-w-[200px] flex-1 rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 py-2 text-[13px] text-[#F5F5F7]"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
            className="rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 py-2 text-[13px] text-[#F5F5F7]"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {WORKSPACE_ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            size="sm"
            type="button"
            disabled={loading || !email.trim()}
            onClick={() => void handleInvite()}
          >
            Invite
          </Button>
        </div>
      ) : (
        <p className="mb-4 text-[13px] text-[#71717A]">
          Only admins can invite members. Your role: {membership?.role ?? "—"}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full text-left text-[13px]">
          <thead className="text-[11px] uppercase tracking-[0.08em] text-[#71717A]">
            <tr>
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium">Role</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[#F5F5F7]">
            {members.map((member) => (
              <tr key={member.id} className="border-t border-[#232330]">
                <td className="py-3 font-medium">{member.displayName ?? "—"}</td>
                <td className="py-3 text-[#A1A1AA]">{member.invitedEmail ?? "—"}</td>
                <td className="py-3">
                  {member.userId === membership?.userId && member.role === "admin" ? (
                    WORKSPACE_ROLE_LABELS[member.role]
                  ) : (
                    <select
                      value={member.role}
                      disabled={!canInvite}
                      onChange={(e) =>
                        void handleRoleChange(member.id, e.target.value as WorkspaceRole)
                      }
                      className="rounded border border-[#3F3F46] bg-[#0B0B10] px-2 py-1 text-[12px]"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {WORKSPACE_ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="py-3">
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      member.status === "active"
                        ? "bg-[#14532D] text-[#86EFAC]"
                        : "bg-[#27272F] text-[#A1A1AA]",
                    ].join(" ")}
                  >
                    {member.status}
                  </span>
                </td>
                <td className="py-3 text-right">
                  {canInvite && member.role !== "admin" ? (
                    <button
                      type="button"
                      onClick={() => void handleRemove(member.id)}
                      className="text-[12px] text-[#FCA5A5] hover:text-red-300"
                    >
                      Remove
                    </button>
                  ) : (
                    <span className="text-[12px] text-[#71717A]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </section>
  );
}
