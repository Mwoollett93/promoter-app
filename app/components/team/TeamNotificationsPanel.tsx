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
  embedded?: boolean;
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
  embedded = false,
}: TeamNotificationsPanelProps) {
  const visible = limit != null ? items.slice(0, limit) : items;
  const hiddenCount = limit != null ? Math.max(0, items.length - limit) : 0;

  return (
    <section
      className={[
        embedded
          ? "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#232330] bg-[#11111A] p-3 shadow-[0px_8px_24px_rgba(0,0,0,0.35)]"
          : [SECTION_CARD, SECTION_CARD_PADDING].join(" "),
        "flex h-full min-h-0 flex-col overflow-hidden",
      ].join(" ")}
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell className={embedded ? "size-3.5 text-[#8B5CF6]" : "size-4 text-[#8B5CF6]"} strokeWidth={2} aria-hidden />
          <h2 className={embedded ? "text-[13px] font-semibold text-[#F5F5F7]" : SECTION_TITLE}>
            Operational alerts
          </h2>
        </div>
        {hiddenCount > 0 && onViewAll ? (
          <button type="button" onClick={onViewAll} className={LINK_ACCENT}>
            View all ({items.length})
          </button>
        ) : null}
      </div>
      {visible.length === 0 ? (
        <p className={embedded ? "mt-2 text-[11px] text-[#71717A]" : "mt-3 text-[13px] text-[#71717A]"}>
          All clear — no urgent workspace alerts.
        </p>
      ) : (
        <ul
          className={[
            "min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1",
            embedded ? "mt-2 space-y-1.5" : "mt-3 space-y-[12px]",
          ].join(" ")}
        >
          {visible.map((item) => {
            const Icon = TONE_ICON[item.tone];
            const content = (
              <div
                className={[
                  embedded ? "flex gap-2 rounded-md border border-[#232330] bg-[#0B0B10] p-2" : [SECTION_CARD_INNER, "flex gap-2.5 p-2.5"].join(" "),
                ].join(" ")}
              >
                <Icon className={["mt-0.5 shrink-0", embedded ? "size-3" : "size-3.5", TONE_ICON_CLASS[item.tone]].join(" ")} />
                <div className="min-w-0">
                  <p className={embedded ? "text-[11px] font-medium text-[#F5F5F7]" : "text-[12px] font-medium text-[#F5F5F7]"}>
                    {item.title}
                  </p>
                  <p
                    className={[
                      "line-clamp-2 text-[#71717A]",
                      embedded ? "text-[10px] leading-3" : "mt-0.5 text-[11px] leading-4",
                    ].join(" ")}
                  >
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
