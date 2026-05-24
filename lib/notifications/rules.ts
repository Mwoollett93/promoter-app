import { createNotification } from "@/lib/collaboration/notifications";
import { listWorkspaceMembers } from "@/lib/supabase/workspace";
import type { SupabaseSession } from "@/lib/types/artist";
import type { WorkspaceEvent } from "@/lib/types/collaboration";

export async function notifyMentionedUsers(
  session: SupabaseSession,
  workspaceId: string,
  mentionUserIds: string[],
  context: { title: string; body: string; linkPath: string },
) {
  for (const userId of mentionUserIds) {
    if (userId === session.user.id) continue;
    await createNotification(session, {
      userId,
      workspaceId,
      type: "mention",
      title: context.title,
      body: context.body,
      linkPath: context.linkPath,
    });
  }
}

export async function notifyTaskAssigned(
  session: SupabaseSession,
  workspaceId: string,
  assigneeId: string,
  taskTitle: string,
  linkPath: string,
) {
  if (assigneeId === session.user.id) return;
  await createNotification(session, {
    userId: assigneeId,
    workspaceId,
    type: "task_assigned",
    title: "Task assigned to you",
    body: taskTitle,
    linkPath,
  });
}

export async function notifyVenueChanged(
  session: SupabaseSession,
  workspaceId: string,
  eventId: string,
  summary: string,
) {
  const members = await listWorkspaceMembers(session, workspaceId);
  for (const member of members) {
    if (!member.userId || member.userId === session.user.id) continue;
    await createNotification(session, {
      userId: member.userId,
      workspaceId,
      type: "venue_changed",
      title: "Venue updated",
      body: summary,
      linkPath: `/events/${eventId}/workspace`,
    });
  }
}

export async function notifyMarketingLeadTime(
  session: SupabaseSession,
  workspaceId: string,
  event: WorkspaceEvent,
) {
  if (!event.dateKey) return;
  const daysUntil = Math.ceil(
    (Date.parse(`${event.dateKey}T00:00:00`) - Date.now()) / 86400000,
  );
  if (daysUntil > 30 || daysUntil < 0) return;

  const members = await listWorkspaceMembers(session, workspaceId);
  const marketing = members.filter(
    (m) => m.status === "active" && (m.role === "marketing" || m.role === "promoter") && m.userId,
  );

  for (const member of marketing) {
    if (!member.userId) continue;
    await createNotification(session, {
      userId: member.userId,
      workspaceId,
      type: "event_deadline",
      title: "Event approaching",
      body: `${event.name} is in ${daysUntil} days — time to push marketing.`,
      linkPath: `/events/${event.id}/workspace`,
    });
  }
}

export async function notifyLineupIncomplete(
  session: SupabaseSession,
  workspaceId: string,
  event: WorkspaceEvent,
) {
  if (event.slotCount > 0) return;
  if (!event.dateKey) return;

  const daysUntil = Math.ceil(
    (Date.parse(`${event.dateKey}T00:00:00`) - Date.now()) / 86400000,
  );
  if (daysUntil > 7) return;

  const members = await listWorkspaceMembers(session, workspaceId);
  const promoters = members.filter(
    (m) => m.status === "active" && (m.role === "promoter" || m.role === "admin") && m.userId,
  );

  for (const member of promoters) {
    if (!member.userId) continue;
    await createNotification(session, {
      userId: member.userId,
      workspaceId,
      type: "lineup_incomplete",
      title: "Lineup incomplete",
      body: `${event.name} has no lineup slots yet and is ${daysUntil} days out.`,
      linkPath: `/event-wizard/lineup-&-schedule`,
    });
  }
}
