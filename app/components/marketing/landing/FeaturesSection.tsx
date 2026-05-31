"use client";

import {
  FeatureCard,
  Section,
  SectionHeader,
} from "@/app/components/marketing/marketing-ui";
import { ScrollReveal, StaggerGroup } from "@/app/components/marketing/landing/ScrollReveal";
import { coreFeatures } from "@/lib/marketing/content";

export default function FeaturesSection() {
  return (
    <Section id="features">
      <ScrollReveal>
        <SectionHeader
          eyebrow="Core features"
          title="Everything your night runs on"
          description="From the first venue call to break-even — one brutalist mission control, not another corporate CRM."
        />
      </ScrollReveal>

      <StaggerGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={90}>
        {coreFeatures.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </StaggerGroup>
    </Section>
  );
}
