import Link from "next/link";

type EventCardProps = {
  venueName?: string;
  address?: string;
  capacity?: number;
  imageSrc?: string;
  /** If set, "Edit" renders as a Next.js link */
  editHref?: string;
  /** If no editHref, optional click handler */
  onEdit?: () => void;
  className?: string;
};

export default function EventCard({
  venueName = "Sub Club",
  address = "22-24 King St, Melbourne VIC 3000",
  capacity = 250,
  imageSrc,
  editHref,
  onEdit,
  className = "",
}: EventCardProps) {
  const editClassName =
    "text-[14px] font-medium leading-[20px] text-[#7C3AED] hover:text-[#A855F7] focus:outline-none focus-visible:underline";

  return (
    <div className={`w-full ${className}`}>
      <div className="flex h-full min-h-[88px] w-full items-center gap-[6px] overflow-hidden rounded-[8px] border border-[#3F3F46] bg-[#11111A] px-[12px] py-[2px]">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="h-[70px] w-[77px] shrink-0 overflow-hidden rounded-[6px] bg-white">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={`${venueName} venue`}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>

          <div className="flex min-w-0 flex-col justify-start gap-1">
            <p className="truncate text-[16px] font-normal leading-[24px] text-[#F5F5F7]">
              {venueName}
            </p>
            <p className="truncate text-[12px] leading-4 font-normal text-[#A1A1AA]">
              {address}
            </p>
            <p className="truncate text-[12px] leading-4 font-normal text-[#A1A1AA]">
              Capacity: {capacity}
            </p>
          </div>
        </div>

        <div className="flex h-[70px] shrink-0 items-start py-1">
          {editHref ? (
            <Link href={editHref} className={editClassName}>
              Edit
            </Link>
          ) : (
            <button type="button" onClick={onEdit} className={editClassName}>
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}