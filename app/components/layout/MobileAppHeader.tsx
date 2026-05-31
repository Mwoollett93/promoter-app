"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { Plus } from "lucide-react";

import StartNewEventLink from "@/app/components/events/StartNewEventLink";
import { cn } from "@/lib/utils";

const NotificationPanel = dynamic(
  () => import("@/app/components/notifications/NotificationPanel"),
  { ssr: false },
);

type MobileAppHeaderProps = {
  title: string;
  subtitle?: string;
};

export default function MobileAppHeader({ title, subtitle }: MobileAppHeaderProps) {
  return (
    <header className="shrink-0 border-b border-[#232330]/80 bg-[#11111A] px-4 pb-3 pt-[max(8px,env(safe-area-inset-top))] md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 pt-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#71717A]">PromoSync</p>
          <h1 className="mt-0.5 truncate text-[22px] font-bold leading-7 tracking-tight text-[#F5F5F7]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-[#A1A1AA]">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center pt-1">
          <NotificationPanel />
        </div>
      </div>
    </header>
  );
}

type MobileCreateEventFabProps = {
  className?: string;
};

export function MobileCreateEventFab({ className }: MobileCreateEventFabProps) {
  return (
    <StartNewEventLink
      aria-label="Create new event"
      className={cn(
        "fixed z-30 flex size-14 items-center justify-center rounded-full border border-[rgba(139,92,246,0.55)] bg-[#7C3AED] text-white shadow-[0_8px_32px_rgba(124,58,237,0.45)] transition-transform hover:scale-105 hover:bg-[#8B5CF6] active:scale-95 md:hidden",
        "bottom-[calc(3.75rem+env(safe-area-inset-bottom))] right-4",
        className,
      )}
    >
      <Plus className="size-6" strokeWidth={2.5} aria-hidden />
    </StartNewEventLink>
  );
}

export function getAppPageTitle(pathname: string | null): string {
  if (!pathname) return "PromoSync";
  if (pathname.startsWith("/dashboard")) return "Home";
  if (pathname.startsWith("/event-wizard")) return "New event";
  if (/\/events\/[^/]+\/workspace/.test(pathname)) return "Event workspace";
  if (pathname.startsWith("/events")) return "Events";
  if (pathname.startsWith("/run")) return "Run";
  if (pathname.startsWith("/tasks")) return "Tasks";
  if (pathname.startsWith("/team")) return "Team";
  if (pathname === "/venues/new") return "Add venue";
  if (pathname.startsWith("/venues")) return "Venues";
  if (pathname === "/artists/new") return "Add artist";
  if (pathname.startsWith("/artists")) return "Artists";
  if (pathname.startsWith("/settings")) return "Settings";
  return "PromoSync";
}

export function getAppPageSubtitle(pathname: string | null): string | undefined {
  if (!pathname) return undefined;
  if (pathname.startsWith("/dashboard")) return "Your shows, tasks, and alerts at a glance.";
  if (pathname === "/events") return "Browse and manage every event in your workspace.";
  if (/\/events\/[^/]+\/workspace/.test(pathname)) return undefined;
  if (pathname.startsWith("/run")) return "Timeline, P/L, and operational risks.";
  if (pathname.startsWith("/tasks")) return "Season ops and event tasks.";
  if (pathname.startsWith("/team")) return "Members, invites, and activity.";
  if (pathname === "/venues/new") return "Add a venue to your portfolio.";
  if (pathname.startsWith("/venues")) return "Venues in your portfolio.";
  if (pathname === "/artists/new") return "Create a new artist profile.";
  if (pathname.startsWith("/artists")) return "Artists and bookings.";
  if (pathname.startsWith("/settings")) return "Profile, billing, and preferences.";
  return undefined;
}

/** Hide redundant page hero when shell header already shows title. */
export function MobilePageTitleHidden({ children }: { children: ReactNode }) {
  return (
    <div className="max-md:[&_.page-hero]:sr-only max-md:[&_.page-hero-desc]:hidden">
      {children}
    </div>
  );
}
