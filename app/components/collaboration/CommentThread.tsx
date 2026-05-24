"use client";

import * as React from "react";

import { createComment, listComments, parseMentions } from "@/lib/collaboration/comments";
import { logActivity } from "@/lib/collaboration/activity";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { notifyMentionedUsers } from "@/lib/notifications/rules";
import type { Comment, CommentTarget } from "@/lib/types/collaboration";

type CommentThreadProps = {
  targetType: CommentTarget;
  targetId: string;
  eventId?: string;
  title?: string;
};

export default function CommentThread({
  targetType,
  targetId,
  eventId,
  title = "Comments",
}: CommentThreadProps) {
  const { session, workspace, members } = useWorkspace();
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [body, setBody] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const memberNames = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) {
      if (m.userId) map.set(m.userId, m.displayName ?? m.invitedEmail ?? "Member");
    }
    return map;
  }, [members]);

  const refresh = React.useCallback(async () => {
    if (!session || !workspace) return;
    const list = await listComments(session, workspace.id, targetType, targetId);
    setComments(list);
  }, [session, workspace, targetType, targetId]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!session || !workspace || !body.trim() || sending) return;

    setSending(true);
    try {
      const mentionIds = parseMentions(body, members);
      const authorName = memberNames.get(session.user.id) ?? "You";
      const comment = await createComment(session, {
        workspaceId: workspace.id,
        targetType,
        targetId,
        body,
        mentionUserIds: mentionIds,
        authorName,
      });

      await logActivity(session, {
        workspaceId: workspace.id,
        eventId: eventId ?? null,
        entityType: "comment",
        entityId: comment.id,
        verb: "commented",
        summary: `${authorName} commented on ${targetType}`,
      });

      if (mentionIds.length > 0) {
        await notifyMentionedUsers(session, workspace.id, mentionIds, {
          title: "You were mentioned",
          body: body.slice(0, 120),
          linkPath: eventId ? `/events/${eventId}/workspace` : `/events`,
        });
      }

      setBody("");
      await refresh();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-[14px] font-semibold text-[#F5F5F7]">{title}</h3>
      <ul className="max-h-[320px] space-y-2 overflow-y-auto">
        {comments.map((comment) => (
          <li key={comment.id} className="rounded-lg border border-[#232330] bg-[#0F0F17] px-3 py-2">
            <p className="text-[12px] font-medium text-[#C4B5FD]">
              {memberNames.get(comment.authorId) ?? comment.authorName ?? "Member"}
            </p>
            <p className="mt-1 text-[13px] leading-5 text-[#E4E4E7]">{comment.body}</p>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Add a comment… Use @name to mention someone"
          className="w-full resize-y rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 py-2 text-[13px] text-[#F5F5F7] outline-none focus:border-[#8B5CF6]/50"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="inline-flex h-9 items-center rounded-lg bg-[#7C3AED] px-4 text-[13px] font-medium text-white disabled:opacity-50"
        >
          {sending ? "Posting…" : "Post comment"}
        </button>
      </form>
    </div>
  );
}
