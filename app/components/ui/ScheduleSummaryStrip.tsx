import { Clock, ClockCheck, ClockFading } from "lucide-react";

/**
 * Schedule summary — Figma component set `117:1904` (variants: with / without B2B column).
 * Nested in card as `117:1987`. Presentational only.
 */
export type ScheduleSummaryStripProps = {
  eventStartTime: string;
  eventStartDate: string;
  eventEndTime: string;
  eventEndDate: string;
  totalRuntimeLabel: string;
  b2bCount: number;
  className?: string;
};

const segmentBase =
  "flex min-w-0 flex-1 items-start gap-1.5 overflow-hidden p-2.5"; /* gap 6px, p 10px */
const divider = "border-r-2 border-[#181824]";
const iconRing =
  "flex size-10 shrink-0 items-center justify-center rounded-full border border-[#3F3F46] p-0.5";
const textCol =
  "flex shrink-0 flex-col gap-1.5 px-1.5 text-[12px] leading-4 text-white whitespace-nowrap";

export default function ScheduleSummaryStrip({
  eventStartTime,
  eventStartDate,
  eventEndTime,
  eventEndDate,
  totalRuntimeLabel,
  b2bCount,
  className = "",
}: ScheduleSummaryStripProps) {
  const withB2B = b2bCount > 0;

  return (
    <div
      className={`flex w-full items-center justify-between overflow-hidden rounded-[6px] border border-[#181824] bg-[#11111A] p-3 ${className}`}
      data-node-id="117:1904"
      data-name="Schedule summary"
      data-summary-state={withB2B ? "Schedule summary (B2B)" : "Schedule summary (no B2B)"}
    >
      {/* Event Start — lucide `clock` in 40px ring (same as end / duration columns) */}
      <div className={`${segmentBase} ${divider}`}>
        <div className={iconRing} aria-hidden>
          <Clock className="size-5 text-white" strokeWidth={2} />
        </div>
        <div className={textCol}>
          <p className="font-normal">Event Start</p>
          <p className="font-bold tracking-[0.12px]">{eventStartTime}</p>
          <p className="font-normal">{eventStartDate}</p>
        </div>
      </div>

      {/* Event End (auto) — lucide `clock-check` in ring */}
      <div className={`${segmentBase} ${divider}`}>
        <div className={iconRing} aria-hidden>
          <ClockCheck className="size-5 text-white" strokeWidth={2} />
        </div>
        <div className={textCol}>
          <p className="font-normal">Event End (auto)</p>
          <p className="font-bold tracking-[0.12px]">{eventEndTime}</p>
          <p className="font-normal">{eventEndDate}</p>
        </div>
      </div>

      {/* Total Run Time — right divider only when B2B column follows (Figma `117:1904`) */}
      <div
        className={`${segmentBase} h-20 ${withB2B ? divider : ""}`}
        data-name="Total Run Time"
      >
        <div className={iconRing} aria-hidden>
          <ClockFading className="size-5 text-white" strokeWidth={2} />
        </div>
        <div className={textCol}>
          <p className="font-normal">Total Run Time</p>
          <p className="font-bold tracking-[0.12px]">{totalRuntimeLabel}</p>
        </div>
      </div>

      {withB2B ? (
        <div className={`${segmentBase} h-20`} data-name="B2B Sets">
          <div className={iconRing} aria-hidden>
            <span className="text-[14px] font-medium leading-5 tabular-nums text-[#F5F5F7]">
              {b2bCount}
            </span>
          </div>
          <div className="flex shrink-0 flex-col gap-1.5 px-1.5">
            <div className="inline-flex w-fit items-center justify-center rounded-[3px] border border-[#8B5CF6] px-1.5 py-0.5">
              <span className="text-[12px] font-bold leading-4 tracking-[0.12px] text-[#8B5CF6]">
                B2B
              </span>
            </div>
            <p className="text-[12px] font-normal leading-4 text-[#8B5CF6]">B2B Sets</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
