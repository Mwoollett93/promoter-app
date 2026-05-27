"use client";

import CurrencyText from "@/app/components/ui/CurrencyText";
import RunMonthlyProfitBars from "@/app/components/run/RunMonthlyProfitBars";
import type { RunSnapshot } from "@/lib/run/run-insights";
import type { MonthPerformance } from "@/lib/run/run-performance";
import { SECTION_CARD } from "@/lib/ui/page-surfaces";

type RunFinancialsPanelProps = {
  snapshot: RunSnapshot;
  months: MonthPerformance[];
};

export default function RunFinancialsPanel({ snapshot, months }: RunFinancialsPanelProps) {
  const profitPositive = snapshot.projectedProfit >= 0;

  return (
    <div className={[SECTION_CARD, "shrink-0 p-3"].join(" ")}>
      <h2 className="text-[14px] font-semibold text-[#F5F5F7]">Expanded financials</h2>
      <p className="mt-0.5 text-[11px] text-[#71717A]">Monthly breakdown for the selected timeframe</p>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        <div className="max-w-[280px]">
          <RunMonthlyProfitBars months={months} />
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
            <tfoot className="border-t border-[#232330] bg-[#11111A]">
              <tr>
                <td className="px-3 py-2 font-semibold text-[#F5F5F7]">Total</td>
                <td className="px-3 py-2 tabular-nums text-[#F5F5F7]">{snapshot.totalShows}</td>
                <td className="px-3 py-2 tabular-nums text-[#F5F5F7]">
                  <CurrencyText value={snapshot.totalRevenue} />
                </td>
                <td className="px-3 py-2 tabular-nums text-[#F5F5F7]">
                  <CurrencyText value={snapshot.totalCosts} />
                </td>
                <td
                  className={[
                    "px-3 py-2 font-bold tabular-nums",
                    profitPositive ? "text-emerald-400" : "text-[#FCA5A5]",
                  ].join(" ")}
                >
                  <CurrencyText value={snapshot.projectedProfit} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
