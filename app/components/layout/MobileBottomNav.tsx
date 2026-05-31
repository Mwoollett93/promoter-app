"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  MOBILE_PRIMARY_TABS,
  MOBILE_TAB_BAR_CLASS,
  resolveMobileTab,
} from "@/lib/layout/mobile-nav";
import { cn } from "@/lib/utils";

type MobileBottomNavProps = {
  onMorePress: () => void;
};

export default function MobileBottomNav({ onMorePress }: MobileBottomNavProps) {
  const pathname = usePathname();
  const activeTab = resolveMobileTab(pathname);

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-[#232330] bg-[#11111A]/95 backdrop-blur-md md:hidden",
        MOBILE_TAB_BAR_CLASS,
      )}
      aria-label="Main"
    >
      <ul className="flex h-14 items-stretch">
        {MOBILE_PRIMARY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.id === "more") {
            return (
              <li key={tab.id} className="flex flex-1">
                <button
                  type="button"
                  onClick={onMorePress}
                  className={tabClass(isActive)}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="size-5 shrink-0" strokeWidth={isActive ? 2.25 : 2} aria-hidden />
                  <span>{tab.label}</span>
                </button>
              </li>
            );
          }

          return (
            <li key={tab.id} className="flex flex-1">
              <Link
                href={tab.href!}
                className={tabClass(isActive)}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="size-5 shrink-0" strokeWidth={isActive ? 2.25 : 2} aria-hidden />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function tabClass(active: boolean) {
  return cn(
    "flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium leading-none transition-colors",
    active ? "text-[#C4B5FD]" : "text-[#71717A] hover:text-[#A1A1AA]",
  );
}
