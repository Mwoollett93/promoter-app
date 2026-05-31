"use client";

import * as React from "react";
import { ChevronDown, Mail, Plug } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

/** Small muted menu for future API / email integrations — not main-page cards. */
export default function IntegrationsMenu() {
  const [open, setOpen] = React.useState(false);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-2.5",
            "text-[11px] font-medium text-[#71717A] transition-colors hover:border-[#52525B] hover:text-[#A1A1AA]",
          )}
        >
          Integrations
          <ChevronDown className="size-3.5" aria-hidden />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={6}
          className={cn(
            "z-50 w-64 rounded-lg border border-[#232330] bg-[#11111A] p-3 shadow-[0px_10px_40px_rgba(0,0,0,0.45)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#71717A]">
            Coming soon
          </p>
          <ul className="mt-2 space-y-2">
            <li className="flex gap-2 text-[11px] text-[#A1A1AA]">
              <Plug className="mt-0.5 size-3.5 shrink-0 text-[#52525B]" aria-hidden />
              <span>
                <span className="font-medium text-[#E4E4E7]">Live API</span> — official ticketing
                APIs when available. RA has no public sales API.
              </span>
            </li>
            <li className="flex gap-2 text-[11px] text-[#A1A1AA]">
              <Mail className="mt-0.5 size-3.5 shrink-0 text-[#52525B]" aria-hidden />
              <span>
                <span className="font-medium text-[#E4E4E7]">Email reports</span> — forward
                scheduled sales exports into checkpoints.
              </span>
            </li>
          </ul>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
