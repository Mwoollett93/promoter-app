"use client";

import * as React from "react";
import { Clock3, ChevronDown, ChevronUp } from "lucide-react";

type TimeInputProps = {
  label?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  minuteStep?: 5 | 10 | 15 | 30;
};

function to12HourParts(value24: string): { time: string; meridiem: "AM" | "PM" } {
  const [hRaw, mRaw] = value24.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (Number.isNaN(h) || Number.isNaN(m)) return { time: "10:00", meridiem: "PM" };
  const meridiem = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return { time: `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")}`, meridiem };
}

function to24Hour(timePart: string, meridiem: "AM" | "PM"): string | null {
  const match = timePart.trim().match(/^(\d{1,2})(?::?(\d{1,2}))?$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  let h24 = hour % 12;
  if (meridiem === "PM") h24 += 12;
  return `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function normalizeUserInput(
  input: string,
  fallbackMeridiem: "AM" | "PM",
): { timePart: string; meridiem: "AM" | "PM" } | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;
  let meridiem: "AM" | "PM" = fallbackMeridiem;
  if (raw.includes("am") || raw.endsWith("a")) meridiem = "AM";
  if (raw.includes("pm") || raw.endsWith("p")) meridiem = "PM";
  const numeric = raw.replace(/[^0-9:]/g, "");
  if (/^\d{3,4}$/.test(numeric)) {
    const padded = numeric.padStart(4, "0");
    const h = String(Number(padded.slice(0, 2)));
    const m = padded.slice(2, 4);
    return { timePart: `${h}:${m}`, meridiem };
  }
  if (/^\d{1,2}$/.test(numeric)) return { timePart: `${numeric}:00`, meridiem };
  if (/^\d{1,2}:\d{1,2}$/.test(numeric)) return { timePart: numeric, meridiem };
  return null;
}

function generateTimeOptions(step: number): string[] {
  const out: string[] = [];
  for (let h = 0; h < 24; h += 1) {
    for (let m = 0; m < 60; m += step) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
}

function formatOption(value24: string): string {
  const { time, meridiem } = to12HourParts(value24);
  return `${time} ${meridiem}`;
}

export default function TimeInput({
  label = "Start Time",
  required = true,
  value = "22:00",
  onChange,
  disabled = false,
  className = "",
  minuteStep = 5,
}: TimeInputProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const parts = to12HourParts(value);
  const [timeText, setTimeText] = React.useState(parts.time);
  const [meridiem, setMeridiem] = React.useState<"AM" | "PM">(parts.meridiem);

  React.useEffect(() => {
    const next = to12HourParts(value);
    setTimeText(next.time);
    setMeridiem(next.meridiem);
  }, [value]);

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const options = React.useMemo(() => generateTimeOptions(minuteStep), [minuteStep]);

  const interactiveRing = disabled
    ? ""
    : "transition-colors hover:border-[#71717A] focus-within:border-[#8B5CF6] focus-within:hover:border-[#8B5CF6]";

  const commitText = () => {
    const parsed = normalizeUserInput(timeText, meridiem);
    if (!parsed) {
      const fallback = to12HourParts(value);
      setTimeText(fallback.time);
      setMeridiem(fallback.meridiem);
      return;
    }
    const next24 = to24Hour(parsed.timePart, parsed.meridiem);
    if (!next24) {
      const fallback = to12HourParts(value);
      setTimeText(fallback.time);
      setMeridiem(fallback.meridiem);
      return;
    }
    const normalized = to12HourParts(next24);
    setTimeText(normalized.time);
    setMeridiem(normalized.meridiem);
    onChange?.(next24);
  };

  const toggleMeridiem = () => {
    const next = meridiem === "AM" ? "PM" : "AM";
    setMeridiem(next);
    const next24 = to24Hour(timeText, next);
    if (next24) onChange?.(next24);
  };

  return (
    <div ref={rootRef} className={`relative w-full ${className}`}>
      <div className="mb-[6px] flex items-start gap-1">
        <span className="text-[14px] font-medium leading-[20px] text-[#F5F5F7]">{label}</span>
        {required && (
          <span className="text-[14px] font-medium leading-[20px] text-[#EF4444]">*</span>
        )}
      </div>

      <div
        className={`flex h-[44px] w-full items-center rounded-[8px] border border-[#3F3F46] bg-[#11111A] px-[14px] py-[10px] ${interactiveRing}`}
      >
        <div className="flex min-w-0 items-center gap-[10px]">
          <Clock3 className="h-5 w-5 shrink-0 text-[#F5F5F7]" strokeWidth={2} />
          <input
            value={timeText}
            onChange={(e) => setTimeText(e.target.value)}
            onBlur={commitText}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitText();
                (e.currentTarget as HTMLInputElement).blur();
              }
            }}
            disabled={disabled}
            className="w-[62px] bg-transparent text-[14px] font-medium leading-[20px] text-[#F5F5F7] outline-none placeholder:text-[#71717A] disabled:text-[#3F3F46] disabled:placeholder:text-[#3F3F46]"
            style={{ fontVariantNumeric: "tabular-nums" }}
            aria-label={`${label} time`}
          />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={toggleMeridiem}
            disabled={disabled}
            className="h-7 w-10 shrink-0 rounded text-center text-[14px] font-medium leading-[20px] text-[#F5F5F7] hover:bg-[#232330] disabled:text-[#3F3F46]"
            aria-label="Toggle AM/PM"
          >
            {meridiem}
          </button>

          <button
            type="button"
            onClick={() => !disabled && setOpen((v) => !v)}
            disabled={disabled}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#A1A1AA] hover:bg-[#232330] disabled:text-[#3F3F46]"
            aria-label="Open time options"
          >
            {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && !disabled && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-[12px] border border-[#232330] bg-[#11111A] shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
          <div className="max-h-[240px] overflow-y-auto py-2">
            {options.map((opt) => {
              const isSelected = opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange?.(opt);
                    const next = to12HourParts(opt);
                    setTimeText(next.time);
                    setMeridiem(next.meridiem);
                    setOpen(false);
                  }}
                  className={[
                    "w-full px-3 py-2 text-left text-[14px] leading-[20px]",
                    isSelected
                      ? "bg-[#7C3AED] text-[#F5F5F7]"
                      : "text-[#F5F5F7] hover:bg-[#232330]",
                  ].join(" ")}
                >
                  {formatOption(opt)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}