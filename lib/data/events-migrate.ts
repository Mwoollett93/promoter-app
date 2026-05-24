import { loadManagedEvents, saveManagedEvents } from "@/lib/data/events";
import { logActivity } from "@/lib/collaboration/activity";
import { createWorkspaceEvent } from "@/lib/supabase/events";
import type { SupabaseSession } from "@/lib/types/artist";

const MIGRATION_FLAG = "promosync:events-migrated";

export function hasMigratedEvents(userId: string) {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(`${MIGRATION_FLAG}:${userId}`) === "1";
}

export function markEventsMigrated(userId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${MIGRATION_FLAG}:${userId}`, "1");
}

export async function migrateLocalEventsToWorkspace(
  session: SupabaseSession,
  workspaceId: string,
): Promise<number> {
  if (hasMigratedEvents(session.user.id)) return 0;

  const local = loadManagedEvents();
  if (local.length === 0) {
    markEventsMigrated(session.user.id);
    return 0;
  }

  let imported = 0;
  for (const event of local) {
    await createWorkspaceEvent(session, {
      workspaceId,
      name: event.name,
      status: event.status,
      venueName: event.venueName,
      description: event.description,
      dateKey: event.dateKey,
      startTime: event.startTime,
      artistCount: event.artistCount,
      slotCount: event.slotCount,
      b2bCount: event.b2bCount,
      ticketInventory: event.ticketInventory,
      expectedRevenue: event.expectedRevenue,
      totalCosts: event.totalCosts,
      projectedProfit: event.projectedProfit,
    });
    imported += 1;
  }

  await logActivity(session, {
    workspaceId,
    entityType: "event",
    verb: "migrated",
    summary: `Imported ${imported} event(s) from this device`,
  });

  saveManagedEvents([]);
  markEventsMigrated(session.user.id);
  return imported;
}
