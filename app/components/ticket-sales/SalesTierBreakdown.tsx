"use client";

import { SECTION_CARD, SECTION_TITLE } from "@/lib/ui/page-surfaces";
import { cn } from "@/lib/utils";

type SalesTierBreakdownProps = {
  tiers: Array<{ name: string; sold: number; revenue: number }>;
  className?: string;
};

export default function SalesTierBreakdown({ tiers, className }: SalesTierBreakdownProps) {
  const max = Math.max(...tiers.map((t) => t.sold), 1);

  return (
    <section className={cn(SECTION_CARD, "flex min-h-0 flex-col p-3", className)}>
      <h4 className={SECTION_TITLE}>Ticket tiers</h4>
      {tiers.length === 0 ? (
        <p className="mt-2 flex flex-1 items-center text-[11px] text-[#71717A]">
          Import a CSV with tier rows to see breakdown.
        </p>
      ) : (
        <ul className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
          {tiers.map((tier) => (
            <li key={tier.name}>
              <div className="mb-0.5 flex justify-between text-[10px]">
                <span className="truncate text-[#E4E4E7]">{tier.name}</span>
                <span className="shrink-0 tabular-nums text-[#71717A]">{tier.sold}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#0B0B10] ring-1 ring-[#232330]">
                <div
                  className="h-full rounded-full bg-[#7C3AED]"
                  style={{ width: `${(tier.sold / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
