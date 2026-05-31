"use client";

import dynamic from "next/dynamic";

import { Section, SectionHeader } from "@/app/components/marketing/marketing-ui";
import { ScrollReveal } from "@/app/components/marketing/landing/ScrollReveal";

const ProductShowcase = dynamic(() => import("@/app/components/marketing/ProductShowcase"));

export default function DashboardSection() {
  return (
    <Section className="overflow-hidden">
      <ScrollReveal>
        <SectionHeader
          eyebrow="Dashboard"
          title="Mission control for your season"
          description="Cinematic panels, live stats, and financial pulse — the same UI you use on show day."
        />
      </ScrollReveal>

      <ScrollReveal delay={120} className="relative mt-14">
        <div className="pointer-events-none absolute -inset-x-20 top-1/2 h-64 -translate-y-1/2 bg-[#7C3AED]/20 blur-[100px]" />
        <ProductShowcase variant="hero" />
      </ScrollReveal>
    </Section>
  );
}
