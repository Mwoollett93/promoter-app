import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import BetaPaymentsNotice from "@/app/components/beta/BetaPaymentsNotice";
import { PrimaryCta, Section, SectionHeader } from "@/app/components/marketing/marketing-ui";
import { isBetaMode } from "@/lib/beta/config";
import { pricingComparisonRows, pricingPlans } from "@/lib/marketing/content";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "PromoSync pricing: Free for small promoters, Pro with in-app Stripe billing, Collective for multi-user orgs.",
};

export default function PricingPage() {
  return (
    <>
      <Section className="pt-16 lg:pt-24">
        <SectionHeader
          eyebrow="Pricing"
          title="Plans that grow with your scene"
          description="Start on Free, then upgrade to Pro in Settings when you need unlimited events, team seats, and AI-assisted tools. Collective plans are custom."
        />
        {isBetaMode() ? (
          <div className="mt-8 max-w-2xl">
            <BetaPaymentsNotice />
          </div>
        ) : null}
        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={[
                "relative flex flex-col rounded-2xl border p-8",
                plan.highlighted
                  ? "border-[#8B5CF6] bg-[#1A1630]/50 ring-1 ring-[#8B5CF6]/40"
                  : "border-[#232330] bg-[#11111A]",
              ].join(" ")}
            >
              {plan.highlighted ? (
                <span className="absolute -top-3 left-6 rounded-full bg-[#7C3AED] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                  Popular
                </span>
              ) : null}
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8B5CF6]">
                {plan.audience}
              </p>
              <h2 className="mt-2 text-[26px] font-bold text-[#F5F5F7]">{plan.name}</h2>
              <p className="mt-2 text-[36px] font-bold text-[#F5F5F7]">
                {plan.price}
                {plan.period ? (
                  <span className="text-[15px] font-normal text-[#71717A]">{plan.period}</span>
                ) : null}
              </p>
              <p className="mt-4 text-[14px] leading-6 text-[#A1A1AA]">{plan.description}</p>
              <ul className="mt-8 flex-1 space-y-3 border-t border-[#232330] pt-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-[14px] text-[#E4E4E7]">
                    <Check className="size-4 shrink-0 text-[#86EFAC]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.cta === "Book demo" ? "/contact" : "/login?view=signup"}
                className={[
                  "mt-8 inline-flex h-12 items-center justify-center rounded-lg text-[15px] font-medium transition-all",
                  plan.highlighted
                    ? "bg-[#7C3AED] text-white hover:shadow-[0_0_28px_rgba(139,92,246,0.4)]"
                    : "border border-[#3F3F46] bg-[#0B0B10] text-[#E4E4E7] hover:border-[#52525B]",
                ].join(" ")}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </Section>

      <Section className="pb-28">
        <div className="overflow-x-auto rounded-2xl border border-[#232330]">
          <table className="w-full min-w-[520px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-[#232330] bg-[#11111A] text-[#71717A]">
                <th className="px-5 py-4 font-semibold uppercase tracking-wide">Included</th>
                <th className="px-5 py-4">Free</th>
                <th className="px-5 py-4">Pro</th>
                <th className="px-5 py-4">Collective</th>
              </tr>
            </thead>
            <tbody className="text-[#E4E4E7]">
              {pricingComparisonRows.map(([label, free, pro, collective]) => (
                <tr key={label} className="border-b border-[#232330]/80">
                  <td className="px-5 py-3 text-[#A1A1AA]">{label}</td>
                  <td className="px-5 py-3">{free}</td>
                  <td className="px-5 py-3">{pro}</td>
                  <td className="px-5 py-3">{collective}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-10 text-center text-[14px] text-[#71717A]">
          Questions about volume or venue groups?{" "}
          <Link href="/contact" className="text-[#C4B5FD] hover:text-[#E9D5FF]">
            Talk to us
          </Link>
        </p>
        <div className="mt-8 flex justify-center">
          <PrimaryCta href="/login?view=signup">Start free</PrimaryCta>
        </div>
      </Section>
    </>
  );
}
