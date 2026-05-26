"use client";

import WorkspaceSettingsPanel from "@/app/components/team/WorkspaceSettingsPanel";
import { PAGE_STACK_GAP } from "@/lib/layout/page-layout";

export default function TeamSettingsTab() {
  return (
    <div className={`flex flex-col ${PAGE_STACK_GAP}`}>
      <WorkspaceSettingsPanel expanded />
    </div>
  );
}
