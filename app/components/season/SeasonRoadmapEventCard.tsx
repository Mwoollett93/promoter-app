"use client";

import Link from "next/link";
import { ExternalLink, MoreHorizontal } from "lucide-react";
import * as React from "react";

import EventStatusBadge from "@/app/components/ui/EventStatusBadge";
import CurrencyText from "@/app/components/ui/CurrencyText";
import { assignEventSeason } from "@/lib/data/event-season";
import type { ManagedEventRecord } from "@/lib/data/events";
import type { SeasonRecord } from "@/lib/data/seasons";
import { formatDateLabel } from "@/lib/data/format";

type SeasonRoadmapEventCardProps = {
  event: ManagedEventRecord;
  seasons: SeasonRecord[];
  imageSrc?: string;
  onSeasonChange?: () => void;
};

export default function SeasonRoadmapEventCard({
  event,
  seasons,
  imageSrc,
  onSeasonChange,
}: SeasonRoadmapEventCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const profitPositive = event.projectedProfit >= 0;

  return (
    <article className="group relative w-[220px] shrink-0 rounded-xl border border-[#232330] bg-gradient-to-b from-[#14141C] to-[#0B0B10] p-3 shadow-[0px_6px_20px_rgba(0,0,0,0.3)] transition-all hover:border-[#8B5CF6]/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.12)]">
      <div className="flex gap-2.5">
        <div className="h-14 w-11 shrink-0 overflow-hidden rounded-md border border-[#3F3F46] bg-[#18181F]">
          {imageSrc ? (
            <img src={imageSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#2D2640] to-[#11111A]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <h3 className="line-clamp-2 text-[13px] font-semibold leading-4 text-[#F5F5F7]">
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
                <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-[#232330] bg-[#11111A] py-1 shadow-lg">
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
          <p className="mt-1 truncate text-[11px] text-[#71717A]">{event.venueName}</p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <EventStatusBadge status={event.status} />
        <span className="rounded-md bg-[#1A1630] px-1.5 py-0.5 text-[10px] tabular-nums text-[#C4B5FD]">
          {event.dateKey ? formatDateLabel(event.dateKey) : "Date TBD"}
        </span>
      </div>

      <dl className="mt-2.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
        <div>
          <dt className="text-[#71717A]">Proj. P/L</dt>
          <dd
            className={[
              "font-semibold tabular-nums",
              profitPositive ? "text-emerald-400" : "text-[#FCA5A5]",
            ].join(" ")}
          >
            <CurrencyText value={event.projectedProfit} />
          </dd>
        </div>
        <div>
          <dt className="text-[#71717A]">Capacity</dt>
          <dd className="font-medium tabular-nums text-[#E4E4E7]">
            {event.ticketInventory.toLocaleString()}
          </dd>
        </div>
      </dl>

      <Link
        href={`/events/${event.id}/workspace`}
        className="mt-2 block text-center text-[11px] font-medium text-[#8B5CF6] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#A855F7]"
      >
        View event →
      </Link>
    </article>
  );
}
