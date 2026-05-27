"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import Button from "@/app/components/ui/Button";

export default function DashboardWorkflowBanner() {
  return (
    <section className="rounded-xl border border-[#8B5CF6]/30 bg-gradient-to-r from-[#1A1630]/90 to-[#11111A] px-5 py-4 shadow-[0px_8px_24px_rgba(0,0,0,0.35)] sm:flex sm:items-center sm:justify-between sm:gap-6">
      <div className="flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#7C3AED]/20 text-[#C4B5FD]">
          <Sparkles className="size-5" strokeWidth={2} aria-hidden />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-[#F5F5F7]">Streamline your workflow</h2>
          <p className="mt-0.5 text-[13px] text-[#A1A1AA]">
            Use templates and season planning to save time on repetitive show-week tasks.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
        <Link href="/team?tab=templates">
          <Button type="button" variant="secondary" size="sm">
            Browse templates
          </Button>
        </Link>
        <Link href="/season">
          <Button type="button" variant="primary" size="sm">
            Season planning
          </Button>
        </Link>
      </div>
    </section>
  );
}
