"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import WorkspaceLoadingScreen from "@/app/components/ui/WorkspaceLoadingScreen";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import Sidebar from "./Sidebar";
import { SHELL_PADDING_X, SHELL_PADDING_Y } from "@/lib/layout/page-layout";
import { isAccountActive, loadSettings, reactivateAccount } from "@/lib/settings/settings";
import { getStoredSession } from "@/lib/supabase/session-store";

export default function DashboardShell({
  children,
  viewportLock = false,
}: {
  children: React.ReactNode;
  /** Dashboard: no page scroll — content fits one viewport */
  viewportLock?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready: workspaceReady } = useWorkspace();
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
    return <WorkspaceLoadingScreen message="Checking session" />;
  }

  if (!workspaceReady) {
    return <WorkspaceLoadingScreen />;
  }

  return (
    <div className="h-screen overflow-hidden bg-[#0B0B10]">
      <div
        className="isolate grid h-full transition-[grid-template-columns] duration-300 ease-out"
        style={{ gridTemplateColumns: sidebarOpen ? "218px 1fr" : "72px 1fr" }}
      >
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />

        <section
          className={[
            "relative z-0 box-border min-h-0 min-w-0 w-full overflow-x-hidden bg-[#0B0B10]",
            viewportLock
              ? `flex h-full flex-col overflow-hidden ${SHELL_PADDING_X} ${SHELL_PADDING_Y}`
              : `overflow-y-auto ${SHELL_PADDING_X} ${SHELL_PADDING_Y}`,
          ].join(" ")}
        >
          {viewportLock ? (
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          ) : (
            children
          )}
        </section>
      </div>
    </div>
  );
}
