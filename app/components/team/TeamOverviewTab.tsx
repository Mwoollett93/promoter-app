"use client";

import InviteMemberCard from "@/app/components/team/InviteMemberCard";
import TeamMemberCardCompact from "@/app/components/team/TeamMemberCardCompact";
import TeamNotificationsPanel from "@/app/components/team/TeamNotificationsPanel";
import WorkspaceActivityFeed from "@/app/components/team/WorkspaceActivityFeed";
import WorkspaceStatsRow from "@/app/components/team/WorkspaceStatsRow";
import type { useTeamWorkspaceData } from "@/lib/team/use-team-workspace-data";
import { GRID_CARD_GAP, PAGE_STACK_GAP } from "@/lib/layout/page-layout";
import { LINK_ACCENT, SECTION_CARD, SECTION_CARD_PADDING, SECTION_TITLE } from "@/lib/ui/page-surfaces";
import type { TeamTabId } from "@/lib/team/team-tabs";

type TeamOverviewTabProps = {
  data: ReturnType<typeof useTeamWorkspaceData>;
  onNavigateTab: (tab: TeamTabId) => void;
};

export default function TeamOverviewTab({ data, onNavigateTab }: TeamOverviewTabProps) {
  const {
    session,
    stats,
    activeMemberCount,
    assignedToYou,
    activeMembers,
    workloads,
    notifications,
    pendingRows,
    refreshAll,
  } = data;

  return (
    <div className={`flex flex-col ${PAGE_STACK_GAP}`}>
      <WorkspaceStatsRow
        stats={stats}
        activeMemberCount={activeMemberCount}
        assignedToYou={assignedToYou}
      />

      <div id="team-invite" className={`grid grid-cols-1 lg:grid-cols-2 ${GRID_CARD_GAP}`}>
        <InviteMemberCard
          pendingRows={pendingRows}
          onRefresh={refreshAll}
          variant="overview"
          onManageInvites={() => onNavigateTab("members")}
        />
        <TeamNotificationsPanel
          items={notifications}
          limit={3}
          onViewAll={() => onNavigateTab("activity")}
        />
      </div>

      <section className={[SECTION_CARD, SECTION_CARD_PADDING].join(" ")}>
        <div className="flex items-center justify-between gap-2">
          <h2 className={SECTION_TITLE}>Team members</h2>
          <button
            type="button"
            onClick={() => onNavigateTab("members")}
            className={LINK_ACCENT}
          >
            Manage all →
          </button>
        </div>
        <div className={`mt-3 grid grid-cols-1 sm:grid-cols-2 ${GRID_CARD_GAP}`}>
          {activeMembers.map((member) => (
            <TeamMemberCardCompact
              key={member.id}
              member={member}
              workload={
                workloads.get(member.id) ?? {
                  memberId: member.id,
                  userId: member.userId,
                  activeTasks: 0,
                  overdueTasks: 0,
                  assignedEvents: 0,
                  workloadLevel: "low",
                  lastActiveAt: member.createdAt,
                }
              }
              currentUserId={session?.user.id}
              onOpenMembers={() => onNavigateTab("members")}
            />
          ))}
        </div>
      </section>

      <WorkspaceActivityFeed
        compact
        limit={6}
        onViewAll={() => onNavigateTab("activity")}
      />
    </div>
  );
}
