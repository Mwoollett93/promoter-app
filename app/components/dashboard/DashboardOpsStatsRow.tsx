"use client";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  PauseCircle,
} from "lucide-react";

import StatMiniCard from "@/app/components/dashboard/StatMiniCard";
import { GRID_CARD_GAP } from "@/lib/layout/page-layout";
import type { DashboardOpsStat } from "@/lib/data/dashboard-ops-stats";

const ICONS = [CalendarDays, CheckCircle2, ClipboardList, PauseCircle, AlertTriangle];

type DashboardOpsStatsRowProps = {
  stats: DashboardOpsStat[];
  dense?: boolean;
};

export default function DashboardOpsStatsRow({ stats, dense = false }: DashboardOpsStatsRowProps) {
  return (
    <section
      className={[
        "grid shrink-0 grid-cols-2 md:grid-cols-3 xl:grid-cols-5",
        dense ? "gap-2" : GRID_CARD_GAP,
      ].join(" ")}
    >
      {stats.map((stat, index) => (
        <StatMiniCard
          key={stat.label}
          icon={ICONS[index] ?? CalendarDays}
          label={stat.label}
          value={stat.value}
          trend={stat.trend}
          trendUp={stat.trendUp}
          dense={dense}
        />
      ))}
    </section>
  );
}
