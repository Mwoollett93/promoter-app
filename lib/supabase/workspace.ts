import {
  clearLocalCollaborationMode,
  markLocalCollaborationMode,
  shouldUseLocalCollaboration,
} from "@/lib/collaboration/storage-mode";
import {
  clearLocalWorkspaceForUser,
  createLocalWorkspaceId,
  findLocalMembershipForUser,
  findLocalWorkspaceById,
  loadLocalInvites,
  loadLocalMembers,
  loadLocalWorkspace,
  newId,
  saveLocalInvites,
  saveLocalMembers,
  saveLocalWorkspace,
} from "@/lib/collaboration/local-store";
import type { SupabaseSession } from "@/lib/types/artist";
import type {
  MemberStatus,
  Workspace,
  WorkspaceInvite,
  WorkspaceMember,
  WorkspaceRole,
} from "@/lib/types/collaboration";

import { getSupabaseConfig, isDemoSession } from "./browser";
import { isUuid, supabaseRest } from "./client-rest";

type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type MemberRow = {
  id: string;
  workspace_id: string;
  user_id: string | null;
  invited_email: string | null;
  role: WorkspaceRole;
  status: MemberStatus;
  display_name: string | null;
  avatar_url?: string | null;
  joined_at: string | null;
  created_at: string;
};

type InviteRow = {
  id: string;
  workspace_id: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  invited_by?: string | null;
  created_at: string;
};

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return base || "workspace";
}

function mapWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMember(row: MemberRow): WorkspaceMember {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    invitedEmail: row.invited_email,
    role: row.role,
    status: row.status,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? null,
    joinedAt: row.joined_at,
    createdAt: row.created_at,
  };
}

function mapInvite(row: InviteRow): WorkspaceInvite {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    invitedBy: row.invited_by ?? null,
    email: row.email,
    role: row.role,
    token: row.token,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  };
}

function listLocalWorkspaceIdsFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  const ids: string[] = [];
  const prefix = "promosync:collab:members:";
  for (let i = 0; i < window.localStorage.length; i++) {
    const storageKey = window.localStorage.key(i);
    if (!storageKey?.startsWith(prefix)) continue;
    ids.push(storageKey.slice(prefix.length));
  }
  return ids;
}

function acceptLocalPendingInvites(session: SupabaseSession, email: string): WorkspaceMember | null {
  const normalized = email.trim().toLowerCase();
  const now = new Date().toISOString();
  let accepted: WorkspaceMember | null = null;

  for (const workspaceId of listLocalWorkspaceIdsFromStorage()) {
    const members = loadLocalMembers(workspaceId);
    let changed = false;
    const nextMembers = members.map((member) => {
      if (
        member.status === "invited" &&
        member.invitedEmail?.trim().toLowerCase() === normalized
      ) {
        changed = true;
        const updated: WorkspaceMember = {
          ...member,
          userId: session.user.id,
          status: "active",
          joinedAt: now,
        };
        accepted = updated;
        return updated;
      }
      return member;
    });

    if (changed) {
      saveLocalMembers(workspaceId, nextMembers);
      const invites = loadLocalInvites(workspaceId).map((invite) =>
        invite.email.trim().toLowerCase() === normalized
          ? { ...invite, acceptedAt: now }
          : invite,
      );
      saveLocalInvites(workspaceId, invites);
    }
  }

  return accepted;
}

async function fetchActiveMembership(
  session: SupabaseSession,
  workspaceId: string,
): Promise<WorkspaceMember | null> {
  const rows = await supabaseRest<MemberRow[]>(
    `workspace_members?workspace_id=eq.${workspaceId}&user_id=eq.${session.user.id}&status=eq.active&limit=1`,
    session,
  );
  return rows[0] ? mapMember(rows[0]) : null;
}

