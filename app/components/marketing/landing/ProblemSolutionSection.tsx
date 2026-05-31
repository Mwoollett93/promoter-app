"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Section, SectionHeader } from "@/app/components/marketing/marketing-ui";
import { ScrollReveal } from "@/app/components/marketing/landing/ScrollReveal";
import { painPoints } from "@/lib/marketing/content";

export default function ProblemSolutionSection() {
  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <ScrollReveal>
          <SectionHeader
            align="left"
            eyebrow="The problem"
            title="Running events shouldn't feel like firefighting"
          />
          <ul className="mt-8 space-y-4">
            {painPoints.map((point, index) => (
              <li
                key={point}
                className="flex gap-3 text-[15px] text-[#A1A1AA]"
                style={{ transitionDelay: `${index * 60}ms` }}
              >
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#EF4444]" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="rounded-2xl border border-[#8B5CF6]/30 bg-gradient-to-br from-[#1A1630]/80 to-[#11111A] p-8">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8B5CF6]">
              The solution
            </p>
            <p className="mt-4 text-[24px] font-bold leading-snug text-[#F5F5F7] sm:text-[28px]">
              PromoSync centralizes your event operations.
            </p>
            <p className="mt-4 text-[15px] leading-7 text-[#A1A1AA]">
              One dark, fast workspace for creation, lineup, finance, artists, venues, and
              operational tasks — built for the underground, not the boardroom.
            </p>
            <Link
              href="/features"
              className="mt-6 inline-flex items-center gap-2 text-[14px] font-medium text-[#C4B5FD] transition-colors hover:text-[#E9D5FF]"
            >
              Explore features
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </Section>
  );
}
