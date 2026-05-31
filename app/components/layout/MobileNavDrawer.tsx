"use client";

import { Dialog as DialogPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import Sidebar from "./Sidebar";

type MobileNavDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function MobileNavDrawer({ open, onOpenChange }: MobileNavDrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-40 bg-[#0B0B10]/80 backdrop-blur-sm md:hidden",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "motion-reduce:animate-none",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[min(280px,85vw)] overflow-hidden md:hidden",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
            "motion-reduce:animate-none",
          )}
        >
          <DialogPrimitive.Title className="sr-only">App navigation</DialogPrimitive.Title>
          <Sidebar
            variant="drawer"
            isOpen
            onToggle={() => {}}
            onNavClick={() => onOpenChange(false)}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