async function ensureActiveMembership(
  session: SupabaseSession,
  workspaceId: string,
  options?: { displayName?: string },
): Promise<WorkspaceMember> {
  const existing = await fetchActiveMembership(session, workspaceId);
  if (existing) return existing;

  const now = new Date().toISOString();
  try {
    const rows = await supabaseRest<MemberRow[]>("workspace_members", session, {
      method: "POST",
      body: {
        workspace_id: workspaceId,
        user_id: session.user.id,
        role: "admin",
        status: "active",
        display_name: options?.displayName ?? session.user.email?.split("@")[0] ?? "You",
        joined_at: now,
      },
      prefer: "return=representation",
    });
    if (rows?.[0]) return mapMember(rows[0]);
  } catch {
    const repaired = await fetchActiveMembership(session, workspaceId);
    if (repaired) return repaired;
    throw new Error("Could not create workspace membership.");
  }

  const repaired = await fetchActiveMembership(session, workspaceId);
  if (repaired) return repaired;
  throw new Error("Could not create workspace membership.");
}

export async function acceptPendingWorkspaceInvites(
  session: SupabaseSession,
): Promise<number> {
  const email = session.user.email?.trim().toLowerCase();
  if (!email) return 0;

  if (shouldUseLocalCollaboration(session)) {
    const accepted = acceptLocalPendingInvites(session, email);
    return accepted ? 1 : 0;
  }

  let acceptedCount = 0;

  try {
    const rpcRows = await supabaseRest<{ workspace_id: string; member_id: string }[]>(
      "rpc/accept_my_workspace_invites",
      session,
      { method: "POST", body: {} },
    );
    acceptedCount = rpcRows?.length ?? 0;
    if (acceptedCount > 0) return acceptedCount;
  } catch {
    /* RPC not deployed yet — fall back to REST below */
  }

  try {
    const pending = await supabaseRest<MemberRow[]>(
      `workspace_members?invited_email=eq.${encodeURIComponent(email)}&status=eq.invited&user_id=is.null`,
      session,
    );

    const now = new Date().toISOString();
    for (const row of pending) {
      await supabaseRest(`workspace_members?id=eq.${row.id}`, session, {
        method: "PATCH",
        body: {
          user_id: session.user.id,
          status: "active",
          joined_at: now,
        },
        prefer: "return=minimal",
      });
      acceptedCount += 1;

      const invites = await supabaseRest<InviteRow[]>(
        `workspace_invites?workspace_id=eq.${row.workspace_id}&email=eq.${encodeURIComponent(email)}&accepted_at=is.null`,
        session,
      );

      for (const invite of invites) {
        await supabaseRest(`workspace_invites?id=eq.${invite.id}`, session, {
          method: "PATCH",
          body: { accepted_at: now },
          prefer: "return=minimal",
        });
      }
    }
  } catch {
    /* best-effort */
  }

  return acceptedCount;
}

async function resolvePrimaryMembership(
  session: SupabaseSession,
): Promise<{ workspace: Workspace; membership: WorkspaceMember } | null> {
  return resolvePrimaryWorkspace(session);
}

/** Resolves the user's primary workspace without N+1 workspace lookups. */
export async function resolvePrimaryWorkspace(
  session: SupabaseSession,
): Promise<{ workspace: Workspace; membership: WorkspaceMember } | null> {
  const email = session.user.email?.trim().toLowerCase();

  const rows = await supabaseRest<MemberRow[]>(
    `workspace_members?user_id=eq.${session.user.id}&status=eq.active&order=joined_at.desc`,
    session,
  );
  if (rows.length === 0) return null;

  const workspaceIds = [...new Set(rows.map((row) => row.workspace_id))];
  const workspaces = await supabaseRest<WorkspaceRow[]>(
    `workspaces?id=in.(${workspaceIds.join(",")})`,
    session,
  );
  const workspaceById = new Map(workspaces.map((row) => [row.id, mapWorkspace(row)]));

  for (const row of rows) {
    const workspace = workspaceById.get(row.workspace_id);
    if (!workspace) continue;

    const wasInvite =
      email &&
      row.invited_email?.trim().toLowerCase() === email &&
      workspace.createdBy !== session.user.id;

    if (wasInvite || workspace.createdBy !== session.user.id) {
      return { workspace, membership: mapMember(row) };
    }
  }

  const first = rows[0];
  const workspace = workspaceById.get(first.workspace_id);
  if (!workspace) return null;
  return { workspace: workspace, membership: mapMember(first) };
}

