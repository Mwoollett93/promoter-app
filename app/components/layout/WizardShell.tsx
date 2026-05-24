"use client";

import * as React from "react";
import Sidebar from "./Sidebar";
import WizardHeader from "./WizardHeader";
import { SHELL_PADDING_X, SHELL_PADDING_Y } from "@/lib/layout/page-layout";
import { WorkspaceProvider } from "@/lib/collaboration/WorkspaceContext";
import { SettingsProvider } from "@/lib/settings/SettingsProvider";
import { getStoredSession } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

type WizardShellProps = {
  children: React.ReactNode;
  title?: string;
};

export default function WizardShell({ children, title }: WizardShellProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
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
    <div className="h-screen overflow-hidden bg-[#0B0B10]">
      <div
        className="isolate grid h-full transition-[grid-template-columns] duration-300 ease-out"
        style={{ gridTemplateColumns: sidebarOpen ? "218px 1fr" : "72px 1fr" }}
      >
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />

        <section
          className={`relative z-0 box-border min-h-0 min-w-0 w-full overflow-x-hidden overflow-y-auto bg-[#0B0B10] ${SHELL_PADDING_X} ${SHELL_PADDING_Y}`}
        >
          {/* No mx-auto/max-w so content can fill to right edge */}
          <WizardHeader title={title} />
          {children}
        </section>
      </div>
    </div>
      </WorkspaceProvider>
    </SettingsProvider>
  );
}
