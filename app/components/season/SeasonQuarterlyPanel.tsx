"use client";

import CurrencyText from "@/app/components/ui/CurrencyText";
import type { MonthPerformance, QuarterPerformance } from "@/lib/data/season-performance";

type SeasonQuarterlyPanelProps = {
  months: MonthPerformance[];
  quarters: QuarterPerformance[];
  seasonProfit: number;
  targetProfit?: number;
};

function Bar({
  label,
  profit,
  max,
  sublabel,
}: {
  label: string;
  profit: number;
  max: number;
  sublabel: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((Math.abs(profit) / max) * 100)) : 0;
  const positive = profit >= 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[12px]">
        <span className="font-medium text-[#E4E4E7]">{label}</span>
        <span className={positive ? "text-emerald-400" : "text-red-400"}>
          <CurrencyText value={profit} />
        </span>
      </div>
      <p className="text-[10px] text-[#71717A]">{sublabel}</p>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#232330]">
        <div
          className={`h-full rounded-full ${positive ? "bg-[#8B5CF6]" : "bg-red-500/80"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function SeasonQuarterlyPanel({
  months,
  quarters,
  seasonProfit,
  targetProfit,
}: SeasonQuarterlyPanelProps) {
  const maxQuarter = Math.max(...quarters.map((q) => Math.abs(q.profit)), 1);
  const maxMonth = Math.max(...months.map((m) => Math.abs(m.profit)), 1);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#232330] bg-[#11111A] p-4">
        <h3 className="text-[15px] font-semibold text-[#F5F5F7]">Season performance</h3>
        <p className="mt-1 text-[12px] text-[#71717A]">
          Projected P&amp;L across this run — forecast totals from your event wizard.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-[#232330] bg-[#0B0B10] px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wide text-[#71717A]">Projected profit</dt>
            <dd className="mt-0.5 text-[18px] font-bold tabular-nums text-emerald-400">
              <CurrencyText value={seasonProfit} />
            </dd>
          </div>
          {targetProfit != null ? (
            <div className="rounded-lg border border-[#232330] bg-[#0B0B10] px-3 py-2">
              <dt className="text-[10px] uppercase tracking-wide text-[#71717A]">Target</dt>
              <dd className="mt-0.5 text-[18px] font-bold tabular-nums text-[#F5F5F7]">
                <CurrencyText value={targetProfit} />
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="rounded-xl border border-[#232330] bg-[#11111A] p-4">
        <h3 className="text-[14px] font-semibold text-[#F5F5F7]">Quarterly view</h3>
        <div className="mt-4 space-y-3">
          {quarters.map((q) => (
            <Bar
              key={q.label}
              label={q.label}
              profit={q.profit}
              max={maxQuarter}
              sublabel={`${q.eventCount} event${q.eventCount === 1 ? "" : "s"}`}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#232330] bg-[#11111A] p-4">
        <h3 className="text-[14px] font-semibold text-[#F5F5F7]">Monthly breakdown</h3>
        <div className="mt-4 max-h-[280px] space-y-3 overflow-y-auto pr-1">
          {months.map((m) => (
            <Bar
              key={m.monthKey}
              label={m.label}
              profit={m.profit}
              max={maxMonth}
              sublabel={`${m.eventCount} shows`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
