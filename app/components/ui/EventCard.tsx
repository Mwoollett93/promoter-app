"use client";

import * as React from "react";

type EventCardProps = {
  venueName?: string;
  address?: string;
  capacity?: number;
  imageSrc?: string;
  onEdit?: () => void;
  className?: string;
};

export default function EventCard({
  venueName = "Sub Club",
  address = "22-24 King St, Melbourne VIC 3000",
  capacity = 250,
  imageSrc,
  onEdit,
  className = "",
}: EventCardProps) {
  return (
    <div className={`w-full max-w-[695px] h-[88px] ${className}`}>
      <div className="h-full w-full rounded-[8px] border border-[#3F3F46] bg-[#11111A] px-[12px] py-[2px] flex items-center gap-[6px] overflow-hidden">
        <div className="min-w-0 flex-1 flex items-start gap-4">
          <div className="h-[70px] w-[77px] shrink-0 overflow-hidden rounded-[6px] bg-white">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={`${venueName} venue`}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>

          <div className="min-w-0 h-[70px] flex flex-col justify-start gap-1 overflow-hidden">
            <p className="truncate text-[16px] leading-[24px] font-normal text-[#F5F5F7]">
              {venueName}
            </p>
            <p className="truncate text-[12px] leading-[16px] font-normal text-[#A1A1AA]">
              {address}
            </p>
            <p className="truncate text-[12px] leading-[16px] font-normal text-[#A1A1AA]">
              Capacity: {capacity}
            </p>
          </div>
        </div>

        <div className="h-[70px] shrink-0 py-1 flex items-start">
          <button
            type="button"
            onClick={onEdit}
            className="text-[14px] leading-[20px] font-medium text-[#7C3AED] hover:text-[#A855F7] focus:outline-none"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}