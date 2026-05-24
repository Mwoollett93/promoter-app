import { logActivity } from "@/lib/collaboration/activity";
import { createNotification } from "@/lib/collaboration/notifications";
import { createTask } from "@/lib/collaboration/tasks";
import { listWorkspaceMembers } from "@/lib/supabase/workspace";
import type { SupabaseSession } from "@/lib/types/artist";
import type { WorkspaceEvent } from "@/lib/types/collaboration";

export async function runArtistAddedAutomation(
  session: SupabaseSession,
  workspaceId: string,
  eventId: string,
  artistName: string,
) {
  await createTask(session, {
    workspaceId,
    eventId,
    title: `Confirm tech rider — ${artistName}`,
    column: "todo",
    labels: ["artist-advance"],
  });

  await logActivity(session, {
    workspaceId,
    eventId,
    entityType: "lineup",
    verb: "automation",
    summary: `Task created: Confirm tech rider for ${artistName}`,
  });
}

export async function runVenueConfirmedAutomation(
  session: SupabaseSession,
  workspaceId: string,
  eventId: string,
  venueName: string,
) {
  await createTask(session, {
    workspaceId,
    eventId,
    title: `Upload venue specs — ${venueName}`,
    column: "todo",
    labels: ["venue"],
  });
}

export async function runMarketingCountdownAutomation(
  session: SupabaseSession,
  workspaceId: string,
  event: WorkspaceEvent,
) {
  if (!event.dateKey) return;

  const daysUntil = Math.ceil(
    (Date.parse(`${event.dateKey}T00:00:00`) - Date.now()) / 86400000,
  );
  if (daysUntil > 14 || daysUntil < 0) return;

  const checklist = [
    { id: "m1", text: "Announce headliner", done: false },
    { id: "m2", text: "Post ticket link", done: false },
    { id: "m3", text: "Stories / reels push", done: false },
  ];

  await createTask(session, {
    workspaceId,
    eventId: event.id,
    title: "Marketing rollout checklist",
    column: "todo",
    labels: ["marketing"],
    checklist,
  });
}

export async function runForecastNegativeAutomation(
  session: SupabaseSession,
  workspaceId: string,
  event: WorkspaceEvent,
) {
  if (event.projectedProfit >= 0) return;

  const members = await listWorkspaceMembers(session, workspaceId);
  const financeUsers = members.filter(
    (m) => m.status === "active" && (m.role === "finance" || m.role === "admin") && m.userId,
  );

  for (const member of financeUsers) {
    if (!member.userId) continue;
    await createNotification(session, {
      userId: member.userId,
      workspaceId,
      type: "forecast_negative",
      title: "Forecast turned negative",
      body: `${event.name} is projecting a loss of ${Math.abs(event.projectedProfit).toFixed(0)}.`,
      linkPath: `/events/${event.id}/workspace`,
    });
  }

  await logActivity(session, {
    workspaceId,
    eventId: event.id,
    entityType: "finance",
    verb: "alert",
    summary: `Forecast turned negative for ${event.name}`,
    metadata: { projectedProfit: event.projectedProfit },
  });
}

export async function runTicketSalesLowAutomation(
  session: SupabaseSession,
  workspaceId: string,
  eventId: string,
  eventName: string,
) {
  await createTask(session, {
    workspaceId,
    eventId,
    title: `Boost promo — ${eventName}`,
    column: "todo",
    labels: ["marketing", "promo"],
    priority: "high",
  });
}
