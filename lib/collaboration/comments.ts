import {
  loadLocalComments,
  newId,
  saveLocalComments,
} from "@/lib/collaboration/local-store";
import type { SupabaseSession } from "@/lib/types/artist";
import type { Comment, CommentTarget } from "@/lib/types/collaboration";

import { getSupabaseConfig, isDemoSession } from "@/lib/supabase/browser";
import { supabaseRest } from "@/lib/supabase/client-rest";

type CommentRow = {
  id: string;
  workspace_id: string;
  target_type: CommentTarget;
  target_id: string;
  parent_id: string | null;
  body: string;
  mention_user_ids: string[];
  author_id: string;
  created_at: string;
  updated_at: string;
};

function mapRow(row: CommentRow): Comment {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    targetType: row.target_type,
    targetId: row.target_id,
    parentId: row.parent_id,
    body: row.body,
    mentionUserIds: row.mention_user_ids ?? [],
    authorId: row.author_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listComments(
  session: SupabaseSession,
  workspaceId: string,
  targetType: CommentTarget,
  targetId: string,
): Promise<Comment[]> {
  if (isDemoSession(session) || !getSupabaseConfig()) {
    return loadLocalComments(workspaceId)
      .filter((c) => c.targetType === targetType && c.targetId === targetId)
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  }

  try {
    const rows = await supabaseRest<CommentRow[]>(
      `comments?workspace_id=eq.${workspaceId}&target_type=eq.${targetType}&target_id=eq.${targetId}&order=created_at.asc`,
      session,
    );
    return rows.map(mapRow);
  } catch {
    return loadLocalComments(workspaceId).filter(
      (c) => c.targetType === targetType && c.targetId === targetId,
    );
  }
}

export async function createComment(
  session: SupabaseSession,
  input: {
    workspaceId: string;
    targetType: CommentTarget;
    targetId: string;
    body: string;
    mentionUserIds?: string[];
    parentId?: string | null;
    authorName?: string;
  },
): Promise<Comment> {
  const now = new Date().toISOString();
  const comment: Comment = {
    id: newId(),
    workspaceId: input.workspaceId,
    targetType: input.targetType,
    targetId: input.targetId,
    parentId: input.parentId ?? null,
    body: input.body.trim(),
    mentionUserIds: input.mentionUserIds ?? [],
    authorId: session.user.id,
    authorName: input.authorName,
    createdAt: now,
    updatedAt: now,
  };

  if (isDemoSession(session) || !getSupabaseConfig()) {
    const comments = loadLocalComments(input.workspaceId);
    comments.push(comment);
    saveLocalComments(input.workspaceId, comments);
    return comment;
  }

  try {
    const rows = await supabaseRest<CommentRow[]>("comments", session, {
      method: "POST",
      body: {
        workspace_id: input.workspaceId,
        target_type: input.targetType,
        target_id: input.targetId,
        parent_id: input.parentId ?? null,
        body: comment.body,
        mention_user_ids: comment.mentionUserIds,
        author_id: session.user.id,
      },
      prefer: "return=representation",
    });
    return { ...mapRow(rows[0]), authorName: input.authorName };
  } catch {
    const comments = loadLocalComments(input.workspaceId);
    comments.push(comment);
    saveLocalComments(input.workspaceId, comments);
    return comment;
  }
}

export function parseMentions(body: string, members: { userId: string | null; displayName: string | null; invitedEmail: string | null }[]) {
  const ids: string[] = [];
  const pattern = /@([a-zA-Z0-9._-]+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body)) !== null) {
    const handle = match[1].toLowerCase();
    const member = members.find((m) => {
      const name = (m.displayName ?? m.invitedEmail ?? "").toLowerCase();
      return name.startsWith(handle) || name.split(" ")[0] === handle;
    });
    if (member?.userId && !ids.includes(member.userId)) ids.push(member.userId);
  }
  return ids;
}
