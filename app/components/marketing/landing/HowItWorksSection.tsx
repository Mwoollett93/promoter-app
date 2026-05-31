"use client";

import dynamic from "next/dynamic";

import { Section, SectionHeader } from "@/app/components/marketing/marketing-ui";
import { ScrollReveal, StaggerGroup } from "@/app/components/marketing/landing/ScrollReveal";
import { howItWorks } from "@/lib/marketing/content";

const WizardShowcase = dynamic(() => import("@/app/components/marketing/WizardShowcase"));

export default function HowItWorksSection() {
  return (
    <Section className="bg-[#08080C]/60">
      <ScrollReveal>
        <SectionHeader
          eyebrow="How it works"
          title="Three steps to operational clarity"
          description="Stop rebuilding the same spreadsheet every show week."
        />
      </ScrollReveal>

      <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-3" stagger={100}>
        {howItWorks.map((item) => (
          <div
            key={item.step}
            className="rounded-2xl border border-[#232330] bg-[#11111A] p-6 transition-colors hover:border-[#8B5CF6]/30"
          >
            <span className="text-[32px] font-bold text-[#7C3AED]/50">{item.step}</span>
            <h3 className="mt-4 text-[20px] font-semibold text-[#F5F5F7]">{item.title}</h3>
            <p className="mt-2 text-[14px] leading-6 text-[#A1A1AA]">{item.description}</p>
          </div>
        ))}
      </StaggerGroup>

      <ScrollReveal delay={120} className="mt-12">
        <WizardShowcase />
      </ScrollReveal>
    </Section>
  );
}
