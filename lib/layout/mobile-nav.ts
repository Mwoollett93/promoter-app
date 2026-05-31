import type { LucideIcon } from "lucide-react";
import {
  CalendarPlus,
  CalendarRange,
  CheckSquare,
  LayoutDashboard,
  MoreHorizontal,
} from "lucide-react";

export type MobileTabId = "home" | "events" | "run" | "tasks" | "more";

export type MobileTab = {
  id: MobileTabId;
  label: string;
  href?: string;
  icon: LucideIcon;
};

/** Primary bottom navigation — daily promoter workflows. */
export const MOBILE_PRIMARY_TABS: MobileTab[] = [
  { id: "home", label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { id: "events", label: "Events", href: "/events", icon: CalendarPlus },
  { id: "run", label: "Run", href: "/run", icon: CalendarRange },
  { id: "tasks", label: "Tasks", href: "/tasks", icon: CheckSquare },
  { id: "more", label: "More", icon: MoreHorizontal },
];

export type MobileMoreItem = {
  label: string;
  href: string;
  description?: string;
};

export const MOBILE_MORE_ITEMS: MobileMoreItem[] = [
  { label: "Team", href: "/team", description: "Members & activity" },
  { label: "Venues", href: "/venues", description: "Venue CRM" },
  { label: "Artists", href: "/artists", description: "Roster & bookings" },
  { label: "Settings", href: "/settings", description: "Account & workspace" },
];

/** Space reserved above home indicator for bottom tab bar. */
export const MOBILE_TAB_BAR_CLASS =
  "h-[calc(3.5rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]";

export function resolveMobileTab(pathname: string | null): MobileTabId {
  if (!pathname) return "home";
  if (pathname.startsWith("/dashboard")) return "home";
  if (pathname.startsWith("/events") || pathname.startsWith("/event-wizard")) return "events";
  if (pathname.startsWith("/run") || pathname.startsWith("/season")) return "run";
  if (pathname.startsWith("/tasks")) return "tasks";
  if (
    pathname.startsWith("/team") ||
    pathname.startsWith("/venues") ||
    pathname.startsWith("/artists") ||
    pathname.startsWith("/settings")
  ) {
    return "more";
  }
  return "home";
}

export function shouldShowMobileCreateFab(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/dashboard") ||
    pathname === "/events" ||
    pathname.startsWith("/run")
  );
}

export function shouldHideMobilePageTitle(pathname: string | null): boolean {
  if (!pathname) return false;
  if (/\/events\/[^/]+\/workspace/.test(pathname)) return false;
  return (
    pathname.startsWith("/dashboard") ||
    pathname === "/events" ||
    pathname.startsWith("/run") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/team") ||
    pathname.startsWith("/venues") ||
    pathname.startsWith("/artists") ||
    pathname.startsWith("/settings") ||
    pathname === "/venues/new" ||
    pathname === "/artists/new"
  );
}

export function mobileTabBarSpacerClass(options?: { withFab?: boolean }) {
  if (options?.withFab) {
    return "pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:pb-0";
  }
  return "pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0";
}
