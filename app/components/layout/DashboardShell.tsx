"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import WorkspaceLoadingScreen from "@/app/components/ui/WorkspaceLoadingScreen";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { SHELL_PADDING_X, SHELL_PADDING_Y } from "@/lib/layout/page-layout";
import { shouldShowMobileCreateFab, shouldHideMobilePageTitle } from "@/lib/layout/mobile-nav";
import { isAccountActive, loadSettings, reactivateAccount } from "@/lib/settings/settings";
import { getStoredSession } from "@/lib/supabase/session-store";
import { useIsLargeDesktop, useIsMobile } from "@/lib/ui/use-breakpoint";
import { cn } from "@/lib/utils";
import MobileAppHeader, {
  getAppPageSubtitle,
  getAppPageTitle,
  MobileCreateEventFab,
  MobilePageTitleHidden,
} from "./MobileAppHeader";
import MobileBottomNav from "./MobileBottomNav";
import { mobileTabBarSpacerClass } from "@/lib/layout/mobile-nav";
import BetaShell from "@/app/components/beta/BetaShell";
import MobileMoreSheet from "./MobileMoreSheet";
import Sidebar from "./Sidebar";

export default function DashboardShell({
  children,
  viewportLock = false,
}: {
  children: React.ReactNode;
  /** Dashboard: no page scroll on lg+ — content fits one viewport */
  viewportLock?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready: workspaceReady } = useWorkspace();
  const isMobile = useIsMobile();
  const isLargeDesktop = useIsLargeDesktop();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  const effectiveViewportLock = viewportLock && isLargeDesktop;
  const showFab = isMobile && shouldShowMobileCreateFab(pathname);
  const hidePageTitles = isMobile && shouldHideMobilePageTitle(pathname);

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

  React.useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  if (!ready) {
    return <WorkspaceLoadingScreen message="Checking session" />;
  }

  if (!workspaceReady) {
    return <WorkspaceLoadingScreen />;
  }

  const pageBody = hidePageTitles ? <MobilePageTitleHidden>{children}</MobilePageTitleHidden> : children;

  return (
    <div className="h-screen overflow-hidden bg-[#0B0B10]">
      <MobileMoreSheet open={moreOpen} onOpenChange={setMoreOpen} />

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
            title={getAppPageTitle(pathname)}
            subtitle={getAppPageSubtitle(pathname)}
          />
        ) : null}

        <section
          className={[
            "relative z-0 box-border min-h-0 min-w-0 w-full overflow-x-hidden bg-[#0B0B10]",
            effectiveViewportLock
              ? `flex h-full flex-col overflow-hidden ${SHELL_PADDING_X} ${SHELL_PADDING_Y}`
              : isMobile
                ? `min-h-0 flex-1 overflow-y-auto ${SHELL_PADDING_X} ${SHELL_PADDING_Y} ${mobileTabBarSpacerClass({ withFab: showFab })}`
                : `overflow-y-auto ${SHELL_PADDING_X} ${SHELL_PADDING_Y}`,
          ].join(" ")}
        >
          {effectiveViewportLock ? (
            <div className="flex min-h-0 flex-1 flex-col">{pageBody}</div>
          ) : (
            pageBody
          )}
        </section>
      </div>

      {isMobile ? <MobileBottomNav onMorePress={() => setMoreOpen(true)} /> : null}
      {showFab ? <MobileCreateEventFab /> : null}
      <BetaShell />
    </div>
  );
}
