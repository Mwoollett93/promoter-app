"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";

type AuthFieldProps = {
  label: string;
  type?: "text" | "email" | "password";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
  required?: boolean;
  autoComplete?: string;
};

export default function AuthField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  required = true,
  autoComplete,
}: AuthFieldProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[14px] font-medium leading-5 text-[#F5F5F7]">
        {label}
        {required ? <span className="text-[#EF4444]"> *</span> : null}
      </span>
      <div className="flex h-11 w-full items-center gap-2 rounded-lg border border-[#3F3F46] bg-[#11111A] px-3.5 transition-colors hover:border-[#71717A] focus-within:border-[#8B5CF6]">
        {Icon ? <Icon className="size-4 shrink-0 text-[#71717A]" strokeWidth={2} aria-hidden /> : null}
        <input
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent text-[14px] leading-5 text-[#F5F5F7] outline-none placeholder:text-[#71717A]"
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="shrink-0 text-[#71717A] transition-colors hover:text-[#F5F5F7]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" strokeWidth={2} aria-hidden />
            ) : (
              <Eye className="size-4" strokeWidth={2} aria-hidden />
            )}
          </button>
        ) : null}
      </div>
    </label>
  );
}
