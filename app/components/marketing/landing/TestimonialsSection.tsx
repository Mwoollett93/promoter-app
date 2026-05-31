"use client";

import "swiper/css";

import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { Section, SectionHeader } from "@/app/components/marketing/marketing-ui";
import { ScrollReveal } from "@/app/components/marketing/landing/ScrollReveal";
import { usePrefersReducedMotion } from "@/app/components/marketing/landing/usePrefersReducedMotion";
import { testimonials } from "@/lib/marketing/content";

export default function TestimonialsSection() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <Section className="bg-[#08080C]/60">
      <ScrollReveal>
        <SectionHeader eyebrow="Early feedback" title="Used by local promoters in Melbourne" />
      </ScrollReveal>

      <ScrollReveal delay={100} className="mt-14">
        {/* Swiper on all breakpoints — autoplay pauses on hover for readability */}
        <Swiper
          modules={[Autoplay]}
          slidesPerView={1}
          spaceBetween={24}
          breakpoints={{ 768: { slidesPerView: 2 } }}
          loop={testimonials.length > 1}
          autoplay={
            reducedMotion
              ? false
              : { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }
          }
        >
          {testimonials.map((t) => (
            <SwiperSlide key={t.author}>
              <blockquote className="h-full rounded-2xl border border-[#232330] bg-[#11111A] p-8">
                <p className="text-[17px] leading-7 text-[#E4E4E7]">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-6">
                  <p className="text-[14px] font-semibold text-[#F5F5F7]">{t.author}</p>
                  <p className="text-[13px] text-[#71717A]">{t.role}</p>
                </footer>
              </blockquote>
            </SwiperSlide>
          ))}
        </Swiper>
      </ScrollReveal>
    </Section>
  );
}
