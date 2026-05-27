"use client";

import CurrencyText from "@/app/components/ui/CurrencyText";
import type { MonthPerformance } from "@/lib/run/run-performance";

type RunMonthlyProfitBarsProps = {
  months: MonthPerformance[];
  compact?: boolean;
};

export default function RunMonthlyProfitBars({ months, compact }: RunMonthlyProfitBarsProps) {
  if (months.length === 0) {
    return (
      <p className="py-4 text-center text-[11px] text-[#52525B]">No monthly data in this timeframe</p>
    );
  }

  const maxAbs = Math.max(...months.map((m) => Math.abs(m.profit)), 1);

  return (
    <ul className={compact ? "space-y-1.5" : "space-y-2"}>
      {months.map((m) => {
        const positive = m.profit >= 0;
        const widthPct = Math.max(4, (Math.abs(m.profit) / maxAbs) * 100);

        return (
          <li key={m.monthKey}>
            <div className="mb-0.5 flex items-center justify-between gap-2 text-[11px]">
              <span className="font-medium text-[#A1A1AA]">{m.shortLabel}</span>
              <span
                className={[
                  "shrink-0 font-semibold tabular-nums",
                  positive ? "text-emerald-400" : "text-[#FCA5A5]",
                ].join(" ")}
              >
                <CurrencyText value={m.profit} />
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#232330]">
              <div
                className={[
                  "h-full rounded-full transition-all",
                  positive ? "bg-emerald-500/70" : "bg-red-500/60",
                ].join(" ")}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            {!compact ? (
              <p className="mt-0.5 text-[10px] text-[#52525B]">
                {m.eventCount} show{m.eventCount === 1 ? "" : "s"}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
