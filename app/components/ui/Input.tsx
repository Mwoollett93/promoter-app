"use client";

import { useMemo, useState } from "react";

type InputState = "default" | "disabled" | "inactive" | "error";

type PromoSyncInputProps = {
  label?: string;
  required?: boolean;
  helperText?: string;
  errorText?: string;
  placeholder?: string;
  state?: InputState;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
};

export default function PromoSyncInput({
  label = "Label",
  required = true,
  helperText = "Help text goes here",
  errorText = "Help text goes here",
  placeholder = "Enter text...",
  state,
  value,
  onChange,
  className = "",
}: PromoSyncInputProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState("");
  const inputValue = isControlled ? value : internalValue;

  const derivedState: InputState = useMemo(() => {
    if (state) return state;
    return "default";
  }, [state]);

  const isFieldLocked = derivedState === "disabled" || derivedState === "inactive";
  const isError = derivedState === "error";

  const labelColor = isFieldLocked ? "text-[#3F3F46]" : "text-[#F5F5F7]";
  const borderColor = isError ? "border-[#EF4444]" : "border-[#3F3F46]";
  const helperColor = isError ? "text-[#EF4444]" : "text-[#71717A]";

  const interactiveRing =
    !isFieldLocked && !isError
      ? "transition-colors hover:border-[#71717A] focus-within:border-[#8B5CF6] focus-within:hover:border-[#8B5CF6]"
      : "";

  const inputClassName = isFieldLocked
    ? "w-full bg-transparent outline-none text-sm leading-5 font-medium text-[#3F3F46] placeholder:text-[#3F3F46]"
    : "w-full bg-transparent outline-none text-sm leading-5 font-medium text-[#F5F5F7] placeholder:text-[#71717A]";

  const handleChange = (next: string) => {
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  };

  return (
    <div className={`flex flex-col items-start gap-1.5 ${className}`}>
      <div className="flex items-start gap-1 text-sm leading-5 font-medium">
        <span className={labelColor}>{label}</span>
        {required && <span className="text-[#EF4444]">*</span>}
      </div>

      <div
        className={`flex h-11 w-full items-center rounded-lg border ${borderColor} bg-[#11111A] px-[14px] py-[10px] ${interactiveRing}`}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          disabled={derivedState === "disabled"}
          readOnly={derivedState === "inactive"}
          placeholder={placeholder}
          className={inputClassName}
        />
      </div>

      <p className={`text-xs leading-4 font-normal ${helperColor}`}>
        {isError ? errorText : helperText}
      </p>
    </div>
  );
}