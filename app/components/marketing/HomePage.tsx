import Link from "next/link";
import { ArrowRight, Check, LayoutDashboard, Users } from "lucide-react";

import ProductShowcase from "@/app/components/marketing/ProductShowcase";
import WizardShowcase from "@/app/components/marketing/WizardShowcase";
import {
  FeatureCard,
  PrimaryCta,
  SecondaryCta,
  Section,
  SectionHeader,
} from "@/app/components/marketing/marketing-ui";
import {
  coreFeatures,
  howItWorks,
  painPoints,
  pricingPlans,
  sceneTags,
  site,
  testimonials,
} from "@/lib/marketing/content";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-16 pt-14 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8B5CF6]">
              {site.audience}
            </p>
            <h1 className="mt-4 text-[40px] font-bold leading-[1.05] tracking-tight text-[#F5F5F7] sm:text-[52px] lg:text-[56px]">
              {site.tagline}
            </h1>
            <p className="mt-5 max-w-lg text-[17px] leading-7 text-[#A1A1AA]">{site.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryCta href="/login?view=signup">Start free</PrimaryCta>
              <SecondaryCta href="/contact">Book demo</SecondaryCta>
            </div>
          </div>
          <ProductShowcase variant="hero" />
        </div>
      </section>

      {/* Trusted by / scene */}
      <Section className="py-12 lg:py-16">
        <p className="text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-[#71717A]">
          Built for promoters, collectives &amp; venues
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {sceneTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#3F3F46] bg-[#11111A] px-4 py-2 text-[13px] font-medium text-[#A1A1AA]"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {["Warehouse 030", "Sub Club", "Forum Hall", "Rooftop Series"].map((poster) => (
            <div
              key={poster}
              className="flex aspect-[3/4] items-end rounded-xl border border-[#232330] bg-gradient-to-br from-[#1A1630] to-[#0B0B10] p-4"
            >
              <span className="text-[13px] font-semibold text-[#E4E4E7]">{poster}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Core features */}
      <Section id="features">
        <SectionHeader
          eyebrow="Core features"
          title="Everything your night runs on"
          description="From the first venue call to break-even — one brutalist mission control, not another corporate CRM."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {coreFeatures.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section className="bg-[#08080C]/60">
        <SectionHeader
          eyebrow="How it works"
          title="Three steps to operational clarity"
          description="Stop rebuilding the same spreadsheet every show week."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {howItWorks.map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-[#232330] bg-[#11111A] p-6"
            >
              <span className="text-[32px] font-bold text-[#7C3AED]/50">{item.step}</span>
              <h3 className="mt-4 text-[20px] font-semibold text-[#F5F5F7]">{item.title}</h3>
              <p className="mt-2 text-[14px] leading-6 text-[#A1A1AA]">{item.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-12">
          <WizardShowcase />
        </div>
      </Section>

      {/* Problem / solution */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeader
              align="left"
              eyebrow="The problem"
              title="Running events shouldn't feel like firefighting"
            />
            <ul className="mt-8 space-y-4">
              {painPoints.map((point) => (
                <li key={point} className="flex gap-3 text-[15px] text-[#A1A1AA]">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#EF4444]" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-[#8B5CF6]/30 bg-gradient-to-br from-[#1A1630]/80 to-[#11111A] p-8">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8B5CF6]">
              The solution
            </p>
            <p className="mt-4 text-[24px] font-bold leading-snug text-[#F5F5F7] sm:text-[28px]">
              PromoSync centralizes your event operations.
            </p>
            <p className="mt-4 text-[15px] leading-7 text-[#A1A1AA]">
              One dark, fast workspace for creation, lineup, finance, artists, and venues — built
              for the underground, not the boardroom.
            </p>
            <Link
              href="/features"
              className="mt-6 inline-flex items-center gap-2 text-[14px] font-medium text-[#C4B5FD] hover:text-[#E9D5FF]"
            >
              Explore features
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </Section>

      {/* Dashboard showcase */}
      <Section className="overflow-hidden">
        <SectionHeader
          eyebrow="Dashboard"
          title="Mission control for your season"
          description="Cinematic panels, live stats, and financial pulse — the same UI you use on show day."
        />
        <div className="relative mt-14">
          <div className="pointer-events-none absolute -inset-x-20 top-1/2 h-64 -translate-y-1/2 bg-[#7C3AED]/20 blur-[100px]" />
          <ProductShowcase variant="hero" />
        </div>
      </Section>

      {/* Finance showcase */}
      <Section className="bg-[#08080C]/60">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeader
              align="left"
              eyebrow="Finance & forecast"
              title="Know your margin before doors open"
              description="Ticket tiers, artist fees, venue hire, and break-even — modeled in the wizard, visible on the dashboard."
            />
            <ul className="mt-8 space-y-3">
              {["Projected profit & break-even", "Per-tier sell-through assumptions", "Cost rollups from lineup slots"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2 text-[14px] text-[#E4E4E7]">
                    <Check className="size-4 text-[#86EFAC]" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
          <div className="rounded-2xl border border-[#232330] bg-[#11111A] p-6">
            <p className="text-[11px] uppercase tracking-wide text-[#71717A]">Event P&amp;L preview</p>
            <div className="mt-4 space-y-3">
              {[
                { label: "Ticket revenue", value: "£18,400", positive: true },
                { label: "Artist fees", value: "−£6,200", positive: false },
                { label: "Venue & ops", value: "−£4,100", positive: false },
                { label: "Projected profit", value: "£4,280", positive: true, bold: true },
              ].map((row) => (
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
            </div>
          </div>
        </div>
      </Section>

      {/* Collaboration */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl border border-[#232330] bg-[#11111A] p-6">
              <div className="flex items-center gap-3">
                <Users className="size-5 text-[#8B5CF6]" />
                <p className="text-[14px] font-semibold text-[#F5F5F7]">Team workspace</p>
              </div>
              <ul className="mt-4 space-y-3">
                {["Assign pre-show tasks", "Lineup change notifications", "Role-based access (soon)"].map(
                  (task) => (
                    <li
                      key={task}
                      className="flex items-center justify-between rounded-lg border border-[#232330] bg-[#0B0B10] px-4 py-3 text-[13px] text-[#E4E4E7]"
                    >
                      {task}
                      <span className="text-[11px] text-[#71717A]">Soon</span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <SectionHeader
              align="left"
              eyebrow="Collaboration"
              title="Your collective on one timeline"
              description="Task boards and permissions are on the roadmap — built for crews who split the work."
            />
          </div>
        </div>
      </Section>

      {/* Testimonials */}
      <Section className="bg-[#08080C]/60">
        <SectionHeader eyebrow="Early feedback" title="Used by local promoters in Melbourne" />
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {testimonials.map((t) => (
            <blockquote
              key={t.author}
              className="rounded-2xl border border-[#232330] bg-[#11111A] p-8"
            >
              <p className="text-[17px] leading-7 text-[#E4E4E7]">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-6">
                <p className="text-[14px] font-semibold text-[#F5F5F7]">{t.author}</p>
                <p className="text-[13px] text-[#71717A]">{t.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </Section>

      {/* Pricing preview */}
      <Section id="pricing">
        <SectionHeader
          eyebrow="Pricing"
          title="Start free, scale with your season"
          description="Placeholder tiers — billing integration coming later."
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={[
                "flex flex-col rounded-2xl border p-6",
                plan.highlighted
                  ? "border-[#8B5CF6]/50 bg-[#1A1630]/60 shadow-[0_0_40px_rgba(139,92,246,0.15)]"
                  : "border-[#232330] bg-[#11111A]",
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
                    <Check className="mt-0.5 size-4 shrink-0 text-[#86EFAC]" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.cta === "Book demo" ? "/contact" : "/login?view=signup"}
                className={[
                  "mt-6 inline-flex h-11 items-center justify-center rounded-lg text-[14px] font-medium",
                  plan.highlighted
                    ? "bg-[#7C3AED] text-white hover:shadow-[0_0_24px_rgba(139,92,246,0.35)]"
                    : "border border-[#3F3F46] text-[#E4E4E7] hover:border-[#52525B]",
                ].join(" ")}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center">
          <Link href="/pricing" className="text-[14px] font-medium text-[#C4B5FD] hover:text-[#E9D5FF]">
            Compare all plans →
          </Link>
        </p>
      </Section>

      {/* Final CTA */}
      <Section className="pb-28">
        <div className="relative overflow-hidden rounded-3xl border border-[#8B5CF6]/30 bg-gradient-to-br from-[#1A1630] via-[#11111A] to-[#0B0B10] px-8 py-16 text-center sm:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.25),transparent_60%)]" />
          <div className="relative">
            <LayoutDashboard className="mx-auto size-10 text-[#8B5CF6]" />
            <h2 className="mt-6 text-[32px] font-bold tracking-tight text-[#F5F5F7] sm:text-[40px]">
              Stop running events through spreadsheets
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[16px] text-[#A1A1AA]">
              Create your account or join the waitlist — we&apos;re onboarding promoters and
              collectives now.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <PrimaryCta href="/login?view=signup">Create account</PrimaryCta>
              <SecondaryCta href="/contact">Join waitlist</SecondaryCta>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
