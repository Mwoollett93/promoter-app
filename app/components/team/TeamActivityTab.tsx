"use client";

import TeamNotificationsPanel from "@/app/components/team/TeamNotificationsPanel";
import WorkspaceActivityFeed from "@/app/components/team/WorkspaceActivityFeed";
import type { useTeamWorkspaceData } from "@/lib/team/use-team-workspace-data";
import { PAGE_STACK_GAP } from "@/lib/layout/page-layout";

type TeamActivityTabProps = {
  data: ReturnType<typeof useTeamWorkspaceData>;
};

export default function TeamActivityTab({ data }: TeamActivityTabProps) {
  return (
    <div className={`flex flex-col ${PAGE_STACK_GAP}`}>
      <TeamNotificationsPanel items={data.notifications} />
      <WorkspaceActivityFeed fullPage />
    </div>
  );
}
