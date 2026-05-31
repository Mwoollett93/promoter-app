"use client";

import "swiper/css";

import * as React from "react";
import { Autoplay, FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { Section } from "@/app/components/marketing/marketing-ui";
import MarketingTooltip from "@/app/components/marketing/landing/MarketingTooltip";
import { ScrollReveal } from "@/app/components/marketing/landing/ScrollReveal";
import { usePrefersReducedMotion } from "@/app/components/marketing/landing/usePrefersReducedMotion";
import { sceneTags } from "@/lib/marketing/content";

const scenePosters = ["Warehouse 030", "Sub Club", "Forum Hall", "Rooftop Series"] as const;

export default function SceneSection() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <Section className="py-12 lg:py-16">
      <ScrollReveal>
        <p className="text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-[#71717A]">
          Built for promoters, collectives &amp; venues
        </p>
      </ScrollReveal>

      {/* Tag pills — horizontal Swiper on mobile, wrap on desktop */}
      <ScrollReveal delay={80} className="mt-8">
        <div className="hidden flex-wrap justify-center gap-2 md:flex">
          {sceneTags.map((tag) => (
            <MarketingTooltip key={tag} content={`Events in the ${tag} space`}>
              <span
                tabIndex={0}
                className="cursor-default rounded-full border border-[#3F3F46] bg-[#11111A] px-4 py-2 text-[13px] font-medium text-[#A1A1AA] outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50"
              >
                {tag}
              </span>
            </MarketingTooltip>
          ))}
        </div>

        <div className="md:hidden">
          <Swiper
            modules={[Autoplay, FreeMode]}
            slidesPerView="auto"
            spaceBetween={8}
            freeMode
            loop
            autoplay={
              reducedMotion
                ? false
                : { delay: 2800, disableOnInteraction: false, pauseOnMouseEnter: true }
            }
            className="!overflow-visible"
          >
            {sceneTags.map((tag) => (
              <SwiperSlide key={tag} className="!w-auto">
                <span className="inline-block rounded-full border border-[#3F3F46] bg-[#11111A] px-4 py-2 text-[13px] font-medium text-[#A1A1AA]">
                  {tag}
                </span>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </ScrollReveal>

      {/* Poster gallery — autoplay carousel with pause-on-hover */}
      <ScrollReveal delay={160} className="mt-10">
        <Swiper
          modules={[Autoplay, FreeMode]}
          slidesPerView={1.4}
          spaceBetween={12}
          breakpoints={{
            480: { slidesPerView: 2.2 },
            768: { slidesPerView: 3.2 },
            1024: { slidesPerView: 4, spaceBetween: 16 },
          }}
          loop
          autoplay={
            reducedMotion
              ? false
              : { delay: 3200, disableOnInteraction: false, pauseOnMouseEnter: true }
          }
          className="!overflow-visible"
        >
          {[...scenePosters, ...scenePosters].map((poster, index) => (
            <SwiperSlide key={`${poster}-${index}`}>
              <div className="flex aspect-[3/4] items-end rounded-xl border border-[#232330] bg-gradient-to-br from-[#1A1630] to-[#0B0B10] p-4 transition-colors hover:border-[#8B5CF6]/35">
                <span className="text-[13px] font-semibold text-[#E4E4E7]">{poster}</span>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </ScrollReveal>
    </Section>
  );
}
