"use client";

import CurrencyText from "@/app/components/ui/CurrencyText";
import { LINK_ACCENT, SECTION_CARD, SECTION_TITLE } from "@/lib/ui/page-surfaces";
import type { SalesCheckpoint } from "@/lib/ticket-sales/types";
import { SALES_PROVIDER_LABELS } from "@/lib/ticket-sales/types";
import { cn } from "@/lib/utils";

type CheckpointHistoryListProps = {
  checkpoints: SalesCheckpoint[];
  limit?: number;
  onViewAll?: () => void;
  className?: string;
};

export default function CheckpointHistoryList({
  checkpoints,
  limit = 5,
  onViewAll,
  className,
}: CheckpointHistoryListProps) {
  const sorted = [...checkpoints].sort(
    (a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime(),
  );
  const visible = sorted.slice(0, limit);
  const hasMore = sorted.length > limit;

  return (
    <section className={cn(SECTION_CARD, "flex min-h-0 flex-col p-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className={SECTION_TITLE}>Recent checkpoints</h3>
        {hasMore && onViewAll ? (
          <button type="button" onClick={onViewAll} className={LINK_ACCENT}>
            View all ({sorted.length})
          </button>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <p className="mt-2 flex flex-1 items-center text-[11px] text-[#71717A]">
          No checkpoints yet — add one or import a CSV.
        </p>
      ) : (
        <ul className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
          {visible.map((cp) => (
            <li
              key={cp.id}
              className="rounded-lg border border-[#232330] bg-[#0B0B10] px-2.5 py-2 text-[11px]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium tabular-nums text-[#F5F5F7]">
                  {cp.ticketsSold.toLocaleString()} sold
                </span>
                <span className="shrink-0 text-[#71717A]">
                  {new Date(cp.checkedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap gap-x-2 text-[#71717A]">
                <span>{SALES_PROVIDER_LABELS[cp.provider]}</span>
                <span>
                  Net <CurrencyText value={cp.netRevenue} />
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
