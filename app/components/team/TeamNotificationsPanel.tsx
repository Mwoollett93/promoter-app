"use client";

import Link from "next/link";
import { AlertTriangle, Bell, Info } from "lucide-react";

import type { TeamNotificationItem } from "@/lib/team/team-notifications";

type TeamNotificationsPanelProps = {
  items: TeamNotificationItem[];
};

const TONE_ICON = {
  danger: AlertTriangle,
  warning: Bell,
  info: Info,
};

const TONE_CLASS = {
  danger: "border-[#7F1D1D]/40 bg-[#450A0A]/20 text-[#FCA5A5]",
  warning: "border-[#78350F]/40 bg-[#422006]/30 text-[#FCD34D]",
  info: "border-[#312E81]/40 bg-[#1E1B4B]/30 text-[#A5B4FC]",
};

export default function TeamNotificationsPanel({ items }: TeamNotificationsPanelProps) {
  return (
    <section className="rounded-xl border border-[#232330]/90 bg-gradient-to-b from-[#14141F]/95 to-[#0F0F17] p-4">
      <div className="flex items-center gap-2">
        <Bell className="size-4 text-[#A78BFA]" />
        <h2 className="text-[14px] font-semibold text-[#F5F5F7]">Operational alerts</h2>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-[12px] text-[#71717A]">All clear — no urgent workspace alerts.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => {
            const Icon = TONE_ICON[item.tone];
            const inner = (
              <div
                className={[
                  "rounded-lg border px-3 py-2.5 transition-colors",
                  TONE_CLASS[item.tone],
                  item.href ? "hover:brightness-110" : "",
                ].join(" ")}
              >
                <div className="flex gap-2">
                  <Icon className="mt-0.5 size-3.5 shrink-0" />
                  <div>
                    <p className="text-[12px] font-semibold">{item.title}</p>
                    <p className="mt-0.5 text-[11px] opacity-90">{item.detail}</p>
                  </div>
                </div>
              </div>
            );
            return (
              <li key={item.id}>
                {item.href ? <Link href={item.href}>{inner}</Link> : inner}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
