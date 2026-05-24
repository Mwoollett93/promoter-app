"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import Sidebar from "./Sidebar";
import WizardHeader from "./WizardHeader";
import { SHELL_PADDING_X, SHELL_PADDING_Y } from "@/lib/layout/page-layout";
import { WorkspaceProvider, useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { SettingsProvider } from "@/lib/settings/SettingsProvider";
import { getStoredSession } from "@/lib/supabase/browser";
import {
  hasWizardProgress,
  saveWizardProgressAsDraft,
} from "@/lib/event-wizard/persist-wizard-draft";

type WizardShellProps = {
  children: React.ReactNode;
  title?: string;
};

function WizardShellLayout({ children, title }: WizardShellProps) {
  const router = useRouter();
  const { session, workspace, ready: workspaceReady, refreshEvents } = useWorkspace();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [draftMessage, setDraftMessage] = React.useState<string | null>(null);
  const [savingDraft, setSavingDraft] = React.useState(false);

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

  return (
    <div className="h-screen overflow-hidden bg-[#0B0B10]">
      <div
        className="isolate grid h-full transition-[grid-template-columns] duration-300 ease-out"
        style={{ gridTemplateColumns: sidebarOpen ? "218px 1fr" : "72px 1fr" }}
      >
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />

        <section
          className={`relative z-0 box-border min-h-0 min-w-0 w-full overflow-x-hidden overflow-y-auto bg-[#0B0B10] ${SHELL_PADDING_X} ${SHELL_PADDING_Y}`}
        >
          <WizardHeader
            title={title}
            onClose={handleClose}
            onSaveDraft={() => void handleSaveDraft()}
            savingDraft={savingDraft}
          />
          {draftMessage ? (
            <p className="mb-3 rounded-lg border border-[#854D0E] bg-[#422006] px-3 py-2 text-[13px] text-[#FDE68A]">
              {draftMessage}
            </p>
          ) : null}
          {children}
        </section>
      </div>
    </div>
  );
}

export default function WizardShell({ children, title }: WizardShellProps) {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!getStoredSession()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B0B10] text-[#A1A1AA]">
        Loading...
      </main>
    );
  }

  return (
    <SettingsProvider>
      <WorkspaceProvider>
        <WizardShellLayout title={title}>{children}</WizardShellLayout>
      </WorkspaceProvider>
    </SettingsProvider>
  );
}
