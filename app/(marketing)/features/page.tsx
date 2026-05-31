import dynamic from "next/dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PrimaryCta, Section, SectionHeader } from "@/app/components/marketing/marketing-ui";
import { featureSections } from "@/lib/marketing/content";

const EventsShowcase = dynamic(() => import("@/app/components/marketing/EventsShowcase"));
const RunShowcase = dynamic(() => import("@/app/components/marketing/RunShowcase"));
const SalesTrackerShowcase = dynamic(() => import("@/app/components/marketing/SalesTrackerShowcase"));
const WizardShowcase = dynamic(() => import("@/app/components/marketing/WizardShowcase"));
const TaskBoardShowcase = dynamic(() => import("@/app/components/marketing/TaskBoardShowcase"));
const DashboardShowcase = dynamic(() => import("@/app/components/marketing/DashboardShowcase"));

export const metadata: Metadata = {
  title: "Features",
  description:
    "PromoSync features: dashboard, event wizard, Run overview, Sales Tracker, finance forecasting, kanban tasks, artist & venue CRM, and team workspaces.",
};

function FeatureShowcase({ sectionId }: { sectionId: string }) {
  switch (sectionId) {
    case "events":
      return <EventsShowcase />;
    case "run":
      return <RunShowcase />;
    case "sales":
      return <SalesTrackerShowcase />;
    case "lineup":
      return <WizardShowcase activeStep="Lineup & Schedule" />;
    case "finance":
      return <WizardShowcase activeStep="Finance & Forecast" />;
    case "tasks":
      return <TaskBoardShowcase />;
    case "team":
      return <SalesTrackerShowcase />;
    case "reporting":
      return <DashboardShowcase variant="compact" />;
    case "artists":
    case "venues":
    case "ai":
    default:
      return <DashboardShowcase variant="compact" />;
  }
}

export default function FeaturesPage() {
  return (
    <>
      <Section className="pt-16 lg:pt-24">
        <div className="max-w-3xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8B5CF6]">
            Product deep dive
          </p>
          <h1 className="mt-4 text-[40px] font-bold leading-tight tracking-tight text-[#F5F5F7] sm:text-[48px]">
            Built from the actual PromoSync app
          </h1>
          <p className="mt-5 text-[17px] leading-7 text-[#A1A1AA]">
            Every preview on this page mirrors real screens — Dashboard, Events, Run, Sales Tracker,
            the event wizard, and kanban tasks. No stock UI mockups.
          </p>
          <div className="mt-8">
            <PrimaryCta href="/login?view=signup">Start free</PrimaryCta>
          </div>
        </div>
      </Section>

      {featureSections.map((section, index) => {
        const Icon = section.icon;
        const reversed = index % 2 === 1;

        return (
          <Section
            key={section.id}
            id={section.id}
            className={index % 2 === 0 ? "" : "bg-[#08080C]/50"}
          >
            <div
              className={[
                "grid items-center gap-12 lg:grid-cols-2",
                reversed ? "lg:[&>*:first-child]:order-2" : "",
              ].join(" ")}
            >
              <div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-[#1A1630] text-[#C4B5FD] ring-1 ring-[#8B5CF6]/25">
                  <Icon className="size-6" />
                </div>
                <h2 className="mt-6 text-[28px] font-bold text-[#F5F5F7] sm:text-[32px]">
                  {section.title}
                </h2>
                <p className="mt-3 text-[16px] leading-7 text-[#A1A1AA]">{section.subtitle}</p>
                <ul className="mt-6 space-y-3">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3 text-[15px] text-[#E4E4E7]">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#8B5CF6]" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <FeatureShowcase sectionId={section.id} />
              </div>
            </div>
          </Section>
        );
      })}

      <Section>
        <div className="rounded-2xl border border-[#232330] bg-[#11111A] px-8 py-12 text-center">
          <h2 className="text-[28px] font-bold text-[#F5F5F7]">Ready to run your next night?</h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-[#A1A1AA]">
            Create an account in minutes — no credit card for the free tier.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <PrimaryCta href="/login?view=signup">Get started</PrimaryCta>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center gap-2 px-4 text-[15px] font-medium text-[#C4B5FD] hover:text-[#E9D5FF]"
            >
              Book a demo
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