export async function probeCloudCollaboration(
  session: SupabaseSession,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isDemoSession(session)) {
    return { ok: false, error: "Demo login cannot use cloud collaboration." };
  }
  if (!getSupabaseConfig()) {
    return { ok: false, error: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY." };
  }

  try {
    await supabaseRest<MemberRow[]>(
      `workspace_members?user_id=eq.${session.user.id}&status=eq.active&limit=1`,
      session,
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not reach Supabase workspace tables.",
    };
  }
}

export async function ensureWorkspaceForUser(
  session: SupabaseSession,
  options?: { companyName?: string; displayName?: string; forceCloud?: boolean },
): Promise<{ workspace: Workspace; membership: WorkspaceMember }> {
  if (isDemoSession(session)) {
    return ensureLocalWorkspace(session, options);
  }

  if (!options?.forceCloud && shouldUseLocalCollaboration(session)) {
    const email = session.user.email?.trim().toLowerCase();
    if (email) acceptLocalPendingInvites(session, email);

    const joined = findLocalMembershipForUser(session.user.id);
    if (joined) {
      const workspace =
        findLocalWorkspaceById(joined.workspaceId) ??
        loadLocalWorkspace(session.user.id);
      if (workspace) {
        saveLocalWorkspace(session.user.id, workspace);
        return { workspace, membership: joined.membership };
      }
    }

    return ensureLocalWorkspace(session, options);
  }

  const stale = loadLocalWorkspace(session.user.id);
  if (stale && !isUuid(stale.id)) {
    clearLocalWorkspaceForUser(session.user.id);
  }

  try {
    const email = session.user.email?.trim().toLowerCase();
    await acceptPendingWorkspaceInvites(session);

    const resolved = await resolvePrimaryMembership(session);
    if (resolved) {
      saveLocalWorkspace(session.user.id, resolved.workspace);
      clearLocalCollaborationMode(session.user.id);
      return resolved;
    }

    // Pending invite but accept failed (usually missing SQL) — don't create a duplicate workspace.
    if (email) {
      const stillPending = await supabaseRest<MemberRow[]>(
        `workspace_members?invited_email=eq.${encodeURIComponent(email)}&status=eq.invited&user_id=is.null&limit=1`,
        session,
      ).catch(() => [] as MemberRow[]);

      if (stillPending.length > 0) {
        throw new Error(
          "You have a pending team invite but it could not be activated. Ask your admin to run supabase/accept-workspace-invite-rpc.sql in Supabase, then sign out and back in.",
        );
      }
    }

    // Orphan workspace: created but membership insert failed under old RLS.
    const owned = await supabaseRest<WorkspaceRow[]>(
      `workspaces?created_by=eq.${session.user.id}&order=created_at.desc&limit=1`,
      session,
    );
    if (owned.length > 0) {
      const workspace = mapWorkspace(owned[0]);
      const membership = await ensureActiveMembership(session, workspace.id, options);
      saveLocalWorkspace(session.user.id, workspace);
      clearLocalCollaborationMode(session.user.id);
      return { workspace, membership };
    }

    const name = options?.companyName?.trim() || `${options?.displayName || "My"} Collective`;
    const slug = `${slugify(name)}-${session.user.id.slice(0, 8)}`;

    const workspaces = await supabaseRest<WorkspaceRow[]>("workspaces", session, {
      method: "POST",
      body: { name, slug, created_by: session.user.id },
      prefer: "return=representation",
    });

    const workspace = mapWorkspace(workspaces[0]);
    const membership = await ensureActiveMembership(session, workspace.id, {
      displayName: options?.displayName,
    });

    saveLocalWorkspace(session.user.id, workspace);
    clearLocalCollaborationMode(session.user.id);
    return { workspace, membership };
  } catch (err) {
    markLocalCollaborationMode(session.user.id);
    const message =
      err instanceof Error ? err.message : "Workspace could not connect to Supabase.";
    throw new Error(message);
  }
}

