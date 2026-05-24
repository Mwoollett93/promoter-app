"use client";

import PageContent from "@/app/components/layout/PageContent";
import KanbanBoard from "@/app/components/tasks/KanbanBoard";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";

export default function TasksPageContent() {
  const { workspace } = useWorkspace();

  if (!workspace) {
    return (
      <PageContent>
        <p className="text-[#A1A1AA]">Loading workspace…</p>
      </PageContent>
    );
  }

  return (
    <PageContent fill>
      <div className="space-y-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#F5F5F7]">Tasks</h1>
          <p className="mt-1 text-[14px] text-[#A1A1AA]">
            Operational backbone — drag cards across columns for your whole season.
          </p>
        </div>
        <KanbanBoard workspaceId={workspace.id} />
      </div>
    </PageContent>
  );
}
