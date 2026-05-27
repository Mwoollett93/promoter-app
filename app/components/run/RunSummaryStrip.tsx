"use client";

import CurrencyText from "@/app/components/ui/CurrencyText";
import type { RunSnapshot } from "@/lib/run/run-insights";
import { SECTION_CARD_INNER } from "@/lib/ui/page-surfaces";

type RunSummaryStripProps = {
  snapshot: RunSnapshot;
};

export default function RunSummaryStrip({ snapshot }: RunSummaryStripProps) {
  const profitPositive = snapshot.projectedProfit >= 0;

  const items = [
    { label: "Total shows", value: String(snapshot.totalShows) },
    {
      label: "Projected P/L",
      value: <CurrencyText value={snapshot.projectedProfit} />,
      accent: profitPositive ? "text-emerald-400" : "text-[#FCA5A5]",
    },
    {
      label: "Forecast attendance",
      value: snapshot.projectedAttendance.toLocaleString(),
    },
    {
      label: "Total revenue",
      value: <CurrencyText value={snapshot.totalRevenue} />,
    },
    {
      label: "Avg break-even",
      value: <CurrencyText value={snapshot.avgBreakEven} />,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className={[SECTION_CARD_INNER, "px-3 py-2.5"].join(" ")}>
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#71717A]">
            {item.label}
          </p>
          <p
            className={[
              "mt-0.5 text-[16px] font-bold tabular-nums tracking-tight",
              item.accent ?? "text-[#F5F5F7]",
            ].join(" ")}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
