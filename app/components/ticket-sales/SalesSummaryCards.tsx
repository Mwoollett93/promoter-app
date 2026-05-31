"use client";

import type { ReactNode } from "react";

import CurrencyText from "@/app/components/ui/CurrencyText";
import { GRID_CARD_GAP } from "@/lib/layout/page-layout";
import { SECTION_CARD_INNER } from "@/lib/ui/page-surfaces";
import type { SalesMetrics } from "@/lib/ticket-sales/types";

type SalesSummaryCardsProps = {
  metrics: SalesMetrics;
};

function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={[SECTION_CARD_INNER, "px-3 py-2.5"].join(" ")}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-[#71717A]">{label}</p>
      <p className="mt-1 text-[16px] font-bold tabular-nums text-[#F5F5F7]">{value}</p>
    </div>
  );
}

export default function SalesSummaryCards({ metrics }: SalesSummaryCardsProps) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 ${GRID_CARD_GAP}`}>
      <StatCard label="Tickets sold" value={metrics.ticketsSold.toLocaleString()} />
      <StatCard label="Capacity" value={`${metrics.capacityPct}%`} />
      <StatCard label="Gross revenue" value={<CurrencyText value={metrics.grossRevenue} />} />
      <StatCard label="Net revenue" value={<CurrencyText value={metrics.netRevenue} />} />
      <StatCard label="Fees" value={<CurrencyText value={metrics.fees} />} />
      <StatCard
        label="Sales velocity"
        value={metrics.salesVelocity != null ? `${metrics.salesVelocity}/day` : "—"}
      />
      <StatCard
        label="Forecast attendance"
        value={
          metrics.forecastFinalAttendance != null
            ? metrics.forecastFinalAttendance.toLocaleString()
            : "—"
        }
      />
      <StatCard label="Capacity total" value={metrics.capacity.toLocaleString()} />
    </div>
  );
}
