"use client";

import { CalendarPlus } from "lucide-react";
import * as React from "react";

import { createBetaSampleEvent } from "@/lib/beta/sample-event";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { getStoredSession } from "@/lib/supabase/session-store";
import { cn } from "@/lib/utils";

type CreateSampleEventButtonProps = {
  className?: string;
  onSuccess?: () => void;
};

export default function CreateSampleEventButton({
  className,
  onSuccess,
}: CreateSampleEventButtonProps) {
  const { workspace, refresh } = useWorkspace();
  const [loading, setLoading] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

  async function handleClick() {
    const session = getStoredSession();
    if (!session || !workspace?.id || loading) return;

    setLoading(true);
    setNotice(null);

    try {
      const result = await createBetaSampleEvent(session, workspace.id);
      if (!result.ok) {
        setNotice(result.message);
        return;
      }
      setNotice(
        result.created
          ? `Added “${result.name}”.`
          : `“${result.name}” is already in your workspace.`,
      );
      await refresh();
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={loading || !workspace?.id}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#232330] bg-[#11111A] px-4 text-sm font-medium text-[#E4E4E7] hover:border-[#8B5CF6]/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <CalendarPlus className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        {loading ? "Adding…" : "Create sample event"}
      </button>
      {notice ? <p className="text-[12px] text-[#A1A1AA]">{notice}</p> : null}
    </div>
  );
}
