"use client";

import SalesCompactChart from "@/app/components/ticket-sales/SalesCompactChart";
import { SECTION_CARD, SECTION_TITLE } from "@/lib/ui/page-surfaces";
import { cn } from "@/lib/utils";

type SalesRevenueVelocityPanelProps = {
  revenueValues: number[];
  velocityValues: number[];
  chartId: string;
  className?: string;
};

/** Right column — stacked compact net revenue + daily velocity charts. */
export default function SalesRevenueVelocityPanel({
  revenueValues,
  velocityValues,
  chartId,
  className,
}: SalesRevenueVelocityPanelProps) {
  return (
    <section className={cn(SECTION_CARD, "flex min-h-0 flex-col gap-2 p-3", className)}>
      <SalesCompactChart
        title="Net revenue"
        values={revenueValues}
        gradientId={`${chartId}-rev`}
        emptyLabel="No revenue data yet."
        height={56}
        embedded
      />
      <div className="h-px bg-[#232330]" />
      <SalesCompactChart
        title="Daily velocity"
        values={velocityValues}
        gradientId={`${chartId}-vel`}
        emptyLabel="Need 2+ checkpoints for velocity."
        height={56}
        embedded
      />
    </section>
  );
}
