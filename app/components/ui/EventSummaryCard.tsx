import { CalendarDays, Clock3, MapPin, Users } from "lucide-react";

type EventSummaryCardProps = {
  title: string;
  dateLabel: string;
  timeLabel: string;
  venueLabel: string;
  capacityLabel: string;
  description: string;
  imageSrc?: string;
  className?: string;
};

export default function EventSummaryCard({
  title,
  dateLabel,
  timeLabel,
  venueLabel,
  capacityLabel,
  description,
  imageSrc,
  className = "",
}: EventSummaryCardProps) {
  return (
    <section
      className={`w-full max-w-[411px] rounded-[16px] border border-[#181824] bg-gradient-to-b from-[#11111A] to-[#0D0D14] p-5 shadow-[0px_10px_40px_0px_rgba(0,0,0,0.4)] ${className}`}
    >
      <h3 className="text-[24px] leading-[28px] font-bold text-[#F5F5F7]">
        Event Summary
      </h3>

      <div className="mt-4 flex gap-4">
        <div className="h-[130px] w-[118px] shrink-0 overflow-hidden rounded-[8px] bg-[#1A1A24]">
          {imageSrc ? (
            <img src={imageSrc} alt={title} className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          {/* Title wraps / grows; card grows left because column is right-aligned */}
          <p className="break-words text-[20px] font-bold leading-tight text-[#F5F5F7] sm:text-[24px] sm:leading-[28px]">
            {title}
          </p>

          <div className="mt-3 space-y-2 text-[14px] leading-5 text-[#A1A1AA]">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span>{dateLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 shrink-0" />
              <span>{timeLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{venueLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0" />
              <span>{capacityLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="my-4 h-px w-full bg-[#232330]" />

      <p className="text-[14px] leading-7 text-[#A1A1AA]">{description}</p>
    </section>
  );
}