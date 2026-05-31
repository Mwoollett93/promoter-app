import Link from "next/link";
import { ChevronRight } from "lucide-react";

import EventStatusBadge, {
  type EventStatus,
} from "@/app/components/ui/EventStatusBadge";

export type UpcomingEventRowProps = {
  href?: string;
  title: string;
  venueLabel: string;
  timeRangeLabel: string;
  status: EventStatus;
  dateLabel: string;
  relativeLabel: string;
  imageSrc?: string;
};

/**
 * Upcoming Events list row — Figma `10:876` (list cell using event card language `10:363`).
 */
export default function UpcomingEventRow({
  href = "#",
  title,
  venueLabel,
  timeRangeLabel,
  status,
  dateLabel,
  relativeLabel,
  imageSrc,
  compact = false,
  className = "",
}: UpcomingEventRowProps & { compact?: boolean; className?: string }) {
  const inner = (
    <>
      <div className={["flex min-w-0 flex-1 items-center", compact ? "gap-2" : "gap-3 sm:gap-4"].join(" ")}>
        <div
          className={[
            "relative shrink-0 overflow-hidden rounded-md border border-[#3F3F46] bg-[#18181F]",
            compact ? "h-10 w-10" : "h-14 w-14 sm:h-[72px] sm:w-[77px]",
          ].join(" ")}
        >
          {imageSrc ? (
            <img src={imageSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#2D2640] to-[#11111A]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={[
              "truncate font-semibold text-[#F5F5F7]",
              compact ? "text-[13px] leading-4" : "text-[15px] leading-5",
            ].join(" ")}
          >
            {title}
          </p>
          <p className={["truncate text-[#A1A1AA]", compact ? "text-[10px] leading-3" : "mt-0.5 text-[12px] leading-4"].join(" ")}>
            {venueLabel}
            {compact ? ` · ${timeRangeLabel}` : null}
          </p>
          {!compact ? (
            <p className="mt-0.5 truncate text-[12px] leading-4 text-[#D4D4D8]">
              {timeRangeLabel}
            </p>
          ) : null}
        </div>
      </div>

      <div className={["flex shrink-0 items-center", compact ? "gap-2" : "gap-4 sm:gap-6"].join(" ")}>
        <EventStatusBadge status={status} />

        <div className="text-right">
          <p className={["font-medium tabular-nums text-[#F5F5F7]", compact ? "text-[11px]" : "text-[13px]"].join(" ")}>
            {dateLabel}
          </p>
          {!compact ? <p className="text-[11px] text-[#A1A1AA]">{relativeLabel}</p> : null}
        </div>

        {!compact ? (
          <ChevronRight
            className="size-5 shrink-0 text-[#71717A]"
            strokeWidth={2}
            aria-hidden
          />
        ) : null}
      </div>
    </>
  );

  const shell = [
    "flex w-full min-w-0 items-center justify-between rounded-lg border border-[#232330] bg-[#0B0B10] transition-colors hover:border-[#3F3F46]",
    compact ? "gap-2 px-2 py-1.5" : "min-h-[88px] gap-3 rounded-xl bg-[#11111A] px-3 py-3 sm:gap-4 sm:px-4",
    className,
  ].join(" ");

  if (href && href !== "#") {
    return (
      <Link href={href} className={shell}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={shell} role="group">
      {inner}
    </div>
  );
}
