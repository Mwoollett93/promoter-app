"use client";

import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  LayoutDashboard,
  MapPin,
  Menu,
  Music2,
  Settings,
  Wallet,
} from "lucide-react";

type SidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
};

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Events", icon: CalendarDays, active: true },
  { label: "Venues", icon: MapPin },
  { label: "Artists", icon: Music2 },
  { label: "Tasks", icon: CheckSquare },
  { label: "Reports", icon: BarChart3 },
  { label: "Finance", icon: Wallet },
  { label: "Settings", icon: Settings },
];

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  return (
    <aside className="h-screen border-r border-[#71717A] bg-[#11111A] shadow-[0px_10px_40px_0px_rgba(0,0,0,0.4)]">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 px-3 py-3">
          <button
            type="button"
            onClick={onToggle}
            className="flex h-9 w-9 items-center justify-center rounded-md text-[#A1A1AA] hover:bg-[#181824] hover:text-[#F5F5F7]"
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>

          {isOpen && (
            <div className="min-w-0">
              <p className="truncate text-[18px] leading-6 font-semibold text-[#F5F5F7]">PromoSync</p>
              <p className="truncate text-[12px] leading-4 text-[#7C3AED]">Promoter OS</p>
            </div>
          )}
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                className={[
                  "flex w-full items-center rounded-md px-3 py-2 text-left text-[14px] leading-5 transition-colors",
                  item.active
                    ? "bg-[#1A1630] text-[#F5F5F7]"
                    : "text-[#A1A1AA] hover:bg-[#181824] hover:text-[#F5F5F7]",
                  isOpen ? "justify-start gap-3" : "justify-center",
                ].join(" ")}
              >
                <Icon size={16} className="shrink-0" />
                {isOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[#181824] p-2">
          <button
            type="button"
            className={[
              "flex w-full items-center rounded-md border border-[#3F3F46] bg-[#0F0F17] p-2",
              isOpen ? "justify-between" : "justify-center",
            ].join(" ")}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-full bg-[#2A2A38]" />
              {isOpen && (
                <div className="min-w-0 text-left">
                  <p className="truncate text-[12px] leading-4 text-[#F5F5F7]">Alex Carter</p>
                  <p className="truncate text-[11px] leading-4 text-[#7C3AED]">Admin</p>
                </div>
              )}
            </div>
            {isOpen && <ChevronDown size={14} className="text-[#A1A1AA]" />}
          </button>
        </div>
      </div>
    </aside>
  );
}