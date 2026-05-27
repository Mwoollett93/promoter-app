"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import EventStatusBadge from "@/app/components/ui/EventStatusBadge";
import CurrencyText from "@/app/components/ui/CurrencyText";
import { formatDateLabel } from "@/lib/data/format";
import type { ManagedEventRecord } from "@/lib/data/events";

type RunEventCardProps = {
  event: ManagedEventRecord;
  imageSrc?: string;
};

export default function RunEventCard({ event, imageSrc }: RunEventCardProps) {
  const profitPositive = event.projectedProfit >= 0;
  const venueShort = event.venueName.split(",")[0]?.trim() ?? event.venueName;
  const dateLabel = event.dateKey ? formatDateLabel(event.dateKey) : "TBD";

  return (
    <article
      className={[
        "group relative w-[220px] shrink-0 rounded-xl border bg-gradient-to-b from-[#16161F] to-[#0B0B10] p-2.5 shadow-[0px_4px_16px_rgba(0,0,0,0.3)] transition-colors",
        "hover:border-[#8B5CF6]/45",
        profitPositive ? "border-[#232330]" : "border-red-500/25",
      ].join(" ")}
    >
      <div className="flex gap-2">
        <div className="h-10 w-8 shrink-0 overflow-hidden rounded-md border border-[#3F3F46] bg-[#18181F]">
          {imageSrc ? (
            <img src={imageSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#2D2640] to-[#11111A]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="inline-block rounded bg-[#1A1630] px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-[#C4B5FD]">
            {dateLabel}
          </span>
          <h3 className="mt-1 line-clamp-2 text-[13px] font-semibold leading-tight text-[#F5F5F7]">
            {event.name}
          </h3>
          <p className="mt-0.5 truncate text-[10px] text-[#71717A]">{venueShort}</p>
        </div>
      </div>

      <p
        className={[
          "mt-2 text-[14px] font-bold tabular-nums leading-none",
          profitPositive ? "text-emerald-400" : "text-[#FCA5A5]",
        ].join(" ")}
      >
        <CurrencyText value={event.projectedProfit} />
      </p>

      <div className="mt-1.5 flex items-center justify-between gap-1">
        <EventStatusBadge status={event.status} />
        <span className="text-[9px] tabular-nums text-[#52525B]">
          {event.ticketInventory.toLocaleString()} cap
        </span>
      </div>

      <Link
        href={`/events/${event.id}/workspace`}
        className="mt-2 flex items-center justify-center gap-1 rounded-md border border-[#3F3F46] bg-[#11111A] py-1 text-[10px] font-medium text-[#C4B5FD] opacity-0 transition-opacity group-hover:opacity-100 hover:border-[#8B5CF6]/40"
      >
        <ExternalLink className="size-3" />
        Open
      </Link>
    </article>
  );
}
