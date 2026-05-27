"use client";

import CurrencyText from "@/app/components/ui/CurrencyText";
import SeasonPerformanceTrendChart from "@/app/components/season/SeasonPerformanceTrendChart";
import SeasonViewToggle, { type SeasonViewMode } from "@/app/components/season/SeasonViewToggle";
import type { MonthPerformance } from "@/lib/data/season-performance";
import type { SeasonSnapshot, TrendMonthPoint } from "@/lib/season/season-insights";
import { SECTION_CARD, FIELD_LABEL } from "@/lib/ui/page-surfaces";

type SeasonAnalyticsViewProps = {
  snapshot: SeasonSnapshot;
  months: MonthPerformance[];
  trendMonths: TrendMonthPoint[];
  viewMode: SeasonViewMode;
  onViewModeChange: (mode: SeasonViewMode) => void;
};

export default function SeasonAnalyticsView({
  snapshot,
  months,
  trendMonths,
  viewMode,
  onViewModeChange,
}: SeasonAnalyticsViewProps) {
  const profitPositive = snapshot.projectedProfit >= 0;

  return (
    <div className={[SECTION_CARD, "flex min-h-0 flex-1 flex-col overflow-hidden p-3"].join(" ")}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-semibold text-[#F5F5F7]">Season analytics</h2>
          <p className="text-[11px] text-[#71717A]">Revenue, costs, and monthly profit breakdown.</p>
        </div>
        <SeasonViewToggle value={viewMode} onChange={onViewModeChange} />
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Total revenue", value: <CurrencyText value={snapshot.totalRevenue} /> },
            { label: "Total costs", value: <CurrencyText value={snapshot.totalCosts} /> },
            {
              label: "Projected P/L",
              value: <CurrencyText value={snapshot.projectedProfit} />,
              accent: profitPositive ? "text-emerald-400" : "text-[#FCA5A5]",
            },
            { label: "Profit margin", value: `${snapshot.profitMarginPct}%` },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-[#232330] bg-[#0B0B10] px-3 py-2.5"
            >
              <p className={FIELD_LABEL}>{item.label}</p>
              <p
                className={[
                  "mt-0.5 text-[16px] font-bold tabular-nums",
                  item.accent ?? "text-[#F5F5F7]",
                ].join(" ")}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-[#232330] bg-[#0B0B10] p-3">
          <h3 className="text-[13px] font-semibold text-[#F5F5F7]">Monthly performance</h3>
          <div className="mt-3">
            <SeasonPerformanceTrendChart months={trendMonths} />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#232330]">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-[#11111A] text-[10px] uppercase tracking-wide text-[#71717A]">
              <tr>
                <th className="px-3 py-2 font-medium">Month</th>
                <th className="px-3 py-2 font-medium">Shows</th>
                <th className="px-3 py-2 font-medium">Revenue</th>
                <th className="px-3 py-2 font-medium">Costs</th>
                <th className="px-3 py-2 font-medium">P/L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232330]">
              {months.map((m) => (
                <tr key={m.monthKey} className="bg-[#0B0B10]">
                  <td className="px-3 py-2 font-medium text-[#E4E4E7]">{m.label}</td>
                  <td className="px-3 py-2 tabular-nums text-[#A1A1AA]">{m.eventCount}</td>
                  <td className="px-3 py-2 tabular-nums text-[#A1A1AA]">
                    <CurrencyText value={m.revenue} />
                  </td>
                  <td className="px-3 py-2 tabular-nums text-[#A1A1AA]">
                    <CurrencyText value={m.costs} />
                  </td>
                  <td
                    className={[
                      "px-3 py-2 font-semibold tabular-nums",
                      m.profit >= 0 ? "text-emerald-400" : "text-[#FCA5A5]",
                    ].join(" ")}
                  >
                    <CurrencyText value={m.profit} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
