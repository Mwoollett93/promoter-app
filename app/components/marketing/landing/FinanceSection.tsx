"use client";

import { Check } from "lucide-react";

import { Section, SectionHeader } from "@/app/components/marketing/marketing-ui";
import { ScrollReveal, StaggerGroup } from "@/app/components/marketing/landing/ScrollReveal";

const financeBullets = [
  "Projected profit & break-even",
  "Per-tier sell-through assumptions",
  "Cost rollups from lineup slots",
] as const;

const financeRows: Array<{
  label: string;
  value: string;
  positive: boolean;
  bold?: boolean;
}> = [
  { label: "Ticket revenue", value: "£18,400", positive: true },
  { label: "Artist fees", value: "−£6,200", positive: false },
  { label: "Venue & ops", value: "−£4,100", positive: false },
  { label: "Projected profit", value: "£4,280", positive: true, bold: true },
] ;

export default function FinanceSection() {
  return (
    <Section className="bg-[#08080C]/60">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <ScrollReveal>
          <SectionHeader
            align="left"
            eyebrow="Finance & forecast"
            title="Know your margin before doors open"
            description="Ticket tiers, artist fees, venue hire, and break-even — modeled in the wizard, visible on the dashboard."
          />
          <ul className="mt-8 space-y-3">
            {financeBullets.map((item) => (
              <li key={item} className="flex items-center gap-2 text-[14px] text-[#E4E4E7]">
                <Check className="size-4 text-[#86EFAC]" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="rounded-2xl border border-[#232330] bg-[#11111A] p-6">
            <p className="text-[11px] uppercase tracking-wide text-[#71717A]">Event P&amp;L preview</p>
            <StaggerGroup className="mt-4 flex flex-col gap-3" stagger={70}>
              {financeRows.map((row) => (
                <div
                  key={row.label}
                  className={[
                    "flex justify-between rounded-lg px-3 py-2 text-[14px]",
                    row.bold ? "border border-[#8B5CF6]/40 bg-[#1A1630]" : "bg-[#0B0B10]",
                  ].join(" ")}
                >
                  <span className="text-[#A1A1AA]">{row.label}</span>
                  <span className={row.positive ? "font-semibold text-[#86EFAC]" : "text-[#FCA5A5]"}>
                    {row.value}
                  </span>
                </div>
              ))}
            </StaggerGroup>
          </div>
        </ScrollReveal>
      </div>
    </Section>
  );
}
