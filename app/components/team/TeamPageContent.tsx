"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import PageContent from "@/app/components/layout/PageContent";
import Button from "@/app/components/ui/Button";
import TeamActivityTab from "@/app/components/team/TeamActivityTab";
import TeamMembersTab from "@/app/components/team/TeamMembersTab";
import TeamOverviewTab from "@/app/components/team/TeamOverviewTab";
import TeamPageTabs from "@/app/components/team/TeamPageTabs";
import TeamSettingsTab from "@/app/components/team/TeamSettingsTab";
import TeamTemplatesTab from "@/app/components/team/TeamTemplatesTab";
import { canInviteMembers } from "@/lib/collaboration/permissions";
import { useTeamWorkspaceData } from "@/lib/team/use-team-workspace-data";
import { parseTeamTab, type TeamTabId } from "@/lib/team/team-tabs";
import { PAGE_STACK_GAP } from "@/lib/layout/page-layout";
import {
  PAGE_DESCRIPTION,
  PAGE_EYEBROW,
  PAGE_TITLE,
} from "@/lib/ui/page-surfaces";

export default function TeamPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const data = useTeamWorkspaceData();
  const tab = parseTeamTab(searchParams.get("tab"));

  const canManage = data.canManage;

  function setTab(next: TeamTabId) {
    const query = next === "overview" ? "" : `?tab=${next}`;
    router.replace(`/team${query}`, { scroll: false });
  }

  function handleInviteClick() {
    if (tab === "overview") {
      document.getElementById("team-invite")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setTab("members");
  }

  return (
    <PageContent fill>
      <header
        className={`flex flex-col ${PAGE_STACK_GAP} sm:flex-row sm:items-start sm:justify-between`}
      >
        <div>
          <p className={PAGE_EYEBROW}>Operations workspace</p>
          <h1 className={PAGE_TITLE}>Team</h1>
          <p className={`${PAGE_DESCRIPTION} max-w-2xl`}>
            Operational dashboard for your crew — overview first, deeper management in each tab.
          </p>
        </div>
        {canManage ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="shrink-0 gap-2"
            onClick={handleInviteClick}
          >
            <UserPlus className="size-4" strokeWidth={2} aria-hidden />
            Invite member
          </Button>
        ) : null}
      </header>

      <div className={`flex flex-col ${PAGE_STACK_GAP}`}>
        <TeamPageTabs active={tab} onChange={setTab} />

        {tab === "overview" ? <TeamOverviewTab data={data} onNavigateTab={setTab} /> : null}
        {tab === "members" ? <TeamMembersTab data={data} /> : null}
        {tab === "templates" ? <TeamTemplatesTab /> : null}
        {tab === "activity" ? <TeamActivityTab data={data} /> : null}
        {tab === "settings" ? <TeamSettingsTab /> : null}
      </div>
    </PageContent>
  );
}
