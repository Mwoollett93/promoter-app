"use client";

import { Tooltip as TooltipPrimitive } from "radix-ui";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type MarketingTooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
};

/** Radix tooltip styled with existing marketing surface tokens. */
export default function MarketingTooltip({
  content,
  children,
  side = "top",
}: MarketingTooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={280}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            className={cn(
              "z-50 max-w-[240px] rounded-lg border border-[#232330] bg-[#11111A] px-3 py-2",
              "text-[12px] leading-5 text-[#E4E4E7] shadow-[0px_10px_40px_0px_rgba(0,0,0,0.35)]",
              "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
              "data-[state=closed]:zoom-out-95 motion-reduce:animate-none",
            )}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-[#11111A]" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
