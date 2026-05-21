"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CalendarPlus,
  ChevronDown,
  CreditCard,
  Globe,
  LayoutDashboard,
  LogOut,
  MapPin,
  Mic2,
  PanelLeftOpen,
  PanelRightOpen,
  Plug,
  Settings,
  Shield,
  User,
  UserCog,
  Users,
} from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSettings } from "@/lib/settings/SettingsProvider";
import type { SettingsTabId } from "@/lib/settings/settings";
import { signOutOfSupabase } from "@/lib/supabase/browser";

type SidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
};

type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string | null;
};

const mainNavItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Events", icon: CalendarPlus, href: "/events" },
  { label: "Venues", icon: MapPin, href: "/venues" },
  { label: "Artists", icon: Mic2, href: "/artists" },
];

const settingsNavItem: NavItem = {
  label: "Settings",
  icon: Settings,
  href: "/settings",
};

type ProfileMenuItem = {
  id: SettingsTabId;
  label: string;
  icon: LucideIcon;
  href: string;
};

const profileMenuItems: ProfileMenuItem[] = [
  { id: "profile", label: "Profile", icon: User, href: "/settings" },
  { id: "account", label: "Account", icon: UserCog, href: "/settings?tab=account" },
  { id: "team", label: "Team", icon: Users, href: "/settings?tab=team" },
  { id: "notifications", label: "Notifications", icon: Bell, href: "/settings?tab=notifications" },
  { id: "billing", label: "Billing", icon: CreditCard, href: "/settings?tab=billing" },
  { id: "integrations", label: "Integrations", icon: Plug, href: "/settings?tab=integrations" },
  { id: "security", label: "Security", icon: Shield, href: "/settings?tab=security" },
  { id: "preferences", label: "Preferences", icon: Globe, href: "/settings?tab=preferences" },
];

const labelTransition =
  "truncate whitespace-nowrap transition-[max-width,opacity] duration-300 ease-out";

function isNavItemActive(label: string, pathname: string | null): boolean {
  if (pathname === null) return false;

  switch (label) {
    case "Dashboard":
      return pathname.startsWith("/dashboard");
    case "Events":
      return pathname.startsWith("/events") || pathname.startsWith("/event-wizard");
    case "Venues":
      return pathname.startsWith("/venues");
    case "Artists":
      return pathname.startsWith("/artists");
    case "Settings":
      return pathname.startsWith("/settings");
    default:
      return false;
  }
}

function navItemClassName(active: boolean) {
  return [
    "flex w-full min-w-0 items-center justify-start gap-3 rounded-lg py-2.5 pl-3 pr-2 text-left text-[14px] font-medium leading-5 transition-colors",
    active
      ? "bg-[#2D2640] text-[#F5F5F7] shadow-[inset_0_0_0_1px_rgba(139,92,246,0.25)]"
      : "text-[#E4E4E7] hover:bg-[#181824] hover:text-[#F5F5F7]",
  ].join(" ");
}

