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
          description="From the first venue call to break-even — one brutalist mission control built from the screens you already use in PromoSync."
        />
      </ScrollReveal>

          <StaggerGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={90}>
        {coreFeatures.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </StaggerGroup>
    </Section>
  );
}
