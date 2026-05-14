"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  CalendarPlus,
  ChevronDown,
  LayoutDashboard,
  MapPin,
  Menu,
  Mic2,
  Settings,
} from "lucide-react";

type SidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
};

type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string | null;
};

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Events", icon: CalendarPlus, href: "/event-wizard/event-basics" },
  { label: "Venues", icon: MapPin, href: null },
  { label: "Artists", icon: Mic2, href: "/artists" },
  { label: "Settings", icon: Settings, href: null },
];

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="relative z-20 h-screen border-r border-[#232330] bg-[#11111A] shadow-[0px_10px_40px_0px_rgba(0,0,0,0.4)]">
      <div className="flex h-full flex-col">
        {/* Brand — logo from `public/Promosync_icon.svg` */}
        <div
          className={`flex gap-3 px-3 pb-2 pt-4 ${isOpen ? "items-start" : "flex-col items-center"}`}
        >
          <Link
            href="/"
            className="flex shrink-0 items-center justify-center rounded-lg outline-none ring-[#8B5CF6]/40 transition hover:opacity-90 focus-visible:ring-2"
            aria-label="PromoSync home"
          >
            <img
              src="/Promosync_icon.svg"
              alt=""
              width={40}
              height={40}
              className="size-10 shrink-0 object-contain brightness-0 invert"
            />
          </Link>

          {isOpen ? (
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="truncate text-[18px] font-bold leading-6 tracking-tight text-[#F5F5F7]">
                PromoSync
              </p>
              <p className="truncate text-[12px] leading-4 text-[#8B5CF6]">Promoter OS</p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onToggle}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#A1A1AA] hover:bg-[#181824] hover:text-[#F5F5F7] ${
              isOpen ? "mt-0.5" : "hidden"
            }`}
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <Menu size={18} />
          </button>
        </div>

        {!isOpen ? (
          <div className="flex justify-center px-2 pb-2">
            <button
              type="button"
              onClick={onToggle}
              className="flex h-9 w-9 items-center justify-center rounded-md text-[#A1A1AA] hover:bg-[#181824] hover:text-[#F5F5F7]"
              aria-label="Expand sidebar"
            >
              <Menu size={18} />
            </button>
          </div>
        ) : null}

        <nav className="mt-1 flex-1 space-y-1 px-2" aria-label="Main">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isDashboard = item.label === "Dashboard";
            const isEvents = item.label === "Events";
            const isArtists = item.label === "Artists";
            const active =
              (isDashboard && pathname === "/") ||
              (isEvents && pathname !== null && pathname.startsWith("/event-wizard")) ||
              (isArtists && pathname !== null && pathname.startsWith("/artists"));

            const className = [
              "flex w-full items-center rounded-lg px-3 py-2.5 text-left text-[14px] font-medium leading-5 transition-colors",
              active
                ? "bg-[#2D2640] text-[#F5F5F7] shadow-[inset_0_0_0_1px_rgba(139,92,246,0.25)]"
                : "text-[#E4E4E7] hover:bg-[#181824] hover:text-[#F5F5F7]",
              isOpen ? "justify-start gap-3" : "justify-center px-2",
            ].join(" ");

            if (item.href) {
              return (
                <Link key={item.label} href={item.href} className={className}>
                  <Icon size={18} className="shrink-0 opacity-95" strokeWidth={2} aria-hidden />
                  {isOpen ? <span>{item.label}</span> : null}
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
                {isOpen ? <span>{item.label}</span> : null}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[#232330] p-2">
          <button
            type="button"
            className={[
              "flex w-full items-center rounded-lg border border-[#3F3F46] bg-[#0F0F17] p-2.5 transition-colors hover:border-[#52525B]",
              isOpen ? "justify-between gap-2" : "justify-center",
            ].join(" ")}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className="h-9 w-9 shrink-0 rounded-full bg-cover bg-center ring-2 ring-[#232330]"
                style={{
                  backgroundImage:
                    "url(https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=96&q=80)",
                }}
                aria-hidden
              />
              {isOpen ? (
                <div className="min-w-0 text-left">
                  <p className="truncate text-[13px] font-semibold leading-4 text-[#F5F5F7]">
                    Alex Carter
                  </p>
                  <p className="truncate text-[11px] leading-4 text-[#8B5CF6]">Admin</p>
                </div>
              ) : null}
            </div>
            {isOpen ? <ChevronDown size={16} className="shrink-0 text-[#A1A1AA]" aria-hidden /> : null}
          </button>
        </div>
      </div>
    </aside>
  );
}
