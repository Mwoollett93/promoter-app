"use client";

import * as React from "react";
import { Filter, X } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type FilterOption<T extends string = string> = {
  value: T;
  label: string;
};

type FilterPopoverProps<T extends string> = {
  label?: string;
  options: FilterOption<T>[];
  value: T | "all";
  onChange: (value: T | "all") => void;
  activeCount?: number;
  onClearAll?: () => void;
  children?: React.ReactNode;
};

export default function FilterPopover<T extends string>({
  label = "Filters",
  options,
  value,
  onChange,
  activeCount = 0,
  onClearAll,
  children,
}: FilterPopoverProps<T>) {
  const [open, setOpen] = React.useState(false);
  const hasActive = activeCount > 0 || value !== "all";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={[
            "inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors",
            hasActive
              ? "border-[#8B5CF6]/50 bg-[#2D2640]/40 text-[#F5F5F7]"
              : "border-[#232330] bg-[#11111A] text-[#E4E4E7] hover:border-[#8B5CF6]/50 hover:text-white",
          ].join(" ")}
        >
          <Filter className="size-4" aria-hidden />
          {label}
          {hasActive ? (
            <span className="rounded-full bg-[#7C3AED] px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {activeCount > 0 ? activeCount : 1}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[280px] border-[#232330] bg-[#11111A] p-4 text-[#F5F5F7]"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-semibold">{label}</p>
          {hasActive ? (
            <button
              type="button"
              onClick={() => {
                if (onClearAll) onClearAll();
                else onChange("all");
              }}
              className="text-[12px] text-[#8B5CF6] hover:text-[#C4B5FD]"
            >
              Clear
            </button>
          ) : null}
        </div>
        <div className="mt-3 space-y-3">
          {children}
          {options.length > 0 ? (
            <div className="space-y-1">
              {options.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-[#181824]"
                >
                  <input
                    type="radio"
                    name="filter-popover"
                    checked={value === option.value}
                    onChange={() => onChange(option.value)}
                    className="accent-[#8B5CF6]"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-[#3F3F46] py-2 text-[13px] text-[#E4E4E7] hover:border-[#71717A]"
        >
          <X className="size-3.5" aria-hidden />
          Done
        </button>
      </PopoverContent>
    </Popover>
  );
}
