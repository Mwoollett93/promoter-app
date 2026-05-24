"use client";

import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";

export function FinancePermissionBanner() {
  const { capabilities } = useWorkspace();
  if (capabilities.canEditFinance) return null;
  return (
    <div className="mb-4 rounded-lg border border-[#854D0E] bg-[#422006] px-4 py-3 text-[13px] text-[#FDE68A]">
      You have read-only access to finance for this workspace. Contact an admin to request changes.
    </div>
  );
}

export function LineupPermissionBanner() {
  const { capabilities } = useWorkspace();
  if (capabilities.canEditLineup) return null;
  return (
    <div className="mb-4 rounded-lg border border-[#854D0E] bg-[#422006] px-4 py-3 text-[13px] text-[#FDE68A]">
      You cannot edit lineup in your current role. You can still comment on the event workspace.
    </div>
  );
}
