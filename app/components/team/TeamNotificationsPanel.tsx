"use client";

import Link from "next/link";
import { AlertTriangle, Bell, Info } from "lucide-react";

import type { TeamNotificationItem } from "@/lib/team/team-notifications";
import {
  LINK_ACCENT,
  SECTION_CARD,
  SECTION_CARD_PADDING,
  SECTION_CARD_INNER,
  SECTION_TITLE,
} from "@/lib/ui/page-surfaces";

type TeamNotificationsPanelProps = {
  items: TeamNotificationItem[];
  limit?: number;
  onViewAll?: () => void;
};

const TONE_ICON = {
  danger: AlertTriangle,
  warning: Bell,
  info: Info,
};

const TONE_ICON_CLASS = {
  danger: "text-[#FCA5A5]",
  warning: "text-[#FCD34D]",
  info: "text-[#A78BFA]",
};

export default function TeamNotificationsPanel({
  items,
  limit,
  onViewAll,
}: TeamNotificationsPanelProps) {
  const visible = limit != null ? items.slice(0, limit) : items;
  const hiddenCount = limit != null ? Math.max(0, items.length - limit) : 0;

  return (
    <section className={[SECTION_CARD, SECTION_CARD_PADDING].join(" ")}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-[#8B5CF6]" strokeWidth={2} aria-hidden />
          <h2 className={SECTION_TITLE}>Operational alerts</h2>
        </div>
        {hiddenCount > 0 && onViewAll ? (
          <button type="button" onClick={onViewAll} className={LINK_ACCENT}>
            View all ({items.length})
          </button>
        ) : null}
      </div>
      {visible.length === 0 ? (
        <p className="mt-3 text-[13px] text-[#71717A]">All clear — no urgent workspace alerts.</p>
      ) : (
        <ul className="mt-3 space-y-[12px]">
          {visible.map((item) => {
            const Icon = TONE_ICON[item.tone];
            const content = (
              <div className={[SECTION_CARD_INNER, "flex gap-2.5 p-2.5"].join(" ")}>
                <Icon className={["mt-0.5 size-3.5 shrink-0", TONE_ICON_CLASS[item.tone]].join(" ")} />
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-[#F5F5F7]">{item.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-[#71717A]">
                    {item.detail}
                  </p>
                </div>
              </div>
            );
            return (
              <li key={item.id}>
                {item.href ? (
                  <Link href={item.href} className="block transition-opacity hover:opacity-90">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
