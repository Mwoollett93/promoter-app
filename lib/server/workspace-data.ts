import { workspaceEventToManaged } from "@/lib/supabase/events";
import { listTaskCommentCounts } from "@/lib/collaboration/comments";
import { listNotifications } from "@/lib/collaboration/notifications";
import { listTasks } from "@/lib/collaboration/tasks";
import type { WorkspaceDataInclude, WorkspaceDataResponse } from "@/lib/collaboration/workspace-data-types";
import type { SupabaseSession } from "@/lib/types/artist";
import {
  acceptPendingWorkspaceInvites,
  listWorkspaceInvites,
  listWorkspaceMembers,
  resolvePrimaryWorkspace,
} from "@/lib/supabase/workspace";
import { listWorkspaceEvents } from "@/lib/supabase/events";

export async function loadWorkspaceDataForSession(
  session: SupabaseSession,
  include: WorkspaceDataInclude[],
): Promise<WorkspaceDataResponse | null> {
  const invitesAccepted = await acceptPendingWorkspaceInvites(session);

  const resolved = await resolvePrimaryWorkspace(session);
  if (!resolved) return null;

  const { workspace, membership } = resolved;
  const includeSet = new Set(include);

  const [members, events] = await Promise.all([
    includeSet.has("members") || includeSet.size === 0
      ? listWorkspaceMembers(session, workspace.id)
      : Promise.resolve([]),
    includeSet.has("events") || includeSet.size === 0
      ? listWorkspaceEvents(session, workspace.id).then((rows) => rows.map(workspaceEventToManaged))
      : Promise.resolve([]),
  ]);

  const payload: WorkspaceDataResponse = {
    workspace,
    membership,
    members,
    events,
    meta: { invitesAccepted },
  };

  const optionalFetches: Promise<void>[] = [];

  if (includeSet.has("tasks")) {
    optionalFetches.push(
      listTasks(session, workspace.id).then((tasks) => {
        payload.tasks = tasks;
      }),
    );
  }

  if (includeSet.has("invites")) {
    optionalFetches.push(
      listWorkspaceInvites(session, workspace.id).then((invites) => {
        payload.invites = invites;
      }),
    );
  }

  if (includeSet.has("commentCounts")) {
    optionalFetches.push(
      listTaskCommentCounts(session, workspace.id).then((counts) => {
        payload.taskCommentCounts = counts;
      }),
    );
  }

  if (includeSet.has("notifications")) {
    optionalFetches.push(
      listNotifications(session).then((notifications) => {
        payload.notifications = notifications;
      }),
    );
  }

  await Promise.all(optionalFetches);
  return payload;
}
