"use client";

import Link from "next/link";

import RunMonthlyProfitBars from "@/app/components/run/RunMonthlyProfitBars";
import ScrollFadeContainer from "@/app/components/ui/ScrollFadeContainer";
import type { RunAlert } from "@/lib/run/run-insights";
import type { MonthPerformance } from "@/lib/run/run-performance";
import { SECTION_CARD } from "@/lib/ui/page-surfaces";
import { AlertTriangle, Info } from "lucide-react";

const ALERT_ICON = {
  danger: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

const ALERT_BORDER = {
  danger: "border-red-500/20",
  warning: "border-amber-500/20",
  info: "border-[#8B5CF6]/20",
};

const ALERT_ICON_COLOR = {
  danger: "text-[#FCA5A5]",
  warning: "text-[#FCD34D]",
  info: "text-[#A78BFA]",
};

type RunInsightsSidebarProps = {
  alerts: RunAlert[];
  months: MonthPerformance[];
};

/** Right rail — monthly P/L and risks scroll internally to fit one viewport. */
export default function RunInsightsSidebar({ alerts, months }: RunInsightsSidebarProps) {
  return (
    <aside className="flex min-h-0 flex-col gap-3 lg:h-full">
      <section className={[SECTION_CARD, "flex min-h-0 flex-1 flex-col overflow-hidden p-3"].join(" ")}>
        <h2 className="shrink-0 text-[13px] font-semibold text-[#F5F5F7]">Monthly P/L</h2>
        <ScrollFadeContainer className="mt-2">
          <RunMonthlyProfitBars months={months} compact />
        </ScrollFadeContainer>
      </section>

      <section className={[SECTION_CARD, "flex min-h-0 flex-1 flex-col overflow-hidden p-3"].join(" ")}>
        <h2 className="shrink-0 text-[13px] font-semibold text-[#F5F5F7]">Operational risks</h2>
        {alerts.length === 0 ? (
          <p className="mt-2 text-[11px] text-[#71717A]">All clear — no risks flagged in this timeframe.</p>
        ) : (
          <ScrollFadeContainer className="mt-2">
            <ul className="space-y-1.5">
              {alerts.map((alert) => {
                const Icon = ALERT_ICON[alert.tone];
                const body = (
                  <div className="flex gap-2">
                    <Icon
                      className={["mt-0.5 size-3.5 shrink-0", ALERT_ICON_COLOR[alert.tone]].join(" ")}
                      strokeWidth={2}
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium leading-snug text-[#F5F5F7]">
                        {alert.title}
                      </p>
                      {alert.suggestedAction ? (
                        <p className="mt-1 text-[10px] leading-4 text-[#8B5CF6]">
                          Suggested: {alert.suggestedAction}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-[10px] text-[#71717A]">{alert.detail}</p>
                      )}
                    </div>
                  </div>
                );

                return (
                  <li
                    key={alert.id}
                    className={["rounded-lg border bg-[#0B0B10] p-2", ALERT_BORDER[alert.tone]].join(" ")}
                  >
                    {alert.eventId ? (
                      <Link
                        href={`/events/${alert.eventId}/workspace`}
                        className="block hover:opacity-90"
                      >
                        {body}
                      </Link>
                    ) : (
                      body
                    )}
                  </li>
                );
              })}
            </ul>
          </ScrollFadeContainer>
        )}
      </section>
    </aside>
  );
}
