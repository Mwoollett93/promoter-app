"use client";

import type { ReactNode } from "react";

import CurrencyText from "@/app/components/ui/CurrencyText";
import { SECTION_CARD_INNER } from "@/lib/ui/page-surfaces";
import type { SalesMetrics } from "@/lib/ticket-sales/types";

type SalesSummaryCardsProps = {
  metrics: SalesMetrics;
  breakEvenPct: number;
};

function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={[SECTION_CARD_INNER, "px-2.5 py-2"].join(" ")}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-[#71717A]">{label}</p>
      <p className="mt-0.5 text-[15px] font-bold tabular-nums text-[#F5F5F7]">{value}</p>
    </div>
  );
}

/** Top KPI row — six at-a-glance metrics for the sales cockpit. */
export default function SalesSummaryCards({ metrics, breakEvenPct }: SalesSummaryCardsProps) {
  return (
    <div className={`grid grid-cols-3 gap-2 sm:grid-cols-6`}>
      <StatCard label="Tickets sold" value={metrics.ticketsSold.toLocaleString()} />
      <StatCard label="Capacity" value={`${metrics.capacityPct}%`} />
      <StatCard label="Net revenue" value={<CurrencyText value={metrics.netRevenue} />} />
      <StatCard label="Break-even" value={`${breakEvenPct}%`} />
      <StatCard
        label="Sales velocity"
        value={metrics.salesVelocity != null ? `${metrics.salesVelocity}/day` : "—"}
      />
      <StatCard
        label="Forecast"
        value={
          metrics.forecastFinalAttendance != null
            ? metrics.forecastFinalAttendance.toLocaleString()
            : "—"
        }
      />
    </div>
  );
}
