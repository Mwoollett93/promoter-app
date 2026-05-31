"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Section, SectionHeader } from "@/app/components/marketing/marketing-ui";
import { ScrollReveal } from "@/app/components/marketing/landing/ScrollReveal";

const RunShowcase = dynamic(() => import("@/app/components/marketing/RunShowcase"));

const bullets = [
  "Portfolio KPIs: shows, projected P/L, attendance, revenue",
  "Shows grouped by month inside your selected timeframe",
  "Monthly P/L and operational risks in scrollable side panels",
] as const;

export default function RunSection() {
  return (
    <Section className="bg-[#08080C]/50">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <ScrollReveal>
          <SectionHeader
            align="left"
            eyebrow="Run overview"
            title="Your season on one screen"
            description="The Run page mirrors your real workspace — timeframe selector, summary strip, upcoming shows, and risk panels without page-level scrolling."
          />
          <ul className="mt-8 space-y-3">
            {bullets.map((item) => (
              <li key={item} className="flex items-center gap-2 text-[14px] text-[#E4E4E7]">
                <Check className="size-4 shrink-0 text-[#86EFAC]" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/features#run"
            className="mt-6 inline-flex items-center gap-2 text-[14px] font-medium text-[#C4B5FD] transition-colors hover:text-[#E9D5FF]"
          >
            See run overview
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <RunShowcase />
        </ScrollReveal>
      </div>
    </Section>
  );
}
