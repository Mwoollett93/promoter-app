"use client";

import * as React from "react";

type ComingSoonButtonProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  size?: "sm" | "md";
};

const sizeClasses = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-4 text-sm",
};

export default function ComingSoonButton({
  children,
  className = "",
  title = "Coming soon",
  size = "md",
}: ComingSoonButtonProps) {
  return (
    <button
      type="button"
      disabled
      title={title}
      aria-disabled="true"
      className={[
        "inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-[#232330] bg-[#11111A] font-medium text-[#71717A] opacity-70",
        sizeClasses[size],
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
