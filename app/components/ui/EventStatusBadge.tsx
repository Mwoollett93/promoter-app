/**
 * Event status pills — Figma `14:137` (PromoSync — Promoter OS).
 */
export type EventStatus = "confirmed" | "planning" | "draft" | "cancelled";

const LABELS: Record<EventStatus, string> = {
  confirmed: "CONFIRMED",
  planning: "PLANNING",
  draft: "DRAFT",
  cancelled: "CANCELLED",
};

const variantClass: Record<EventStatus, string> = {
  confirmed:
    "border border-[#8B5CF6]/35 bg-[#8B5CF6]/12 text-[#C4B5FD]",
  planning:
    "border border-amber-500/25 bg-amber-500/10 text-amber-300",
  draft: "border border-[#52525B]/60 bg-[#27272F]/80 text-[#A1A1AA]",
  cancelled:
    "border border-red-500/25 bg-red-500/10 text-red-300",
};

export default function EventStatusBadge({
  status,
  className = "",
}: {
  status: EventStatus;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${variantClass[status]} ${className}`}
    >
      {LABELS[status]}
    </span>
  );
}
