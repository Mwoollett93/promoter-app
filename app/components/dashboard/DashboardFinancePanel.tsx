"use client";

import CurrencyText from "@/app/components/ui/CurrencyText";
import type { DashboardFinanceScope, FinancialRow } from "@/lib/data/dashboard-snapshot";

function MiniSparkline({ values }: { values: number[] }) {
  const width = 200;
  const height = 36;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-9 w-full" preserveAspectRatio="none" aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke="#8B5CF6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type DashboardFinancePanelProps = {
  rows: FinancialRow[];
  sparklineValues: number[];
  scope: DashboardFinanceScope;
  onScopeChange: (scope: DashboardFinanceScope) => void;
};

export default function DashboardFinancePanel({
  rows,
  sparklineValues,
  scope,
  onScopeChange,
}: DashboardFinancePanelProps) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl border border-[#232330] bg-[#11111A] p-3 shadow-[0px_8px_24px_rgba(0,0,0,0.35)]">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold text-[#F5F5F7]">Financial Overview</h2>
        <select
          value={scope}
          onChange={(e) => onScopeChange(e.target.value as DashboardFinanceScope)}
          className="rounded border border-[#3F3F46] bg-[#0B0B10] px-1.5 py-0.5 text-[10px] text-[#E4E4E7] outline-none focus:border-[#8B5CF6]"
          aria-label="Finance range"
        >
          <option value="portfolio">All</option>
          <option value="active">Active</option>
        </select>
      </div>
      <ul className="mt-2 min-h-0 flex-1 space-y-1 text-[11px]">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-1">
            <span className="truncate text-[#71717A]">{row.label}</span>
            <span
              className={[
                "shrink-0 font-semibold tabular-nums",
                row.highlight ? "text-emerald-400" : "text-[#F5F5F7]",
              ].join(" ")}
            >
              {row.currencyAmount != null ? (
                <CurrencyText value={row.currencyAmount} />
              ) : (
                row.value
              )}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-1 shrink-0 rounded-md bg-[#0B0B10] ring-1 ring-[#232330]">
        <MiniSparkline values={sparklineValues} />
      </div>
    </section>
  );
}