function labelClassName(isOpen: boolean) {
  return [labelTransition, isOpen ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"].join(" ");
}

function ProfileMenu({
  isOpen,
  fullName,
  role,
  avatarUrl,
  onSignOut,
}: {
  isOpen: boolean;
  fullName: string;
  role: string;
  avatarUrl: string;
  onSignOut: () => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const avatar = (
    <div
      className="h-9 w-9 shrink-0 rounded-full bg-cover bg-center ring-2 ring-[#232330]"
      style={{ backgroundImage: `url(${avatarUrl})` }}
      aria-hidden
    />
  );

  const menuContent = (
    <PopoverContent
      side="top"
      align={isOpen ? "end" : "start"}
      sideOffset={8}
      className="z-50 w-[220px] border border-[#232330] bg-[#11111A] p-1.5 text-[#F5F5F7] shadow-[0px_12px_40px_rgba(0,0,0,0.55)]"
    >
      <nav className="flex flex-col gap-0.5" aria-label="Account menu">
        {profileMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-[#E4E4E7] transition-colors hover:bg-[#181824] hover:text-[#F5F5F7]"
            >
              <Icon className="size-4 shrink-0 text-[#A1A1AA]" strokeWidth={2} aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="my-1.5 h-px bg-[#232330]" role="separator" />
      <button
        type="button"
        onClick={() => {
          setMenuOpen(false);
          onSignOut();
        }}
        className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] font-medium text-[#F87171] transition-colors hover:bg-[#7F1D1D]/25 hover:text-[#FCA5A5]"
      >
        <LogOut className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        Logout
      </button>
    </PopoverContent>
  );

  if (!isOpen) {
    return (
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-14 w-full items-center justify-center rounded-lg border border-transparent transition-colors hover:bg-[#181824]"
            aria-label="Open account menu"
            title="Account menu"
          >
            {avatar}
          </button>
        </PopoverTrigger>
        {menuContent}
      </Popover>
    );
  }

  return (
    <Popover open={menuOpen} onOpenChange={setMenuOpen}>
      <div
        className={[
          "flex h-14 w-full min-w-0 items-center gap-2 rounded-lg border border-[#3F3F46] bg-[#0F0F17] px-2.5 py-2.5 transition-[border-color] duration-300 ease-out",
          menuOpen ? "border-[#52525B]" : "hover:border-[#52525B]",
        ].join(" ")}
      >
        <Link
          href="/settings"
          className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-md outline-none ring-[#8B5CF6]/40 focus-visible:ring-2"
          title="Profile settings"
        >
          {avatar}
          <div className="min-w-0 overflow-hidden text-left">
            <p className="truncate text-[13px] font-semibold leading-4 text-[#F5F5F7]">{fullName}</p>
            <p className="truncate text-[11px] leading-4 text-[#8B5CF6]">{role}</p>
          </div>
        </Link>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-[#A1A1AA] transition-colors hover:bg-[#181824] hover:text-[#F5F5F7]"
            aria-label="Open account menu"
            aria-expanded={menuOpen}
          >
            <ChevronDown
              size={16}
              className={`shrink-0 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
              strokeWidth={2}
              aria-hidden
            />
          </button>
        </PopoverTrigger>
      </div>
      {menuContent}
    </Popover>
  );
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = useSettings();

  async function handleSignOut() {
    await signOutOfSupabase();
    router.replace("/login");
  }

  function renderNavItem(item: NavItem) {
    const Icon = item.icon;
    const active = isNavItemActive(item.label, pathname);
    const className = navItemClassName(active);
    const labels = labelClassName(isOpen);

    if (item.href) {
      return (
        <Link key={item.label} href={item.href} className={className} title={item.label}>
          <Icon size={18} className="shrink-0 opacity-95" strokeWidth={2} aria-hidden />
          <span className={labels} aria-hidden={!isOpen}>
            {item.label}
          </span>
        </Link>
      );
    }

    return (
      <button
        key={item.label}
        type="button"
        className={className}
        title="Coming soon"
        onClick={() => {}}
      >
        <Icon size={18} className="shrink-0 opacity-95" strokeWidth={2} aria-hidden />
        <span className={labels} aria-hidden={!isOpen}>
          {item.label}
        </span>
      </button>
    );
  }

  function renderCollapseToggle() {
    const Icon = isOpen ? PanelLeftOpen : PanelRightOpen;

    return (
      <div className="flex w-full justify-end pt-1">
        <button
          type="button"
          onClick={onToggle}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#A1A1AA] transition-colors hover:bg-[#181824] hover:text-[#F5F5F7]"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <Icon size={18} className="shrink-0 opacity-95" strokeWidth={2} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <aside className="sticky top-0 z-20 h-screen w-full min-w-0 self-start overflow-hidden border-r border-[#232330] bg-[#11111A] shadow-[0px_10px_40px_0px_rgba(0,0,0,0.4)]">
      <div className="flex h-full min-w-0 flex-col">
        <div className="px-3 pb-2 pt-4">
          <div className="flex min-w-0 items-start gap-3">
            <Link
              href="/dashboard"
              className="flex shrink-0 items-center justify-center rounded-lg outline-none ring-[#8B5CF6]/40 transition hover:opacity-90 focus-visible:ring-2"
              aria-label="PromoSync dashboard"
            >
              <img
                src="/Promosync_icon.svg"
                alt=""
                width={40}
                height={40}
                className="size-10 shrink-0 object-contain brightness-0 invert"
              />
            </Link>

            <div
              className={[
                "min-w-0 flex-1 overflow-hidden pt-0.5 transition-[max-width,opacity] duration-300 ease-out",
                isOpen ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0",
              ].join(" ")}
              aria-hidden={!isOpen}
            >
              <p className="truncate text-[18px] font-bold leading-6 tracking-tight text-[#F5F5F7]">
                PromoSync
              </p>
              <p className="truncate text-[12px] leading-4 text-[#8B5CF6]">Promoter OS</p>
            </div>
          </div>
        </div>

        <nav className="mt-1 flex min-w-0 flex-1 flex-col space-y-1 overflow-hidden px-3" aria-label="Main">
          {mainNavItems.map(renderNavItem)}

          {renderNavItem(settingsNavItem)}
          {renderCollapseToggle()}
        </nav>

        <div className="min-w-0 shrink-0 border-t border-[#232330] p-3">
          <ProfileMenu
            isOpen={isOpen}
            fullName={settings.profile.fullName}
            role={settings.profile.role}
            avatarUrl={settings.profile.avatarUrl}
            onSignOut={() => void handleSignOut()}
          />
        </div>
      </div>
    </aside>
  );
}
