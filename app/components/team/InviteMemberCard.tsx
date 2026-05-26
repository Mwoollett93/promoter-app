"use client";

import * as React from "react";
import { Mail } from "lucide-react";

import Button from "@/app/components/ui/Button";
import PendingInviteList, { type PendingInviteRow } from "@/app/components/team/PendingInviteList";
import RoleBadge from "@/app/components/team/RoleBadge";
import { reconnectCloudCollaboration } from "@/lib/collaboration/storage-mode";
import { canInviteMembers } from "@/lib/collaboration/permissions";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { sendWorkspaceInviteEmail } from "@/lib/notifications/send-workspace-invite-email";
import { TEAM_ROLES, TEAM_ROLE_LABELS } from "@/lib/team/role-display";
import { inviteWorkspaceMember, revokeWorkspaceInvite } from "@/lib/supabase/workspace";
import {
  FIELD_LABEL,
  INPUT_SURFACE,
  LINK_ACCENT,
  SECTION_CARD,
  SECTION_CARD_PADDING,
  SECTION_DESCRIPTION,
  SECTION_TITLE,
  SELECT_SURFACE,
} from "@/lib/ui/page-surfaces";
import type { WorkspaceRole } from "@/lib/types/collaboration";

type InviteMemberCardProps = {
  pendingRows: PendingInviteRow[];
  onRefresh: () => Promise<void>;
  variant?: "overview" | "full";
  onManageInvites?: () => void;
};

export default function InviteMemberCard({
  pendingRows,
  onRefresh,
  variant = "full",
  onManageInvites,
}: InviteMemberCardProps) {
  const {
    session,
    workspace,
    membership,
    role,
    error: workspaceError,
    usingLocalFallback,
    refresh,
  } = useWorkspace();
  const [email, setEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<WorkspaceRole>("promoter");
  const [loading, setLoading] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [reconnecting, setReconnecting] = React.useState(false);

  const effectiveRole = role ?? membership?.role ?? null;
  const canInvite = effectiveRole ? canInviteMembers(effectiveRole) : false;

  async function handleInvite() {
    if (!session || !workspace || !email.trim() || !canInvite) return;
    setLoading(true);
    setMessage(null);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await inviteWorkspaceMember(session, workspace.id, {
        email: normalizedEmail,
        role: inviteRole,
      });
      setEmail("");

      if (!usingLocalFallback) {
        try {
          const inviterName =
            membership?.displayName ?? session.user.email?.split("@")[0] ?? "Your team";
          const { stub } = await sendWorkspaceInviteEmail(session, {
            to: normalizedEmail,
            workspaceId: workspace.id,
            workspaceName: workspace.name,
            role: inviteRole,
            inviterName,
          });
          setMessage(
            stub
              ? `Invite saved for ${normalizedEmail} (email stub — add RESEND_API_KEY).`
              : `Invitation sent to ${normalizedEmail}.`,
          );
        } catch (emailErr) {
          setMessage(
            `Invite saved; email failed: ${
              emailErr instanceof Error ? emailErr.message : "unknown error"
            }`,
          );
        }
      } else {
        setMessage(`Invite saved locally for ${normalizedEmail} (offline mode).`);
      }

      await onRefresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Invite failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend(row: PendingInviteRow) {
    if (!session || !workspace) return;
    const targetEmail = row.member.invitedEmail ?? row.invite?.email;
    if (!targetEmail) return;
    setBusyId(row.member.id);
    try {
      const inviterName =
        membership?.displayName ?? session.user.email?.split("@")[0] ?? "Your team";
      await sendWorkspaceInviteEmail(session, {
        to: targetEmail,
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        role: row.member.role,
        inviterName,
      });
      setMessage(`Resent invite to ${targetEmail}.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Resend failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevoke(row: PendingInviteRow) {
    if (!session || !workspace) return;
    if (!window.confirm(`Revoke invite for ${row.member.invitedEmail ?? "this member"}?`)) return;
    setBusyId(row.member.id);
    try {
      await revokeWorkspaceInvite(session, workspace.id, {
        inviteId: row.invite?.id ?? row.member.id,
        memberId: row.member.id,
      });
      setMessage("Invite revoked.");
      await onRefresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Revoke failed.");
    } finally {
      setBusyId(null);
    }
  }

  const isOverview = variant === "overview";

  return (
    <section className={[SECTION_CARD, SECTION_CARD_PADDING].join(" ")}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className={SECTION_TITLE}>Invite to workspace</h2>
          {!isOverview ? (
            <p className={SECTION_DESCRIPTION}>
              Add promoters, marketing, finance, or artist liaison roles to your season workspace.
            </p>
          ) : (
            <p className={SECTION_DESCRIPTION}>Quick invite — manage pending in Members.</p>
          )}
        </div>
        {isOverview && pendingRows.length > 0 && onManageInvites ? (
          <button type="button" onClick={onManageInvites} className={LINK_ACCENT}>
            {pendingRows.length} pending →
          </button>
        ) : null}
      </div>

      {usingLocalFallback ? (
        <div className="mt-4 rounded-lg border border-amber-900/50 bg-amber-950/30 px-3 py-2 text-[13px] text-amber-200/90">
          Cloud sync offline — invites are device-local until reconnected.
          <Button
            variant="secondary"
            size="sm"
            type="button"
            className="mt-2"
            disabled={reconnecting}
            onClick={() => {
              if (!session) return;
              setReconnecting(true);
              reconnectCloudCollaboration(session.user.id);
              void refresh().finally(() => setReconnecting(false));
            }}
          >
            {reconnecting ? "Reconnecting…" : "Reconnect"}
          </Button>
        </div>
      ) : null}

      {workspaceError && !usingLocalFallback ? (
        <p className="mt-3 text-[13px] text-[#FCA5A5]">{workspaceError}</p>
      ) : null}
      {message ? (
        <p className="mt-3 rounded-lg border border-[#232330] bg-[#0F0F17] px-3 py-2 text-[13px] text-[#A1A1AA]">
          {message}
        </p>
      ) : null}

      <div className={isOverview ? "mt-3" : "mt-5 grid gap-[12px] lg:grid-cols-[1fr_minmax(240px,300px)]"}>
        <div>
          {canInvite ? (
            <div className="flex flex-col gap-[12px] sm:flex-row sm:items-end">
              <label className="min-w-0 flex-1">
                <span className={FIELD_LABEL}>Email</span>
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#71717A]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@collective.com"
                    className={`${INPUT_SURFACE} pl-9`}
                  />
                </div>
              </label>
              <label className="sm:w-44">
                <span className={FIELD_LABEL}>Role</span>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                  className={`${SELECT_SURFACE} mt-1 w-full`}
                >
                  {TEAM_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {TEAM_ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                variant="primary"
                size="sm"
                type="button"
                disabled={loading || !email.trim()}
                onClick={() => void handleInvite()}
              >
                Send invite
              </Button>
            </div>
          ) : (
            <p className="text-[13px] text-[#71717A]">Only workspace admins can send invites.</p>
          )}

          {!isOverview ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {TEAM_ROLES.map((r) => (
                <RoleBadge key={r} role={r} />
              ))}
            </div>
          ) : null}
        </div>

        {!isOverview && pendingRows.length > 0 ? (
          <div className="rounded-lg border border-[#232330] bg-[#0F0F17] p-4">
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[#71717A]">
              Pending invites
            </h3>
            <PendingInviteList
              rows={pendingRows}
              canManage={canInvite}
              onResend={(row) => void handleResend(row)}
              onRevoke={(row) => void handleRevoke(row)}
              busyId={busyId}
              embedded
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
