"use client";

import PageContent from "@/app/components/layout/PageContent";
import TeamWorkspaceSettings from "@/app/components/settings/TeamWorkspaceSettings";
import TemplatesSettings from "@/app/components/settings/TemplatesSettings";
import { PAGE_STACK_GAP } from "@/lib/layout/page-layout";

export default function TeamPageContent() {
  return (
    <PageContent>
      <header className={PAGE_STACK_GAP}>
        <h1 className="text-[28px] font-bold tracking-tight text-[#F5F5F7] sm:text-[32px]">
          Team workspace
        </h1>
        <p className="mt-1 text-[14px] text-[#A1A1AA]">
          Invite collaborators, manage roles, and apply workspace templates.
        </p>
      </header>

      <div className={`mt-8 flex flex-col ${PAGE_STACK_GAP}`}>
        <TeamWorkspaceSettings />
        <TemplatesSettings />
      </div>
    </PageContent>
  );
}
