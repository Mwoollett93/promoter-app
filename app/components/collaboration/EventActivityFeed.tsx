"use client";

import * as React from "react";

import { listActivity } from "@/lib/collaboration/activity";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import type { ActivityLogEntry } from "@/lib/types/collaboration";

export default function EventActivityFeed({ eventId }: { eventId?: string }) {
  const { session, workspace, members } = useWorkspace();
  const [entries, setEntries] = React.useState<ActivityLogEntry[]>([]);
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
      const list = await listActivity(session!, workspace!.id, {
        eventId,
        limit: 40,
      });
      if (!cancelled) {
        setEntries(list);
        setLoading(false);
      }
    }

    void load();
    const interval = window.setInterval(load, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [session, workspace, eventId]);

  if (loading) {
    return <p className="text-[13px] text-[#71717A]">Loading activity…</p>;
  }

  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-[#232330] bg-[#11111A] px-4 py-6 text-center text-[13px] text-[#71717A]">
        No activity yet. Changes to lineup, finance, and tasks will appear here.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="rounded-xl border border-[#232330] bg-[#11111A] px-4 py-3"
        >
          <p className="text-[13px] text-[#E4E4E7]">{entry.summary}</p>
          <p className="mt-1 text-[11px] text-[#71717A]">
            {memberNames.get(entry.actorId) ?? "Team member"} ·{" "}
            {new Date(entry.createdAt).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}
