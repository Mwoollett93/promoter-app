"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import * as React from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Radix RemoveScroll can stick if a dialog unmounts mid-close — clear on teardown. */
function releaseBodyScrollLock() {
  document.body.style.removeProperty("overflow");
  document.body.style.removeProperty("padding-right");
  document.body.style.removeProperty("pointer-events");
  document.body.removeAttribute("data-scroll-locked");
}

type SalesTrackerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Optional footer — form modals pass Cancel/Save buttons here. */
  footer?: ReactNode;
  /** Wider modal for CSV mapping. */
  size?: "md" | "lg";
};

export default function SalesTrackerModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: SalesTrackerModalProps) {
  React.useEffect(() => {
    if (!open) releaseBodyScrollLock();
  }, [open]);

  React.useEffect(() => releaseBodyScrollLock, []);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-[#0B0B10]/80 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:pointer-events-none",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[min(90vh,720px)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col",
            "overflow-hidden rounded-2xl border border-[#232330] bg-[#11111A] shadow-[0px_20px_60px_rgba(0,0,0,0.55)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:pointer-events-none",
            size === "lg" ? "max-w-2xl" : "max-w-lg",
          )}
          onCloseAutoFocus={(event) => {
            // Avoid focus trap fighting navigation when closing via tab links.
            event.preventDefault();
          }}
        >
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[#232330] px-5 py-4">
            <div>
              <DialogPrimitive.Title className="text-[16px] font-semibold text-[#F5F5F7]">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-[12px] leading-5 text-[#A1A1AA]">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close
              className="rounded-lg p-1.5 text-[#71717A] transition-colors hover:bg-[#232330] hover:text-[#F5F5F7]"
              aria-label="Close"
            >
              <X className="size-4" aria-hidden />
            </DialogPrimitive.Close>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

          {footer ? (
            <footer className="flex shrink-0 justify-end gap-2 border-t border-[#232330] px-5 py-3">
              {footer}
            </footer>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
