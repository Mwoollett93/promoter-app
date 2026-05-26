"use client";

import Link from "next/link";

import { memberInitials } from "@/lib/tasks/task-board-utils";
import type { ActivityLogEntry } from "@/lib/types/collaboration";

type ActivityFeedItemProps = {
  entry: ActivityLogEntry;
  actorName: string;
  href?: string;
};

export default function ActivityFeedItem({ entry, actorName, href }: ActivityFeedItemProps) {
  const body = (
    <>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#3F3F46] bg-[#18181F] text-[10px] font-semibold text-[#C4B5FD]">
        {memberInitials(actorName)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] leading-snug text-[#E4E4E7]">{entry.summary}</p>
        <p className="mt-0.5 text-[10px] text-[#71717A]">
          {actorName} · {formatActivityTime(entry.createdAt)}
        </p>
      </div>
    </>
  );

  if (href) {
    return (
      <li>
        <Link
          href={href}
          className="flex gap-3 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-[#232330] hover:bg-[#14141F]/80"
        >
          {body}
        </Link>
      </li>
    );
  }

  return (
    <li className="flex gap-3 rounded-lg px-2 py-2">
      {body}
    </li>
  );
}

function formatActivityTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
