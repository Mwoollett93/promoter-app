import type { Metadata } from "next";
import Link from "next/link";

import { PrimaryCta, Section, SectionHeader } from "@/app/components/marketing/marketing-ui";
import { site } from "@/lib/marketing/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Built by promoters for promoters — PromoSync exists because underground events deserve better ops than spreadsheets.",
};

export default function AboutPage() {
  return (
    <>
      <Section className="pt-16 lg:pt-24">
        <div className="max-w-3xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8B5CF6]">
            Our story
          </p>
          <h1 className="mt-4 text-[40px] font-bold leading-tight tracking-tight text-[#F5F5F7] sm:text-[48px]">
            Built by promoters, for promoters
          </h1>
          <p className="mt-6 text-[18px] leading-8 text-[#A1A1AA]">
            {site.name} started in the underground — warehouse nights, club residencies, and
            collectives juggling DMs, PDFs, and broken spreadsheets the week of the show.
          </p>
        </div>
      </Section>

      <Section className="bg-[#08080C]/60">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-[26px] font-bold text-[#F5F5F7]">Why we built it</h2>
            <p className="mt-4 text-[16px] leading-7 text-[#A1A1AA]">
              Corporate CRMs don&apos;t understand B2B slots, venue hire deposits, or break-even on
              a 400-cap room. We wanted mission control that feels like the scene — dark, fast, and
              honest about the numbers.
            </p>
            <p className="mt-4 text-[16px] leading-7 text-[#A1A1AA]">
              Melbourne&apos;s independent promoters helped shape the product: a real dashboard,
              Run overview, Sales Tracker per event, finance forecasting, AI-assisted artist CRM,
              kanban tasks, and team workspaces that match how nights get booked.
            </p>
          </div>
          <div className="rounded-2xl border border-[#232330] bg-[#11111A] p-8">
            <h3 className="text-[14px] font-semibold uppercase tracking-wide text-[#8B5CF6]">
              What we believe
            </h3>
            <ul className="mt-6 space-y-4 text-[15px] text-[#E4E4E7]">
              <li>Underground culture deserves professional ops without losing its edge.</li>
              <li>Forecasting should happen before you announce the headliner.</li>
              <li>Your roster and venues are assets — not rows in someone else&apos;s SaaS.</li>
              <li>Software should feel like Resident Advisor × Linear × your DAW — not Monday.com.</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeader
          title="For the people who make the night"
          description="Promoters, collectives, venue bookers, and artist managers who need one source of truth."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Independent promoters",
              body: "Solo or small crew — run multiple concepts without rebuilding budgets each time.",
            },
            {
              title: "Collectives",
              body: "Shared roster, shared costs, and a live workspace with tasks, comments, and roles.",
            },
            {
              title: "Venues & rooms",
              body: "Track hire terms, capacities, and repeat bookings alongside your calendar.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-[#232330] bg-[#11111A] p-6"
            >
              <h3 className="text-[18px] font-semibold text-[#F5F5F7]">{card.title}</h3>
              <p className="mt-3 text-[14px] leading-6 text-[#A1A1AA]">{card.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="pb-28">
        <div className="text-center">
          <p className="text-[20px] font-medium text-[#E4E4E7]">
            &ldquo;{site.tagline}&rdquo;
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <PrimaryCta href="/login?view=signup">Join PromoSync</PrimaryCta>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-[#3F3F46] px-7 text-[15px] font-medium text-[#E4E4E7] hover:border-[#52525B]"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
