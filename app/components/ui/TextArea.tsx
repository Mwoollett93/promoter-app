"use client";

import { useMemo, useState } from "react";

type TextAreaState = "default" | "inactive" | "maxLetters";

type PromoSyncTextAreaProps = {
  label?: string;
  required?: boolean;
  maxLength?: number;
  state?: TextAreaState;
  initialValue?: string;
  onChange?: (value: string) => void;
  onStateChange?: (state: TextAreaState) => void;
  className?: string;
};

export default function PromoSyncTextArea({
  label = "Label",
  required = true,
  maxLength = 500,
  state,
  initialValue = "",
  onChange,
  onStateChange,
  className = "",
}: PromoSyncTextAreaProps) {
  const [value, setValue] = useState(initialValue);

  const derivedState: TextAreaState = useMemo(() => {
    if (state) return state;
    return value.length >= maxLength ? "maxLetters" : "default";
  }, [state, value.length, maxLength]);

  const isInactive = derivedState === "inactive";
  const isMaxLetters = derivedState === "maxLetters";

  const labelColor = isInactive ? "text-[#3F3F46]" : "text-[#F5F5F7]";
  const borderColor = isMaxLetters ? "border-[#EF4444]" : "border-[#3F3F46]";

  const counterColor = isMaxLetters
    ? "text-[#EF4444]"
    : isInactive
      ? "text-[#3F3F46]"
      : "text-[#71717A]";

  const interactiveRing =
    !isInactive && !isMaxLetters
      ? "transition-colors hover:border-[#71717A] focus-within:border-[#8B5CF6] focus-within:hover:border-[#8B5CF6]"
      : "";

  const textareaClassName = isInactive
    ? "flex-1 w-full resize-none bg-transparent text-sm leading-5 font-normal outline-none text-[#3F3F46] placeholder:text-[#3F3F46]"
    : "flex-1 w-full resize-none bg-transparent text-sm leading-5 font-normal outline-none text-[#F5F5F7] placeholder:text-[#71717A]";

  function handleChange(next: string) {
    const trimmed = next.slice(0, maxLength);
    setValue(trimmed);
    onChange?.(trimmed);

    const nextState: TextAreaState = trimmed.length >= maxLength ? "maxLetters" : "default";
    onStateChange?.(nextState);
  }

  return (
    <div className={`flex w-full flex-col items-start gap-1.5 bg-transparent ${className}`}>
      <div className="flex items-start gap-1 text-sm leading-5 font-medium">
        <span className={labelColor}>{label}</span>
        {required ? <span className="text-[#EF4444]">*</span> : null}
      </div>

      <div
        className={`flex h-[106px] w-full flex-col gap-1.5 overflow-hidden rounded-lg border ${borderColor} bg-[#11111A] px-3 py-0.5 ${interactiveRing}`}
      >
        <textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isInactive}
          maxLength={maxLength}
          placeholder="Input text here..."
          className={textareaClassName}
        />

        <div className="flex h-[18px] w-full items-end justify-end py-0.5">
          <span className={`text-xs leading-4 font-normal ${counterColor}`}>
            ({value.length}/{maxLength})
          </span>
        </div>
      </div>

      <p className={`min-h-[1rem] text-xs leading-4 font-normal ${counterColor}`}>
        {isMaxLetters ? `${maxLength - value.length} characters remaining` : "\u00A0"}
      </p>
    </div>
  );
}