export function ensureLocalWorkspace(
  session: SupabaseSession,
  options?: { companyName?: string; displayName?: string },
): { workspace: Workspace; membership: WorkspaceMember } {
  const userId = session.user.id;
  let existing = loadLocalWorkspace(userId);
  const now = new Date().toISOString();

  if (existing && !isUuid(existing.id)) {
    clearLocalWorkspaceForUser(userId);
    existing = null;
  }

  if (existing) {
    const members = loadLocalMembers(existing.id);
    const membership =
      members.find((m) => m.userId === userId) ??
      members[0] ?? {
        id: newId(),
        workspaceId: existing.id,
        userId,
        invitedEmail: null,
        role: "admin" as const,
        status: "active" as const,
        displayName: options?.displayName ?? null,
        joinedAt: now,
        createdAt: now,
      };
    return { workspace: existing, membership };
  }

  const workspaceId = createLocalWorkspaceId();
  const name = options?.companyName?.trim() || `${options?.displayName || "My"} Collective`;
  const workspace: Workspace = {
    id: workspaceId,
    name,
    slug: slugify(name),
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  };

  const membership: WorkspaceMember = {
    id: newId(),
    workspaceId,
    userId,
    invitedEmail: session.user.email ?? null,
    role: "admin",
    status: "active",
    displayName: options?.displayName ?? session.user.email?.split("@")[0] ?? "You",
    joinedAt: now,
    createdAt: now,
  };

  saveLocalWorkspace(userId, workspace);
  saveLocalMembers(workspaceId, [membership]);

  return { workspace, membership };
}

export async function listWorkspaceMembers(
  session: SupabaseSession,
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  if (shouldUseLocalCollaboration(session, workspaceId)) {
    return loadLocalMembers(workspaceId);
  }

  try {
    const rows = await supabaseRest<MemberRow[]>(
      `workspace_members?workspace_id=eq.${workspaceId}&order=created_at.asc`,
      session,
    );
    return rows.map(mapMember);
  } catch {
    return loadLocalMembers(workspaceId);
  }
}

export async function inviteWorkspaceMember(
  session: SupabaseSession,
  workspaceId: string,
  input: { email: string; role: WorkspaceRole; displayName?: string },
): Promise<{ member: WorkspaceMember; invite: WorkspaceInvite }> {
  const email = input.email.trim().toLowerCase();
  const now = new Date().toISOString();

  if (shouldUseLocalCollaboration(session, workspaceId)) {
    const members = loadLocalMembers(workspaceId);
    const member: WorkspaceMember = {
      id: newId(),
      workspaceId,
      userId: null,
      invitedEmail: email,
      role: input.role,
      status: "invited",
      displayName: input.displayName ?? email.split("@")[0],
      joinedAt: null,
      createdAt: now,
    };
    members.push(member);
    saveLocalMembers(workspaceId, members);

    const invites = loadLocalInvites(workspaceId);
    const invite: WorkspaceInvite = {
      id: newId(),
      workspaceId,
      email,
      role: input.role,
      token: newId(),
      expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
      acceptedAt: null,
      createdAt: now,
    };
    invites.push(invite);
    saveLocalInvites(workspaceId, invites);

    return { member, invite };
  }

  const memberRows = await supabaseRest<MemberRow[]>("workspace_members", session, {
    method: "POST",
    body: {
      workspace_id: workspaceId,
      invited_email: email,
      role: input.role,
      status: "invited",
      display_name: input.displayName ?? email.split("@")[0],
    },
    prefer: "return=representation",
  });

  const inviteRows = await supabaseRest<InviteRow[]>("workspace_invites", session, {
    method: "POST",
    body: {
      workspace_id: workspaceId,
      email,
      role: input.role,
      invited_by: session.user.id,
    },
    prefer: "return=representation",
  });

  return { member: mapMember(memberRows[0]), invite: mapInvite(inviteRows[0]) };
}

