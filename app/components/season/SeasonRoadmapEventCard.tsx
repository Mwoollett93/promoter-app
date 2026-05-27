"use client";

import Link from "next/link";
import { ExternalLink, MoreHorizontal } from "lucide-react";
import * as React from "react";

import EventStatusBadge from "@/app/components/ui/EventStatusBadge";
import CurrencyText from "@/app/components/ui/CurrencyText";
import { assignEventSeason } from "@/lib/data/event-season";
import { formatDateLabel } from "@/lib/data/format";
import type { ManagedEventRecord } from "@/lib/data/events";
import type { SeasonRecord } from "@/lib/data/seasons";

type SeasonRoadmapEventCardProps = {
  event: ManagedEventRecord;
  seasons: SeasonRecord[];
  imageSrc?: string;
  onSeasonChange?: () => void;
  compact?: boolean;
};

export default function SeasonRoadmapEventCard({
  event,
  seasons,
  imageSrc,
  onSeasonChange,
  compact = false,
}: SeasonRoadmapEventCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const profitPositive = event.projectedProfit >= 0;
  const venueShort = event.venueName.split(",")[0]?.trim() ?? event.venueName;

  return (
    <article
      className={[
        "group relative z-[1] rounded-xl border bg-gradient-to-b from-[#16161F] to-[#0B0B10] shadow-[0px_8px_24px_rgba(0,0,0,0.35)] transition-all",
        "hover:z-10 hover:border-[#8B5CF6]/50 hover:shadow-[0_0_24px_rgba(139,92,246,0.15)]",
        compact ? "w-[248px] p-2.5" : "w-[268px] p-3",
        profitPositive ? "border-[#232330]" : "border-red-500/25",
      ].join(" ")}
    >
      <div className="flex gap-2.5">
        {!compact ? (
          <div className="h-12 w-10 shrink-0 overflow-hidden rounded-md border border-[#3F3F46] bg-[#18181F]">
            {imageSrc ? (
              <img src={imageSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#2D2640] to-[#11111A]" />
            )}
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <h3 className="line-clamp-2 text-[14px] font-semibold leading-tight text-[#F5F5F7]">
              {event.name}
            </h3>
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="rounded p-0.5 text-[#71717A] opacity-0 transition-opacity hover:bg-[#232330] hover:text-[#F5F5F7] group-hover:opacity-100"
                aria-label="Event actions"
              >
                <MoreHorizontal className="size-4" />
              </button>
              {menuOpen ? (
                <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-[#232330] bg-[#11111A] py-1 shadow-lg">
                  <Link
                    href={`/events/${event.id}/workspace`}
                    className="flex items-center gap-2 px-3 py-2 text-[12px] text-[#E4E4E7] hover:bg-[#18181F]"
                    onClick={() => setMenuOpen(false)}
                  >
                    <ExternalLink className="size-3.5" />
                    Open workspace
                  </Link>
                  <div className="border-t border-[#232330] px-2 py-2">
                    <label className="mb-1 block text-[10px] uppercase tracking-wide text-[#71717A]">
                      Season
                    </label>
                    <select
                      value={event.seasonId ?? ""}
                      onChange={(e) => {
                        assignEventSeason(event.id, e.target.value || undefined);
                        onSeasonChange?.();
                        setMenuOpen(false);
                      }}
                      className="w-full rounded border border-[#3F3F46] bg-[#0B0B10] px-2 py-1 text-[11px] text-[#E4E4E7]"
                    >
                      <option value="">Unassigned</option>
                      {seasons.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <p className="mt-1 text-[11px] text-[#A1A1AA]">
            {event.dateKey ? formatDateLabel(event.dateKey) : "Date TBD"}
            <span className="text-[#52525B]"> · </span>
            <span className="text-[#71717A]">{venueShort}</span>
          </p>

          <p
            className={[
              "mt-2 text-[15px] font-bold tabular-nums leading-none",
              profitPositive ? "text-emerald-400" : "text-[#FCA5A5]",
            ].join(" ")}
          >
            <CurrencyText value={event.projectedProfit} />
            <span className="ml-1 text-[10px] font-medium text-[#71717A]">proj. P/L</span>
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <EventStatusBadge status={event.status} />
            <span className="text-[10px] tabular-nums text-[#71717A]">
              {event.ticketInventory.toLocaleString()} cap
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Link
          href={`/events/${event.id}/workspace`}
          className="flex-1 rounded-md border border-[#3F3F46] bg-[#11111A] py-1 text-center text-[10px] font-medium text-[#C4B5FD] hover:border-[#8B5CF6]/40"
        >
          Open
        </Link>
      </div>
    </article>
  );
}
