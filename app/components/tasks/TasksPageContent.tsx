"use client";

import PageContent from "@/app/components/layout/PageContent";
import KanbanBoard from "@/app/components/tasks/KanbanBoard";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";

export default function TasksPageContent() {
  const { ready, workspace, error, refresh } = useWorkspace();

  if (!ready) {
    return (
      <PageContent>
        <p className="text-[#A1A1AA]">Loading workspace…</p>
      </PageContent>
    );
  }

  if (!workspace) {
    return (
      <PageContent>
        <div className="space-y-3">
          <p className="text-[#FCA5A5]">
            {error ?? "Workspace could not be loaded."}
          </p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-lg border border-[#3F3F46] px-4 py-2 text-[13px] text-[#F5F5F7] hover:bg-[#18181F]"
          >
            Retry
          </button>
        </div>
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
