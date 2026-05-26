"use client";

import PageContent from "@/app/components/layout/PageContent";
import KanbanBoard from "@/app/components/tasks/KanbanBoard";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { PAGE_DESCRIPTION, PAGE_TITLE } from "@/lib/ui/page-surfaces";

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
          <h1 className={PAGE_TITLE}>Tasks</h1>
          <p className={`${PAGE_DESCRIPTION} max-w-2xl`}>
            Season operations board — filter by event, track overdue work, and drag tasks through your workflow.
          </p>
        </div>
        <KanbanBoard workspaceId={workspace.id} />
      </div>
    </PageContent>
  );
}
