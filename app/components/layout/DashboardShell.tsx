"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import Sidebar from "./Sidebar";
import { SHELL_PADDING_X, SHELL_PADDING_Y } from "@/lib/layout/page-layout";
import { WorkspaceProvider } from "@/lib/collaboration/WorkspaceContext";
import { SettingsProvider } from "@/lib/settings/SettingsProvider";
import { isAccountActive, loadSettings, reactivateAccount } from "@/lib/settings/settings";
import { getStoredSession } from "@/lib/supabase/browser";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const session = getStoredSession();
    if (!session) {
      const returnTo = pathname && pathname !== "/" ? `?returnTo=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${returnTo}`);
      return;
    }

    if (!isAccountActive(loadSettings())) {
      reactivateAccount();
    }

    setReady(true);
  }, [pathname, router]);

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
          {children}
        </section>
      </div>
    </div>
      </WorkspaceProvider>
    </SettingsProvider>
  );
}
