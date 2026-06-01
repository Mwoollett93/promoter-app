"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import WorkspaceLoadingScreen from "@/app/components/ui/WorkspaceLoadingScreen";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { SHELL_PADDING_X, SHELL_PADDING_Y } from "@/lib/layout/page-layout";
import {
  hasWizardProgress,
  saveWizardProgressAsDraft,
} from "@/lib/event-wizard/persist-wizard-draft";
import { getStoredSession } from "@/lib/supabase/session-store";
import { useIsMobile } from "@/lib/ui/use-breakpoint";
import { cn } from "@/lib/utils";
import MobileAppHeader, { getAppPageTitle } from "./MobileAppHeader";
import Sidebar from "./Sidebar";
import Stepper, { wizardStepFromPathname } from "@/app/components/ui/Stepper";
import WizardHeader from "./WizardHeader";

type WizardShellProps = {
  children: React.ReactNode;
  title?: string;
};

export default function WizardShell({ children, title }: WizardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, workspace, ready: workspaceReady, refreshEvents } = useWorkspace();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [draftMessage, setDraftMessage] = React.useState<string | null>(null);
  const [savingDraft, setSavingDraft] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const current = getStoredSession();
    if (!current) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  function handleClose() {
    if (
      hasWizardProgress() &&
      !window.confirm(
        "Leave the event wizard? Your progress stays in this browser until you finish or save a draft.",
      )
    ) {
      return;
    }
    router.push("/events");
  }

  async function handleSaveDraft() {
    setDraftMessage(null);

    if (!session || !workspace || !workspaceReady) {
      setDraftMessage("Workspace is still loading. Try again in a moment.");
      return;
    }

    setSavingDraft(true);
    try {
      const result = await saveWizardProgressAsDraft(session, workspace.id);
      if (!result.ok) {
        setDraftMessage(result.message);
        return;
      }
      await refreshEvents();
      router.push("/events");
    } finally {
      setSavingDraft(false);
    }
  }

  if (!ready) {
    return <WorkspaceLoadingScreen message="Checking session" />;
  }

  if (!workspaceReady) {
    return <WorkspaceLoadingScreen />;
  }

  return (
    <div className="h-screen overflow-hidden bg-[#0B0B10]">
      <div
        className={cn(
          "h-full",
          isMobile
            ? "flex flex-col"
            : "isolate grid transition-[grid-template-columns] duration-300 ease-out",
        )}
        style={
          isMobile
            ? undefined
            : { gridTemplateColumns: sidebarOpen ? "218px 1fr" : "72px 1fr" }
        }
      >
        {!isMobile ? (
          <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />
        ) : null}

        {isMobile ? (
          <MobileAppHeader
            title={title ?? getAppPageTitle(pathname)}
            subtitle="Step through lineup, finance, and review."
          />
        ) : null}

        <section
          className={cn(
            "relative z-0 box-border min-h-0 min-w-0 w-full overflow-x-hidden bg-[#0B0B10]",
            isMobile
              ? `min-h-0 flex-1 overflow-y-auto ${SHELL_PADDING_X} ${SHELL_PADDING_Y}`
              : `overflow-y-auto ${SHELL_PADDING_X} ${SHELL_PADDING_Y}`,
          )}
        >
          {!isMobile ? (
            <WizardHeader
              title={title}
              onClose={handleClose}
              onSaveDraft={() => void handleSaveDraft()}
              savingDraft={savingDraft}
            />
          ) : null}
          {draftMessage ? (
            <p className="mb-3 rounded-lg border border-[#854D0E] bg-[#422006] px-3 py-2 text-[13px] text-[#FDE68A]">
              {draftMessage}
            </p>
          ) : null}
          {isMobile ? (
            <div className="mb-4">
              <Stepper state={wizardStepFromPathname(pathname)} />
            </div>
          ) : null}
          {children}
        </section>
      </div>
    </div>
  );
}
