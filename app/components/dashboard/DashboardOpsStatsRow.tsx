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
};

export default function DashboardOpsStatsRow({ stats }: DashboardOpsStatsRowProps) {
  return (
    <section className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 ${GRID_CARD_GAP}`}>
      {stats.map((stat, index) => (
        <StatMiniCard
          key={stat.label}
          icon={ICONS[index] ?? CalendarDays}
          label={stat.label}
          value={stat.value}
          trend={stat.trend}
          trendUp={stat.trendUp}
        />
      ))}
    </section>
  );
}
