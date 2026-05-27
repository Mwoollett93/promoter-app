"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { TopArtistRow, TopVenueRow } from "@/lib/data/dashboard-snapshot";

type DashboardVenuesArtistsProps = {
  venues: TopVenueRow[];
  artists: TopArtistRow[];
};

export default function DashboardVenuesArtists({ venues, artists }: DashboardVenuesArtistsProps) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl border border-[#232330] bg-[#11111A] p-3 shadow-[0px_8px_24px_rgba(0,0,0,0.35)]">
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
        <div className="flex min-h-0 flex-col">
          <h3 className="shrink-0 text-[12px] font-semibold text-[#F5F5F7]">Top Venues</h3>
          <ul className="mt-1.5 min-h-0 flex-1 space-y-1.5 overflow-hidden">
            {venues.length > 0 ? (
              venues.slice(0, 2).map((v) => (
                <li key={v.name} className="flex items-center gap-2">
                  <div className="h-7 w-7 shrink-0 overflow-hidden rounded border border-[#3F3F46] bg-[#18181F]">
                    {v.thumb ? <img src={v.thumb} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-[#F5F5F7]">{v.name}</p>
                    <p className="text-[10px] text-[#71717A]">{v.events} events</p>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-[10px] text-[#71717A]">No venues yet</li>
            )}
          </ul>
        </div>

        <div className="flex min-h-0 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-1">
            <h3 className="text-[12px] font-semibold text-[#F5F5F7]">Top Artists</h3>
            <Link href="/artists" className="text-[#8B5CF6] hover:text-[#A855F7]" aria-label="View artists">
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <ul className="mt-1.5 min-h-0 flex-1 space-y-1.5 overflow-hidden">
            {artists.length > 0 ? (
              artists.slice(0, 2).map((a) => (
                <li key={a.name}>
                  <Link href="/artists" className="flex items-center gap-2">
                    <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-[#3F3F46]">
                      {a.avatar ? (
                        <img src={a.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-[#2D2640] to-[#11111A]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-medium text-[#F5F5F7]">{a.name}</p>
                      <p className="text-[10px] text-[#71717A]">{a.events} bookings</p>
                    </div>
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-[10px] text-[#71717A]">No artists yet</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
