import {
  getDemoWorkspaceId,
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
import { supabaseRest } from "./client-rest";

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
    joinedAt: row.joined_at,
    createdAt: row.created_at,
  };
}

function mapInvite(row: InviteRow): WorkspaceInvite {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    email: row.email,
    role: row.role,
    token: row.token,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  };
}

export async function ensureWorkspaceForUser(
  session: SupabaseSession,
  options?: { companyName?: string; displayName?: string },
): Promise<{ workspace: Workspace; membership: WorkspaceMember }> {
  if (isDemoSession(session) || !getSupabaseConfig()) {
    return ensureLocalWorkspace(session, options);
  }

  try {
    const existing = await supabaseRest<MemberRow[]>(
      `workspace_members?user_id=eq.${session.user.id}&status=eq.active&limit=1`,
      session,
    );

    if (existing.length > 0) {
      const membership = mapMember(existing[0]);
      const workspaces = await supabaseRest<WorkspaceRow[]>(
        `workspaces?id=eq.${membership.workspaceId}&limit=1`,
        session,
      );
      if (workspaces.length > 0) {
        return { workspace: mapWorkspace(workspaces[0]), membership };
      }
    }

    const name = options?.companyName?.trim() || `${options?.displayName || "My"} Collective`;
    const slug = `${slugify(name)}-${session.user.id.slice(0, 8)}`;
    const now = new Date().toISOString();

    const workspaces = await supabaseRest<WorkspaceRow[]>("workspaces", session, {
      method: "POST",
      body: { name, slug, created_by: session.user.id },
      prefer: "return=representation",
    });

    const workspace = mapWorkspace(workspaces[0]);

    const members = await supabaseRest<MemberRow[]>("workspace_members", session, {
      method: "POST",
      body: {
        workspace_id: workspace.id,
        user_id: session.user.id,
        role: "admin",
        status: "active",
        display_name: options?.displayName ?? null,
        joined_at: now,
      },
      prefer: "return=representation",
    });

    return { workspace, membership: mapMember(members[0]) };
  } catch {
    return ensureLocalWorkspace(session, options);
  }
}

function ensureLocalWorkspace(
  session: SupabaseSession,
  options?: { companyName?: string; displayName?: string },
): { workspace: Workspace; membership: WorkspaceMember } {
  const userId = session.user.id;
  const existing = loadLocalWorkspace(userId);
  const now = new Date().toISOString();

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

  const workspaceId = getDemoWorkspaceId(userId);
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
  if (isDemoSession(session) || !getSupabaseConfig()) {
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

  if (isDemoSession(session) || !getSupabaseConfig()) {
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
  if (isDemoSession(session) || !getSupabaseConfig()) {
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

export async function removeWorkspaceMember(
  session: SupabaseSession,
  workspaceId: string,
  memberId: string,
): Promise<void> {
  if (isDemoSession(session) || !getSupabaseConfig()) {
    const members = loadLocalMembers(workspaceId).filter((m) => m.id !== memberId);
    saveLocalMembers(workspaceId, members);
    return;
  }

  await supabaseRest(`workspace_members?id=eq.${memberId}`, session, {
    method: "DELETE",
    prefer: "return=minimal",
  });
}
