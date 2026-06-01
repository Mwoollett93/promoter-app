"use client";

import Link from "next/link";
import { MessageSquarePlus } from "lucide-react";

import { cn } from "@/lib/utils";

type BetaFeedbackFabProps = {
  className?: string;
};

export default function BetaFeedbackFab({ className }: BetaFeedbackFabProps) {
  return (
    <Link
      href="/feedback"
      className={cn(
        "fixed z-30 inline-flex h-11 items-center gap-2 rounded-full border border-[#8B5CF6]/50 bg-[#11111A] px-4 text-[13px] font-medium text-[#F5F5F7] shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-colors hover:border-[#8B5CF6] hover:bg-[#1A1630]",
        "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 md:bottom-6 md:right-6",
        className,
      )}
    >
      <MessageSquarePlus className="size-4 shrink-0 text-[#8B5CF6]" strokeWidth={2} aria-hidden />
      Give feedback
    </Link>
  );
}
