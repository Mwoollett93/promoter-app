"use client";

import Link from "next/link";

import { memberInitials } from "@/lib/tasks/task-board-utils";
import type { ActivityLogEntry } from "@/lib/types/collaboration";

type ActivityFeedItemProps = {
  entry: ActivityLogEntry;
  actorName: string;
  href?: string;
  compact?: boolean;
};

export default function ActivityFeedItem({
  entry,
  actorName,
  href,
  compact = false,
}: ActivityFeedItemProps) {
  const body = (
    <>
      <div
        className={[
          "flex shrink-0 items-center justify-center rounded-full border border-[#3F3F46] bg-[#1A1630] font-semibold text-[#C4B5FD]",
          compact ? "size-6 text-[9px]" : "size-8 text-[10px]",
        ].join(" ")}
      >
        {memberInitials(actorName)}
      </div>
      <div className="min-w-0 flex-1">
        <p className={compact ? "text-[12px] leading-snug text-[#E4E4E7]" : "text-[13px] leading-snug text-[#E4E4E7]"}>
          {entry.summary}
        </p>
        <p className="mt-0.5 text-[10px] text-[#71717A]">
          {actorName} · {formatActivityTime(entry.createdAt)}
        </p>
      </div>
    </>
  );

  const rowClass = compact
    ? "flex gap-2 rounded-md px-1.5 py-1.5"
    : "flex gap-3 rounded-lg px-2 py-2";

  if (href) {
    return (
      <li>
        <Link href={href} className={[rowClass, "transition-colors hover:bg-[#18181F]"].join(" ")}>
          {body}
        </Link>
      </li>
    );
  }

  return <li className={rowClass}>{body}</li>;
}

function formatActivityTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