export async function updateMemberRole(
  session: SupabaseSession,
  memberId: string,
  role: WorkspaceRole,
): Promise<WorkspaceMember> {
  if (shouldUseLocalCollaboration(session)) {
    const userId = session.user.id;
    const ws = loadLocalWorkspace(userId);
    if (!ws) throw new Error("Workspace not found");
    const members = loadLocalMembers(ws.id).map((m) =>
      m.id === memberId ? { ...m, role } : m,
    );
    saveLocalMembers(ws.id, members);
    const updated = members.find((m) => m.id === memberId);
    if (!updated) throw new Error("Member not found");
    return updated;
  }

  const rows = await supabaseRest<MemberRow[]>(
    `workspace_members?id=eq.${memberId}`,
    session,
    { method: "PATCH", body: { role }, prefer: "return=representation" },
  );
  return mapMember(rows[0]);
}

export async function updateWorkspaceMemberProfile(
  session: SupabaseSession,
  memberId: string,
  input: { displayName?: string; avatarUrl?: string | null },
): Promise<WorkspaceMember> {
  const displayName = input.displayName?.trim();
  const avatarUrl = input.avatarUrl?.trim() || null;

  if (shouldUseLocalCollaboration(session)) {
    const userId = session.user.id;
    const ws = loadLocalWorkspace(userId);
    if (!ws) throw new Error("Workspace not found");
    const members = loadLocalMembers(ws.id).map((m) =>
      m.id === memberId
        ? {
            ...m,
            ...(displayName ? { displayName } : {}),
            avatarUrl,
          }
        : m,
    );
    saveLocalMembers(ws.id, members);
    const updated = members.find((m) => m.id === memberId);
    if (!updated) throw new Error("Member not found");
    return updated;
  }

  const body: Record<string, string | null> = {};
  if (displayName) body.display_name = displayName;
  if (input.avatarUrl !== undefined) body.avatar_url = avatarUrl;

  const rows = await supabaseRest<MemberRow[]>(
    `workspace_members?id=eq.${memberId}`,
    session,
    { method: "PATCH", body, prefer: "return=representation" },
  );
  if (!rows[0]) throw new Error("Member not found.");
  return mapMember(rows[0]);
}

export async function removeWorkspaceMember(
  session: SupabaseSession,
  workspaceId: string,
  memberId: string,
): Promise<void> {
  if (shouldUseLocalCollaboration(session, workspaceId)) {
    const members = loadLocalMembers(workspaceId).filter((m) => m.id !== memberId);
    saveLocalMembers(workspaceId, members);
    return;
  }

  await supabaseRest(`workspace_members?id=eq.${memberId}`, session, {
    method: "DELETE",
    prefer: "return=minimal",
  });
}

export async function listWorkspaceInvites(
  session: SupabaseSession,
  workspaceId: string,
): Promise<WorkspaceInvite[]> {
  if (shouldUseLocalCollaboration(session, workspaceId)) {
    return loadLocalInvites(workspaceId).filter((i) => !i.acceptedAt);
  }

  try {
    const rows = await supabaseRest<InviteRow[]>(
      `workspace_invites?workspace_id=eq.${workspaceId}&accepted_at=is.null&order=created_at.desc`,
      session,
    );
    return rows.map(mapInvite);
  } catch {
    return loadLocalInvites(workspaceId).filter((i) => !i.acceptedAt);
  }
}

export async function revokeWorkspaceInvite(
  session: SupabaseSession,
  workspaceId: string,
  input: { inviteId: string; memberId?: string },
): Promise<void> {
  if (shouldUseLocalCollaboration(session, workspaceId)) {
    saveLocalInvites(
      workspaceId,
      loadLocalInvites(workspaceId).filter((i) => i.id !== input.inviteId),
    );
    if (input.memberId) {
      const members = loadLocalMembers(workspaceId).filter((m) => m.id !== input.memberId);
      saveLocalMembers(workspaceId, members);
    }
    return;
  }

  await supabaseRest(`workspace_invites?id=eq.${input.inviteId}`, session, {
    method: "DELETE",
    prefer: "return=minimal",
  });
  if (input.memberId) {
    await supabaseRest(`workspace_members?id=eq.${input.memberId}`, session, {
      method: "DELETE",
      prefer: "return=minimal",
    });
  }
}
