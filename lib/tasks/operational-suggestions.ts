import type { ManagedEventRecord } from "@/lib/data/events";

export type OperationalSuggestion = {
  id: string;
  title: string;
  detail: string;
  eventId: string;
  eventName: string;
  label: string;
};

/** Lightweight operational hints tied to events (no backend automation yet). */
export function buildOperationalSuggestions(events: ManagedEventRecord[]): OperationalSuggestion[] {
  const suggestions: OperationalSuggestion[] = [];

  for (const event of events) {
    if (event.status === "completed" || event.status === "canceled") continue;

    const venueUnset =
      !event.venueName.trim() || event.venueName.toLowerCase() === "tbd";

    if (venueUnset || !event.venueId) {
      suggestions.push({
        id: `${event.id}-venue`,
        title: "Venue capacity mismatch",
        detail: "Confirm venue specs and capacity before locking production.",
        eventId: event.id,
        eventName: event.name,
        label: "venue",
      });
    }

    if (event.artistCount < 1 || event.slotCount < 1) {
      suggestions.push({
        id: `${event.id}-lineup`,
        title: "Lineup incomplete",
        detail: "Add artists and slots to finalise the running order.",
        eventId: event.id,
        eventName: event.name,
        label: "lineup",
      });
    }

    if (event.projectedProfit < 0) {
      suggestions.push({
        id: `${event.id}-forecast`,
        title: "Artist deposit due",
        detail: "Margin is below break-even — review fees and ticket inventory.",
        eventId: event.id,
        eventName: event.name,
        label: "finance",
      });
    }

    if (event.ticketInventory < 1) {
      suggestions.push({
        id: `${event.id}-marketing`,
        title: "Marketing assets not uploaded",
        detail: "Set ticket inventory and publish promo assets for this show.",
        eventId: event.id,
        eventName: event.name,
        label: "marketing",
      });
    }
  }

  return suggestions.slice(0, 4);
}
