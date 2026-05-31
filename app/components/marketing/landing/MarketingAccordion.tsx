"use client";

import { ChevronDown } from "lucide-react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AccordionItem = {
  value: string;
  title: string;
  content: ReactNode;
};

type MarketingAccordionProps = {
  items: AccordionItem[];
  defaultValue?: string;
};

/** Radix accordion using SECTION_CARD / border tokens from the app style guide. */
export default function MarketingAccordion({ items, defaultValue }: MarketingAccordionProps) {
  return (
    <AccordionPrimitive.Root
      type="single"
      collapsible
      defaultValue={defaultValue}
      className="space-y-2"
    >
      {items.map((item) => (
        <AccordionPrimitive.Item
          key={item.value}
          value={item.value}
          className="overflow-hidden rounded-2xl border border-[#232330] bg-[#11111A]"
        >
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger
              className={cn(
                "group flex w-full items-center justify-between px-5 py-4 text-left",
                "text-[15px] font-semibold text-[#F5F5F7] transition-colors hover:text-[#C4B5FD]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50",
              )}
            >
              {item.title}
              <ChevronDown
                className="size-4 shrink-0 text-[#71717A] transition-transform duration-300 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                aria-hidden
              />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="overflow-hidden px-5 pb-4 text-[14px] leading-6 text-[#A1A1AA]">
            {item.content}
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}
