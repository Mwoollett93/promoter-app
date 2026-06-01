"use client";

import dynamic from "next/dynamic";

import {
  PrimaryCta,
  SecondaryCta,
} from "@/app/components/marketing/marketing-ui";
import { useLandingScroll } from "@/app/components/marketing/landing/LenisProvider";
import { ScrollReveal } from "@/app/components/marketing/landing/ScrollReveal";
import { usePrefersReducedMotion } from "@/app/components/marketing/landing/usePrefersReducedMotion";
import BetaBadge from "@/app/components/beta/BetaBadge";
import { isBetaMode } from "@/lib/beta/config";
import { site } from "@/lib/marketing/content";
import { PAGE_EYEBROW } from "@/lib/ui/page-surfaces";

const ProductShowcase = dynamic(() => import("@/app/components/marketing/DashboardShowcase"));

export default function HeroSection() {
  const { scroll } = useLandingScroll();
  const reducedMotion = usePrefersReducedMotion();

  // Parallax: showcase drifts slower than scroll; disabled when reduced motion is on.
  const parallaxY = reducedMotion ? 0 : Math.min(scroll * 0.08, 48);
  // Gradient orb shifts subtly with scroll for depth without distracting motion.
  const orbOffset = reducedMotion ? 0 : scroll * 0.04;

  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-14 lg:px-8 lg:pb-24 lg:pt-20">
      {/* Floating gradient orbs — CSS float when motion allowed; static otherwise */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ transform: reducedMotion ? undefined : `translateY(${orbOffset}px)` }}
      >
        <div
          className={[
            "absolute -left-24 top-8 size-[420px] rounded-full bg-[#7C3AED]/14 blur-[100px]",
            reducedMotion ? "" : "motion-safe:animate-[hero-float_8s_ease-in-out_infinite]",
          ].join(" ")}
        />
        <div
          className={[
            "absolute -right-16 top-1/3 size-[360px] rounded-full bg-[#4C1D95]/18 blur-[90px]",
            reducedMotion ? "" : "motion-safe:animate-[hero-float_10s_ease-in-out_infinite_reverse]",
          ].join(" ")}
        />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <ScrollReveal>
          {isBetaMode() ? (
            <div className="mb-3">
              <BetaBadge label="Private beta" className="text-[11px]" />
            </div>
          ) : null}
          <p className={PAGE_EYEBROW}>{site.audience}</p>
          <h1 className="mt-4 text-[40px] font-bold leading-[1.05] tracking-tight text-[#F5F5F7] sm:text-[52px] lg:text-[56px]">
            {site.tagline}
          </h1>
          <p className="mt-5 max-w-lg text-[17px] leading-7 text-[#A1A1AA]">{site.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryCta href="/login?view=signup">Start free</PrimaryCta>
            <SecondaryCta href="/contact">Book demo</SecondaryCta>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={120}>
          <div
            className="will-change-transform motion-reduce:transform-none"
            style={{ transform: `translateY(${parallaxY}px)` }}
          >
            <ProductShowcase variant="hero" />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
