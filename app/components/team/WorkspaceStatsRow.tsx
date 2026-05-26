"use client";

import { AlertTriangle, CalendarDays, ClipboardList, PauseCircle, Users } from "lucide-react";

import WorkspaceStatCard from "@/app/components/team/WorkspaceStatCard";
import type { WorkspaceTeamStats } from "@/lib/team/workspace-team-stats";

type WorkspaceStatsRowProps = {
  stats: WorkspaceTeamStats;
};

export default function WorkspaceStatsRow({ stats }: WorkspaceStatsRowProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      <WorkspaceStatCard label="Team members" value={stats.teamMembers} icon={Users} />
      <WorkspaceStatCard
        label="Active events"
        value={stats.activeEvents}
        icon={CalendarDays}
        tone="text-[#93C5FD]"
      />
      <WorkspaceStatCard
        label="Open tasks"
        value={stats.openTasks}
        icon={ClipboardList}
        tone="text-[#C4B5FD]"
      />
      <WorkspaceStatCard
        label="Pending approvals"
        value={stats.pendingApprovals}
        icon={PauseCircle}
        tone="text-[#FCD34D]"
      />
      <WorkspaceStatCard
        label="Overdue tasks"
        value={stats.overdueTasks}
        icon={AlertTriangle}
        tone="text-[#FCA5A5]"
      />
    </div>
  );
}
