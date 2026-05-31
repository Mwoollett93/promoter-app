"use client";

import { LayoutDashboard } from "lucide-react";

import {
  PrimaryCta,
  SecondaryCta,
  Section,
} from "@/app/components/marketing/marketing-ui";
import { ScrollReveal } from "@/app/components/marketing/landing/ScrollReveal";
import { useLandingScroll } from "@/app/components/marketing/landing/LenisProvider";
import { usePrefersReducedMotion } from "@/app/components/marketing/landing/usePrefersReducedMotion";

export default function FinalCtaSection() {
  const { scroll } = useLandingScroll();
  const reducedMotion = usePrefersReducedMotion();
  const glowShift = reducedMotion ? 0 : Math.min(scroll * 0.02, 24);

  return (
    <Section className="pb-28">
      <ScrollReveal>
        <div className="relative overflow-hidden rounded-3xl border border-[#8B5CF6]/30 bg-gradient-to-br from-[#1A1630] via-[#11111A] to-[#0B0B10] px-8 py-16 text-center sm:px-12">
          {/* Radial glow shifts with scroll for subtle depth on the closing CTA */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.25),transparent_60%)]"
            style={{ transform: reducedMotion ? undefined : `translateY(${glowShift}px)` }}
          />
          <div className="relative">
            <LayoutDashboard className="mx-auto size-10 text-[#8B5CF6]" aria-hidden />
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
      </ScrollReveal>
    </Section>
  );
}
