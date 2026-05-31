"use client";

import CurrencyText from "@/app/components/ui/CurrencyText";
import { SECTION_CARD, SECTION_TITLE } from "@/lib/ui/page-surfaces";
import type { BreakEvenMetrics } from "@/lib/ticket-sales/types";
import { cn } from "@/lib/utils";

type BreakEvenPanelProps = {
  metrics: BreakEvenMetrics;
  className?: string;
};

export default function BreakEvenPanel({ metrics, className }: BreakEvenPanelProps) {
  return (
    <section className={cn(SECTION_CARD, "flex min-h-0 flex-col p-3", className)}>
      <h3 className={SECTION_TITLE}>Break-even progress</h3>

      <div className="mt-2">
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="text-[#A1A1AA]">Progress</span>
          <span className="font-semibold tabular-nums text-[#F5F5F7]">
            {metrics.percentToBreakEven}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#0B0B10] ring-1 ring-[#232330]">
          <div
            className={[
              "h-full rounded-full transition-all",
              metrics.isBreakEven ? "bg-[#86EFAC]" : "bg-[#8B5CF6]",
            ].join(" ")}
            style={{ width: `${Math.min(100, metrics.percentToBreakEven)}%` }}
          />
        </div>
      </div>

      <ul className="mt-3 min-h-0 flex-1 space-y-1.5 text-[11px]">
        <li className="flex justify-between gap-2">
          <span className="text-[#71717A]">Event costs</span>
          <span className="font-medium tabular-nums text-[#F5F5F7]">
            <CurrencyText value={metrics.totalCosts} />
          </span>
        </li>
        <li className="flex justify-between gap-2">
          <span className="text-[#71717A]">Net revenue</span>
          <span className="font-medium tabular-nums text-[#86EFAC]">
            <CurrencyText value={metrics.netRevenue} />
          </span>
        </li>
        <li className="flex justify-between gap-2">
          <span className="text-[#71717A]">Remaining</span>
          <span className="font-medium tabular-nums text-[#F5F5F7]">
            <CurrencyText value={metrics.amountRemaining} />
          </span>
        </li>
        <li className="flex justify-between gap-2">
          <span className="text-[#71717A]">Tickets needed</span>
          <span className="font-medium tabular-nums text-[#F5F5F7]">
            {metrics.ticketsRequiredRemaining > 0
              ? metrics.ticketsRequiredRemaining.toLocaleString()
              : "—"}
          </span>
        </li>
      </ul>
    </section>
  );
}
