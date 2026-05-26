"use client";

import * as React from "react";

import ActivityFeedItem from "@/app/components/team/ActivityFeedItem";
import { listActivity } from "@/lib/collaboration/activity";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import type { ActivityEntity, ActivityLogEntry } from "@/lib/types/collaboration";

type ActivityFilter = "all" | ActivityEntity;

const FILTERS: { id: ActivityFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "task", label: "Tasks" },
  { id: "event", label: "Events" },
  { id: "finance", label: "Finance" },
];

function activityHref(entry: ActivityLogEntry): string | undefined {
  if (entry.entityType === "task") return "/tasks";
  if (entry.entityType === "event" && entry.eventId) return `/events/${entry.eventId}/workspace`;
  if (entry.eventId) return `/events/${entry.eventId}/workspace`;
  return undefined;
}

export default function WorkspaceActivityFeed() {
  const { session, workspace, members } = useWorkspace();
  const [entries, setEntries] = React.useState<ActivityLogEntry[]>([]);
  const [filter, setFilter] = React.useState<ActivityFilter>("all");
  const [loading, setLoading] = React.useState(true);

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
      const list = await listActivity(session!, workspace!.id, { limit: 30 });
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
  }, [session, workspace]);

  const filtered = React.useMemo(() => {
    if (filter === "all") return entries;
    return entries.filter((e) => e.entityType === filter);
  }, [entries, filter]);

  return (
    <section className="rounded-xl border border-[#232330]/90 bg-gradient-to-b from-[#14141F]/95 to-[#0F0F17] p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[14px] font-semibold text-[#F5F5F7]">Workspace activity</h2>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={[
              "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
              filter === f.id
                ? "bg-[#1A1630] text-[#C4B5FD]"
                : "text-[#71717A] hover:text-[#A1A1AA]",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="mt-4 text-[12px] text-[#71717A]">Loading activity…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-[#232330] px-3 py-6 text-center text-[12px] text-[#71717A]">
          No activity yet. Task moves, invites, and event updates appear here.
        </p>
      ) : (
        <ul className="mt-3 max-h-[420px] space-y-1 overflow-y-auto">
          {filtered.map((entry) => (
            <ActivityFeedItem
              key={entry.id}
              entry={entry}
              actorName={memberNames.get(entry.actorId) ?? "Team member"}
              href={activityHref(entry)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
