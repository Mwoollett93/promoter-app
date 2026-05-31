"use client";

import DashboardSection from "@/app/components/marketing/landing/DashboardSection";
import FeaturesSection from "@/app/components/marketing/landing/FeaturesSection";
import FinalCtaSection from "@/app/components/marketing/landing/FinalCtaSection";
import FinanceSection from "@/app/components/marketing/landing/FinanceSection";
import HeroSection from "@/app/components/marketing/landing/HeroSection";
import HowItWorksSection from "@/app/components/marketing/landing/HowItWorksSection";
import PricingSection from "@/app/components/marketing/landing/PricingSection";
import ProblemSolutionSection from "@/app/components/marketing/landing/ProblemSolutionSection";
import SceneSection from "@/app/components/marketing/landing/SceneSection";
import TasksSection from "@/app/components/marketing/landing/TasksSection";
import TeamSection from "@/app/components/marketing/landing/TeamSection";
import TestimonialsSection from "@/app/components/marketing/landing/TestimonialsSection";

/** Composes all animated landing sections — copy unchanged from marketing content. */
export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <SceneSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ProblemSolutionSection />
      <DashboardSection />
      <FinanceSection />
      <TasksSection />
      <TeamSection />
      <TestimonialsSection />
      <PricingSection />
      <FinalCtaSection />
    </>
  );
}
