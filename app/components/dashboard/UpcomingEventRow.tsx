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
}: UpcomingEventRowProps) {
  const inner = (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-[#3F3F46] bg-[#18181F] sm:h-[72px] sm:w-[77px]">
          {imageSrc ? (
            <img src={imageSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#2D2640] to-[#11111A]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-5 text-[#F5F5F7]">
            {title}
          </p>
          <p className="mt-0.5 truncate text-[12px] leading-4 text-[#A1A1AA]">
            {venueLabel}
          </p>
          <p className="mt-0.5 truncate text-[12px] leading-4 text-[#D4D4D8]">
            {timeRangeLabel}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-2 sm:flex-row sm:gap-6">
        <EventStatusBadge status={status} />

        <div className="hidden text-right sm:block">
          <p className="text-[13px] font-medium tabular-nums text-[#F5F5F7]">
            {dateLabel}
          </p>
          <p className="text-[11px] text-[#A1A1AA]">{relativeLabel}</p>
        </div>

        <ChevronRight
          className="size-5 shrink-0 text-[#71717A]"
          strokeWidth={2}
          aria-hidden
        />
      </div>
    </>
  );

  const shell =
    "flex w-full items-center justify-between gap-3 rounded-xl border border-[#232330] bg-[#11111A] px-3 py-3 transition-colors hover:border-[#3F3F46] sm:gap-4 sm:px-4";

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
