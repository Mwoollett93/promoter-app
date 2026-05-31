"use client";

import Link from "next/link";
import { Check } from "lucide-react";

import { Section, SectionHeader } from "@/app/components/marketing/marketing-ui";
import MarketingAccordion from "@/app/components/marketing/landing/MarketingAccordion";
import { ScrollReveal, StaggerGroup } from "@/app/components/marketing/landing/ScrollReveal";
import { pricingComparisonRows, pricingPlans } from "@/lib/marketing/content";

export default function PricingSection() {
  return (
    <Section id="pricing">
      <ScrollReveal>
        <SectionHeader
          eyebrow="Pricing"
          title="Start free, scale with your season"
          description="Upgrade to Pro in-app when you need unlimited events, team seats, and AI-assisted roster tools."
        />
      </ScrollReveal>

      <StaggerGroup className="mt-14 grid gap-6 lg:grid-cols-3" stagger={100}>
        {pricingPlans.map((plan) => (
          <div
            key={plan.name}
            className={[
              "flex flex-col rounded-2xl border p-6 transition-transform duration-300 motion-reduce:transition-none",
              plan.highlighted
                ? "border-[#8B5CF6]/50 bg-[#1A1630]/60 shadow-[0_0_40px_rgba(139,92,246,0.15)] hover:-translate-y-1 motion-reduce:hover:translate-y-0"
                : "border-[#232330] bg-[#11111A] hover:border-[#8B5CF6]/25",
            ].join(" ")}
          >
            <p className="text-[12px] uppercase tracking-wide text-[#8B5CF6]">{plan.audience}</p>
            <h3 className="mt-2 text-[22px] font-bold text-[#F5F5F7]">{plan.name}</h3>
            <p className="mt-1 text-[32px] font-bold text-[#F5F5F7]">
              {plan.price}
              {plan.period ? (
                <span className="text-[14px] font-normal text-[#71717A]"> {plan.period}</span>
              ) : null}
            </p>
            <p className="mt-3 text-[14px] text-[#A1A1AA]">{plan.description}</p>
            <ul className="mt-6 flex-1 space-y-2">
              {plan.features.slice(0, 4).map((f) => (
                <li key={f} className="flex gap-2 text-[13px] text-[#E4E4E7]">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#86EFAC]" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={plan.cta === "Book demo" ? "/contact" : "/login?view=signup"}
              className={[
                "mt-6 inline-flex h-11 items-center justify-center rounded-lg text-[14px] font-medium transition-all",
                plan.highlighted
                  ? "border border-[rgba(139,92,246,0.45)] bg-[#7C3AED] text-white hover:shadow-[0_0_24px_rgba(139,92,246,0.35)]"
                  : "border border-[#3F3F46] text-[#E4E4E7] hover:border-[#52525B]",
              ].join(" ")}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </StaggerGroup>

      <ScrollReveal delay={80} className="mt-10">
        <MarketingAccordion
          defaultValue="compare"
          items={[
            {
              value: "compare",
              title: "Compare plan features",
              content: (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-[#232330] text-[#71717A]">
                        <th className="py-2 pr-4 font-medium">Feature</th>
                        <th className="px-3 py-2 font-medium">Free</th>
                        <th className="px-3 py-2 font-medium">Pro</th>
                        <th className="px-3 py-2 font-medium">Collective</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricingComparisonRows.map(([feature, free, pro, collective]) => (
                        <tr key={feature} className="border-b border-[#232330]/60">
                          <td className="py-2.5 pr-4 text-[#E4E4E7]">{feature}</td>
                          <td className="px-3 py-2.5 text-[#A1A1AA]">{free}</td>
                          <td className="px-3 py-2.5 text-[#A1A1AA]">{pro}</td>
                          <td className="px-3 py-2.5 text-[#A1A1AA]">{collective}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ),
            },
          ]}
        />
      </ScrollReveal>

      <ScrollReveal delay={120}>
        <p className="mt-8 text-center">
          <Link
            href="/pricing"
            className="text-[14px] font-medium text-[#C4B5FD] transition-colors hover:text-[#E9D5FF]"
          >
            Compare all plans →
          </Link>
        </p>
      </ScrollReveal>
    </Section>
  );
}
