"use client";

import {
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  PauseCircle,
  Users,
} from "lucide-react";

import StatMiniCard from "@/app/components/dashboard/StatMiniCard";
import { GRID_CARD_GAP } from "@/lib/layout/page-layout";
import type { WorkspaceTeamStats } from "@/lib/team/workspace-team-stats";

type WorkspaceStatsRowProps = {
  stats: WorkspaceTeamStats;
  activeMemberCount: number;
  assignedToYou: number;
};

export default function WorkspaceStatsRow({
  stats,
  activeMemberCount,
  assignedToYou,
}: WorkspaceStatsRowProps) {
  return (
    <section className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 ${GRID_CARD_GAP}`}>
      <StatMiniCard
        icon={Users}
        label="Team members"
        value={stats.teamMembers}
        trend={`${activeMemberCount} active`}
        trendUp
      />
      <StatMiniCard
        icon={CalendarDays}
        label="Active events"
        value={stats.activeEvents}
        trend={stats.activeEvents > 0 ? "In your workspace" : "No active shows"}
        trendUp
      />
      <StatMiniCard
        icon={ClipboardList}
        label="Open tasks"
        value={stats.openTasks}
        trend={
          assignedToYou > 0
            ? `${assignedToYou} assigned to you`
            : "Nothing assigned to you"
        }
        trendUp
      />
      <StatMiniCard
        icon={PauseCircle}
        label="Pending approvals"
        value={stats.pendingApprovals}
        trend={stats.pendingApprovals === 0 ? "All caught up" : "Waiting on response"}
        trendUp={stats.pendingApprovals === 0}
      />
      <StatMiniCard
        icon={AlertTriangle}
        label="Overdue tasks"
        value={stats.overdueTasks}
        trend={stats.overdueTasks === 0 ? "Great work" : "Needs attention"}
        trendUp={stats.overdueTasks === 0}
      />
    </section>
  );
}
