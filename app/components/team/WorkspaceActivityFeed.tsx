"use client";

import * as React from "react";

import ActivityFeedItem from "@/app/components/team/ActivityFeedItem";
import { listActivity } from "@/lib/collaboration/activity";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import {
  LINK_ACCENT,
  SECTION_CARD,
  SECTION_CARD_PADDING,
  SECTION_TITLE,
} from "@/lib/ui/page-surfaces";
import type { ActivityEntity, ActivityLogEntry } from "@/lib/types/collaboration";

type ActivityFilter = "all" | ActivityEntity | "team";

const FILTERS: { id: ActivityFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "task", label: "Tasks" },
  { id: "event", label: "Events" },
  { id: "finance", label: "Finance" },
  { id: "team", label: "Team" },
];

function activityHref(entry: ActivityLogEntry): string | undefined {
  if (entry.entityType === "task") return "/tasks";
  if (entry.eventId) return `/events/${entry.eventId}/workspace`;
  return undefined;
}

type WorkspaceActivityFeedProps = {
  compact?: boolean;
  limit?: number;
  onViewAll?: () => void;
  fullPage?: boolean;
};

export default function WorkspaceActivityFeed({
  compact = false,
  limit,
  onViewAll,
  fullPage = false,
}: WorkspaceActivityFeedProps) {
  const { session, workspace, members } = useWorkspace();
  const [entries, setEntries] = React.useState<ActivityLogEntry[]>([]);
  const [filter, setFilter] = React.useState<ActivityFilter>("all");
  const [loading, setLoading] = React.useState(true);

  const fetchLimit = fullPage ? 80 : (limit ?? 30);

  const memberNames = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) {
      if (m.userId) map.set(m.userId, m.displayName ?? m.invitedEmail ?? "Member");
    }
    return map;
  }, [members]);

  React.useEffect(() => {
    if (!session || !workspace) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const list = await listActivity(session!, workspace!.id, { limit: fetchLimit });
      if (!cancelled) {
        setEntries(list);
        setLoading(false);
      }
    }

    void load();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [session, workspace, fetchLimit]);

  const filtered = React.useMemo(() => {
    let list = entries;
    if (filter === "team") {
      list = entries.filter((e) => e.entityType === "comment" || e.verb.includes("invite"));
    } else if (filter !== "all") {
      list = entries.filter((e) => e.entityType === filter);
    }
    if (limit != null && !fullPage) return list.slice(0, limit);
    return list;
  }, [entries, filter, limit, fullPage]);

  return (
    <section className={[SECTION_CARD, SECTION_CARD_PADDING].join(" ")}>
      <div className="flex items-center justify-between gap-2">
        <h2 className={SECTION_TITLE}>
          {compact ? "Recent workspace activity" : "Workspace activity"}
        </h2>
        {compact && onViewAll ? (
          <button type="button" onClick={onViewAll} className={LINK_ACCENT}>
            View all →
          </button>
        ) : null}
      </div>
      {(fullPage || !compact) && (
        <div className="mt-3 flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={[
                "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                filter === f.id
                  ? "bg-[#1A1630] text-[#C4B5FD] ring-1 ring-[#8B5CF6]/25"
                  : "text-[#71717A] hover:text-[#A1A1AA]",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      {loading ? (
        <p className="mt-3 text-[13px] text-[#71717A]">Loading activity…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-[#3F3F46] px-4 py-6 text-center text-[13px] text-[#A1A1AA]">
          No activity yet. Task moves, invites, and event updates appear here.
        </p>
      ) : (
        <ul
          className={[
            "mt-3 overflow-y-auto",
            fullPage ? "max-h-none" : compact ? "max-h-[220px]" : "max-h-[420px]",
            "space-y-0",
          ].join(" ")}
        >
          {filtered.map((entry) => (
            <ActivityFeedItem
              key={entry.id}
              entry={entry}
              actorName={memberNames.get(entry.actorId) ?? "Team member"}
              href={activityHref(entry)}
              compact={compact}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
