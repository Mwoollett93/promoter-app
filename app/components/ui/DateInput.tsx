"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";

// Fix these paths to match your project (often "@/components/ui/..." not "@/app/...")
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DateInputProps = {
  label?: string;
  required?: boolean;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  className?: string;
};

export default function DateInput({
  label = "Date",
  required = true,
  value,
  onChange,
  disabled = false,
  className = "",
}: DateInputProps) {
  const [open, setOpen] = React.useState(false);

  const interactiveRing = disabled
    ? ""
    : [
        "transition-colors",
        "hover:border-[#71717A]",
        "focus-visible:outline-none",
        "focus-visible:border-[#8B5CF6]",
        "focus-visible:hover:border-[#8B5CF6]",
        // Stay “active” while popover is open (Radix sets data-state on trigger)
        "data-[state=open]:border-[#8B5CF6]",
        "data-[state=open]:hover:border-[#8B5CF6]",
      ].join(" ");

  const display = React.useMemo(() => {
    if (!value || Number.isNaN(value.getTime())) return "—";
    try {
      return format(value, "dd MMM yyyy");
    } catch {
      return "—";
    }
  }, [value]);

  return (
    <div className={`relative w-full ${className}`}>
      <div className="mb-[6px] flex items-start gap-1">
        <span className="text-[14px] font-medium leading-[20px] text-[#F5F5F7]">
          {label}
        </span>
        {required && (
          <span className="text-[14px] font-medium leading-[20px] text-[#EF4444]">
            *
          </span>
        )}
      </div>

      <Popover
        modal={true}
        open={open}
        onOpenChange={(next) => {
          if (!disabled) setOpen(next);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={[
              "flex h-[44px] w-full items-center gap-[10px] rounded-[8px] border border-[#3F3F46] bg-[#11111A] px-[14px] py-[10px] text-left",
              "disabled:cursor-not-allowed disabled:opacity-60",
              interactiveRing,
            ].join(" ")}
          >
            <CalendarIcon className="h-5 w-5 shrink-0 text-[#F5F5F7]" />
            <span className="text-[14px] font-medium leading-[20px] text-[#F5F5F7]">
              {display}
            </span>
            <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center">
              {open ? (
                <ChevronUp className="h-5 w-5 text-[#A1A1AA]" />
              ) : (
                <ChevronDown className="h-5 w-5 text-[#A1A1AA]" />
              )}
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={8}
          className="z-[100] w-auto border-[#232330] bg-[#11111A] p-0 text-[#F5F5F7]"
          // If the popover flashes open then closes, try uncommenting:
          // onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Calendar
            mode="single"
            month={value ?? new Date()}
            onMonthChange={() => {}}
            selected={value}
            onSelect={(date: Date | undefined) => {
              onChange?.(date);
              if (date) setOpen(false);
            }}
            defaultMonth={value ?? new Date()}
            className="rounded-[12px] bg-[#11111A] p-3"
            classNames={{
              months: "flex flex-col",
              month: "relative space-y-3",
              month_caption: "relative flex h-8 items-center justify-center",
              caption_label:
                "text-[14px] font-medium leading-[20px] text-[#F5F5F7]",
              nav: "absolute left-1 right-1 top-0 flex h-8 items-center justify-between px-1",
              button_previous:
                "z-10 inline-flex h-8 w-8 items-center justify-center rounded-md text-[#A1A1AA] hover:bg-[#232330] hover:text-[#F5F5F7]",
              button_next:
                "z-10 inline-flex h-8 w-8 items-center justify-center rounded-md text-[#A1A1AA] hover:bg-[#232330] hover:text-[#F5F5F7]",
              month_grid: "w-full border-collapse",
              weekdays: "grid grid-cols-7",
              weekday:
                "flex h-8 w-8 items-center justify-center text-[12px] font-normal leading-4 text-[#71717A]",
              weeks: "space-y-1",
              week: "grid grid-cols-7",
              day: "h-8 w-8 rounded-md p-0 text-[13px] font-normal leading-5 text-[#F5F5F7] hover:bg-[#232330]",
              selected: "bg-[#7C3AED] text-[#F5F5F7] hover:bg-[#7C3AED]",
              today: "border border-[#8B5CF6] text-[#F5F5F7]",
              outside: "text-[#3F3F46]",
              disabled: "text-[#3F3F46]",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}