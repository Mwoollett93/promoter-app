"use client";

import { Check, Users } from "lucide-react";

import { Section, SectionHeader } from "@/app/components/marketing/marketing-ui";
import { ScrollReveal, StaggerGroup } from "@/app/components/marketing/landing/ScrollReveal";

const teamBullets = [
  "Shared event workspaces per show",
  "Role-based access for promoters, marketing, and finance",
  "Stripe billing when you are ready to scale",
] as const;

const teamTasks = [
  { label: "Assign pre-show tasks", status: "Live" },
  { label: "Comment threads on tasks", status: "Live" },
  { label: "Workspace invites & roles", status: "Live" },
] as const;

export default function TeamSection() {
  return (
    <Section className="bg-[#08080C]/60">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <ScrollReveal>
          <SectionHeader
            align="left"
            eyebrow="Collaboration"
            title="Your collective on one workspace"
            description="Invite your crew, assign work, and keep comments on the task — permissions and MFA included."
          />
          <ul className="mt-8 space-y-3">
            {teamBullets.map((item) => (
              <li key={item} className="flex items-center gap-2 text-[14px] text-[#E4E4E7]">
                <Check className="size-4 shrink-0 text-[#86EFAC]" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="rounded-2xl border border-[#232330] bg-[#11111A] p-6">
            <div className="flex items-center gap-3">
              <Users className="size-5 text-[#8B5CF6]" aria-hidden />
              <p className="text-[14px] font-semibold text-[#F5F5F7]">Team workspace</p>
            </div>
            <StaggerGroup className="mt-4 flex flex-col gap-3" stagger={80}>
              {teamTasks.map((task) => (
                <div
                  key={task.label}
                  className="flex items-center justify-between rounded-lg border border-[#232330] bg-[#0B0B10] px-4 py-3 text-[13px] text-[#E4E4E7]"
                >
                  {task.label}
                  <span className="text-[11px] font-medium text-[#86EFAC]">{task.status}</span>
                </div>
              ))}
            </StaggerGroup>
          </div>
        </ScrollReveal>
      </div>
    </Section>
  );
}
