"use client";

import Link from "next/link";
import { AlertTriangle, Bell, Info } from "lucide-react";

import type { TeamNotificationItem } from "@/lib/team/team-notifications";
import {
  SECTION_CARD,
  SECTION_CARD_PADDING,
  SECTION_CARD_INNER,
  SECTION_TITLE,
} from "@/lib/ui/page-surfaces";

type TeamNotificationsPanelProps = {
  items: TeamNotificationItem[];
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

export default function TeamNotificationsPanel({ items }: TeamNotificationsPanelProps) {
  return (
    <section className={[SECTION_CARD, SECTION_CARD_PADDING].join(" ")}>
      <div className="flex items-center gap-2">
        <Bell className="size-4 text-[#8B5CF6]" strokeWidth={2} aria-hidden />
        <h2 className={SECTION_TITLE}>Operational alerts</h2>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-[13px] text-[#71717A]">All clear — no urgent workspace alerts.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => {
            const Icon = TONE_ICON[item.tone];
            const content = (
              <div className={[SECTION_CARD_INNER, "flex gap-3 p-3"].join(" ")}>
                <Icon className={["mt-0.5 size-4 shrink-0", TONE_ICON_CLASS[item.tone]].join(" ")} />
                <div>
                  <p className="text-[13px] font-medium text-[#F5F5F7]">{item.title}</p>
                  <p className="mt-0.5 text-[12px] leading-5 text-[#A1A1AA]">{item.detail}</p>
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
