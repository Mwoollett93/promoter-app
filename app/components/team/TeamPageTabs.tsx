"use client";

import { TEAM_TABS, type TeamTabId } from "@/lib/team/team-tabs";

type TeamPageTabsProps = {
  active: TeamTabId;
  onChange: (tab: TeamTabId) => void;
};

export default function TeamPageTabs({ active, onChange }: TeamPageTabsProps) {
  return (
    <nav
      className="flex gap-1 overflow-x-auto rounded-lg border border-[#232330] bg-[#11111A] p-1"
      aria-label="Team sections"
    >
      {TEAM_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={[
            "shrink-0 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
            active === tab.id
              ? "bg-[#1A1630] text-[#C4B5FD] ring-1 ring-[#8B5CF6]/25"
              : "text-[#71717A] hover:text-[#A1A1AA]",
          ].join(" ")}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
