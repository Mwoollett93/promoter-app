"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type VenueOption = {
  label: string;
  value: string;
};

type VenueDropdownProps = {
  label?: string;
  required?: boolean;
  value?: string;
  options?: VenueOption[];
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

const defaultOptions: VenueOption[] = [
  { label: "Sub Club, Melbourne", value: "sub-club" },
  { label: "Revolver Upstairs, Melbourne", value: "revolver" },
];

export default function VenueDropdown({
  label = "Venue",
  required = true,
  value = "sub-club",
  options = defaultOptions,
  onChange,
  placeholder = "Select venue",
  disabled = false,
  className = "",
}: VenueDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selected = options.find((opt) => opt.value === value);
  const displayText = selected?.label ?? placeholder;

  const interactiveRing = disabled
    ? ""
    : "transition-colors hover:border-[#71717A] focus-visible:outline-none focus-visible:border-[#8B5CF6] focus-visible:hover:border-[#8B5CF6]";

  return (
    <div ref={rootRef} className={`relative w-full ${className}`}>
      <div className="mb-[6px] flex items-start gap-1">
        <span className="text-[14px] font-medium leading-[20px] text-[#F5F5F7]">{label}</span>
        {required && (
          <span className="text-[14px] font-medium leading-[20px] text-[#EF4444]">*</span>
        )}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={[
          "flex h-[44px] w-full items-center gap-[10px] rounded-[8px] border border-[#3F3F46] bg-[#11111A] px-[15px] py-[11px] text-left",
          "disabled:cursor-not-allowed disabled:opacity-60",
          open ? "border-[#8B5CF6] hover:border-[#8B5CF6]" : "",
          interactiveRing,
        ].join(" ")}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium leading-[20px] text-[#F5F5F7]">
          {displayText}
        </span>
        {open ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-[#A1A1AA]" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-[#A1A1AA]" />
        )}
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-[4px] border border-[#71717A] bg-[#0B0B10] shadow-[0px_10px_40px_0px_rgba(0,0,0,0.4)]">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange?.(opt.value);
                  setOpen(false);
                }}
                className={[
                  "flex h-[40px] w-full items-center px-[14px] py-[10px] text-left text-[14px] font-medium leading-[20px]",
                  isSelected
                    ? "bg-[#11111A] text-[#F5F5F7]"
                    : "bg-[#0B0B10] text-[#A1A1AA] hover:bg-[#11111A] hover:text-[#F5F5F7]",
                ].join(" ")}
              >
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}