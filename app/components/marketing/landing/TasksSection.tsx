"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Section, SectionHeader } from "@/app/components/marketing/marketing-ui";
import { ScrollReveal } from "@/app/components/marketing/landing/ScrollReveal";
import { collaborationHighlights } from "@/lib/marketing/content";

const TaskBoardShowcase = dynamic(() => import("@/app/components/marketing/TaskBoardShowcase"));

export default function TasksSection() {
  return (
    <Section>
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <ScrollReveal className="order-2 lg:order-1">
          <TaskBoardShowcase />
        </ScrollReveal>

        <ScrollReveal delay={100} className="order-1 lg:order-2">
          <SectionHeader
            align="left"
            eyebrow="Operations"
            title="Tasks that know your events"
            description="Kanban boards with event context, overdue metrics, and suggestions pulled from lineup and finance gaps — not another generic todo app."
          />
          <ul className="mt-8 space-y-3">
            {collaborationHighlights.map((item) => (
              <li key={item} className="flex items-center gap-2 text-[14px] text-[#E4E4E7]">
                <Check className="size-4 shrink-0 text-[#86EFAC]" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/features#tasks"
            className="mt-6 inline-flex items-center gap-2 text-[14px] font-medium text-[#C4B5FD] transition-colors hover:text-[#E9D5FF]"
          >
            See task board
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </ScrollReveal>
      </div>
    </Section>
  );
}
