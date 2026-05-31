"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Section, SectionHeader } from "@/app/components/marketing/marketing-ui";
import { ScrollReveal } from "@/app/components/marketing/landing/ScrollReveal";

const SalesTrackerShowcase = dynamic(() => import("@/app/components/marketing/SalesTrackerShowcase"));

const bullets = [
  "Manual checkpoints and CSV import from ticketing platforms",
  "Break-even progress, capacity %, and forecast attendance KPIs",
  "Smooth sales charts and checkpoint history per event",
] as const;

export default function SalesTrackerSection() {
  return (
    <Section>
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <ScrollReveal delay={100} className="order-2 lg:order-1">
          <SalesTrackerShowcase />
        </ScrollReveal>

        <ScrollReveal className="order-1 lg:order-2">
          <SectionHeader
            align="left"
            eyebrow="Sales tracker"
            title="Ticket sales monitoring per event"
            description="Inside each event workspace, the Sales Tracker tab is a fixed cockpit — add checkpoints or import CSV reports without pushing your dashboard off screen."
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
            href="/features#sales"
            className="mt-6 inline-flex items-center gap-2 text-[14px] font-medium text-[#C4B5FD] transition-colors hover:text-[#E9D5FF]"
          >
            See sales tracker
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </ScrollReveal>
      </div>
    </Section>
  );
}
