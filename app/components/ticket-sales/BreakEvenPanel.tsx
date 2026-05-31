"use client";

import CurrencyText from "@/app/components/ui/CurrencyText";
import { SECTION_CARD, SECTION_CARD_PADDING, SECTION_TITLE } from "@/lib/ui/page-surfaces";
import type { BreakEvenMetrics } from "@/lib/ticket-sales/types";

type BreakEvenPanelProps = {
  metrics: BreakEvenMetrics;
};

export default function BreakEvenPanel({ metrics }: BreakEvenPanelProps) {
  return (
    <section className={[SECTION_CARD, SECTION_CARD_PADDING].join(" ")}>
      <h3 className={SECTION_TITLE}>Break-even progress</h3>
      <p className="mt-1 text-[12px] text-[#A1A1AA]">
        Net ticket revenue vs event costs from finance data.
      </p>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-[12px]">
          <span className="text-[#A1A1AA]">Progress</span>
          <span className="font-semibold tabular-nums text-[#F5F5F7]">
            {metrics.percentToBreakEven}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#0B0B10] ring-1 ring-[#232330]">
          <div
            className={[
              "h-full rounded-full transition-all",
              metrics.isBreakEven ? "bg-[#86EFAC]" : "bg-[#8B5CF6]",
            ].join(" ")}
            style={{ width: `${Math.min(100, metrics.percentToBreakEven)}%` }}
          />
        </div>
      </div>

      <ul className="mt-4 space-y-2 text-[13px]">
        <li className="flex justify-between gap-2">
          <span className="text-[#A1A1AA]">Event costs</span>
          <span className="font-medium tabular-nums text-[#F5F5F7]">
            <CurrencyText value={metrics.totalCosts} />
          </span>
        </li>
        <li className="flex justify-between gap-2">
          <span className="text-[#A1A1AA]">Net revenue</span>
          <span className="font-medium tabular-nums text-[#86EFAC]">
            <CurrencyText value={metrics.netRevenue} />
          </span>
        </li>
        <li className="flex justify-between gap-2">
          <span className="text-[#A1A1AA]">Remaining to break even</span>
          <span className="font-medium tabular-nums text-[#F5F5F7]">
            <CurrencyText value={metrics.amountRemaining} />
          </span>
        </li>
        <li className="flex justify-between gap-2">
          <span className="text-[#A1A1AA]">Tickets still needed</span>
          <span className="font-medium tabular-nums text-[#F5F5F7]">
            {metrics.ticketsRequiredRemaining > 0
              ? metrics.ticketsRequiredRemaining.toLocaleString()
              : "—"}
          </span>
        </li>
        <li className="flex justify-between gap-2">
          <span className="text-[#A1A1AA]">Avg ticket (net)</span>
          <span className="font-medium tabular-nums text-[#F5F5F7]">
            {metrics.averageTicketPrice > 0 ? (
              <CurrencyText value={metrics.averageTicketPrice} />
            ) : (
              "—"
            )}
          </span>
        </li>
      </ul>
    </section>
  );
}
