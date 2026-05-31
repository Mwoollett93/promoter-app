"use client";

import { SOURCE_STATUS_LABELS, type TicketSalesSnapshot } from "@/lib/ticket-sales/types";
import { resolveSourceStatuses } from "@/lib/ticket-sales/analytics";

type SalesSourceBadgesProps = {
  snapshot: TicketSalesSnapshot;
};

const BADGE_ACTIVE = "border-[#8B5CF6]/40 bg-[#1A1630] text-[#C4B5FD]";
const BADGE_IDLE = "border-[#3F3F46] bg-[#0B0B10] text-[#71717A]";

function badgeLabel(sourceType: keyof typeof SOURCE_STATUS_LABELS, active: boolean) {
  if (active) return SOURCE_STATUS_LABELS[sourceType].label;
  if (sourceType === "manual") return "Manual tracking · Not started";
  if (sourceType === "csv") return "CSV imported · No import yet";
  return `${SOURCE_STATUS_LABELS[sourceType].label} · Not connected`;
}

export default function SalesSourceBadges({ snapshot }: SalesSourceBadgesProps) {
  const statuses = resolveSourceStatuses(snapshot);

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map(({ sourceType, active }) => (
        <span
          key={sourceType}
          className={[
            "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium",
            active ? BADGE_ACTIVE : BADGE_IDLE,
          ].join(" ")}
          title={SOURCE_STATUS_LABELS[sourceType].description}
        >
          {badgeLabel(sourceType, active)}
        </span>
      ))}
    </div>
  );
}
