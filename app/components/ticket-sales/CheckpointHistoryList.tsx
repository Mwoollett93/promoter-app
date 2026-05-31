"use client";

import CurrencyText from "@/app/components/ui/CurrencyText";
import { SECTION_CARD, SECTION_CARD_PADDING, SECTION_TITLE } from "@/lib/ui/page-surfaces";
import type { SalesCheckpoint } from "@/lib/ticket-sales/types";
import { SALES_PROVIDER_LABELS } from "@/lib/ticket-sales/types";

type CheckpointHistoryListProps = {
  checkpoints: SalesCheckpoint[];
};

export default function CheckpointHistoryList({ checkpoints }: CheckpointHistoryListProps) {
  const sorted = [...checkpoints].sort(
    (a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime(),
  );

  return (
    <section className={[SECTION_CARD, SECTION_CARD_PADDING].join(" ")}>
      <h3 className={SECTION_TITLE}>Checkpoint history</h3>
      {sorted.length === 0 ? (
        <p className="mt-3 text-[12px] text-[#71717A]">Checkpoints appear here after you add data.</p>
      ) : (
        <ul className="mt-3 max-h-[220px] space-y-2 overflow-y-auto pr-1">
          {sorted.map((cp) => (
            <li
              key={cp.id}
              className="rounded-lg border border-[#232330] bg-[#0B0B10] px-3 py-2.5 text-[12px]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-[#F5F5F7]">
                  {cp.ticketsSold.toLocaleString()} tickets
                </span>
                <span className="text-[#71717A]">
                  {new Date(cp.checkedAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[#A1A1AA]">
                <span>{SALES_PROVIDER_LABELS[cp.provider]}</span>
                <span>
                  Net <CurrencyText value={cp.netRevenue} />
                </span>
                <span>
                  Gross <CurrencyText value={cp.grossRevenue} />
                </span>
              </div>
              {cp.notes ? <p className="mt-1 text-[11px] text-[#71717A]">{cp.notes}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
