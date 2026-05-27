"use client";

import Link from "next/link";
import * as React from "react";
import { AlertTriangle, Info, TrendingUp } from "lucide-react";

import RunMonthlyProfitBars from "@/app/components/run/RunMonthlyProfitBars";
import CurrencyText from "@/app/components/ui/CurrencyText";
import type { RunAlert, RunSnapshot } from "@/lib/run/run-insights";
import type { MonthPerformance } from "@/lib/run/run-performance";
import { SECTION_CARD, FIELD_LABEL } from "@/lib/ui/page-surfaces";

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

const VISIBLE_RISKS = 4;

type RunInsightsSidebarProps = {
  snapshot: RunSnapshot;
  alerts: RunAlert[];
  months: MonthPerformance[];
};

export default function RunInsightsSidebar({ snapshot, alerts, months }: RunInsightsSidebarProps) {
  const [showAllRisks, setShowAllRisks] = React.useState(false);
  const profitPositive = snapshot.projectedProfit >= 0;
  const visibleAlerts = showAllRisks ? alerts : alerts.slice(0, VISIBLE_RISKS);

  return (
    <aside className="space-y-2.5 lg:sticky lg:top-5 lg:self-start">
      <section
        className={[
          SECTION_CARD,
          "space-y-3 border-[#8B5CF6]/20 bg-gradient-to-b from-[#1A1630]/40 to-transparent p-4",
        ].join(" ")}
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-[#8B5CF6]" strokeWidth={2} aria-hidden />
          <h2 className="text-[15px] font-semibold text-[#F5F5F7]">Timeframe snapshot</h2>
        </div>

        <div className="rounded-lg border border-[#8B5CF6]/30 bg-[#1A1630]/60 px-3 py-3">
          <p className={FIELD_LABEL}>Projected P/L</p>
          <p
            className={[
              "mt-0.5 text-[26px] font-bold tabular-nums tracking-tight",
              profitPositive ? "text-emerald-400" : "text-[#FCA5A5]",
            ].join(" ")}
          >
            <CurrencyText value={snapshot.projectedProfit} />
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-2">
          {[
            { label: "Total shows", value: String(snapshot.totalShows) },
            {
              label: "Proj. attendance",
              value: snapshot.projectedAttendance.toLocaleString(),
            },
            { label: "Total revenue", value: <CurrencyText value={snapshot.totalRevenue} /> },
            { label: "Avg break-even", value: <CurrencyText value={snapshot.avgBreakEven} /> },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-[#232330] bg-[#0B0B10] px-2.5 py-2"
            >
              <dt className={FIELD_LABEL}>{item.label}</dt>
              <dd className="mt-0.5 text-[13px] font-semibold tabular-nums text-[#F5F5F7]">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={[SECTION_CARD, "p-3"].join(" ")}>
        <h2 className="text-[12px] font-semibold text-[#A1A1AA]">Monthly P/L</h2>
        <div className="mt-2 max-w-[280px]">
          <RunMonthlyProfitBars months={months} compact />
        </div>
      </section>

      <section className={[SECTION_CARD, "p-3"].join(" ")}>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-[#F5F5F7]">Operational risks</h2>
          {alerts.length > VISIBLE_RISKS ? (
            <button
              type="button"
              onClick={() => setShowAllRisks((v) => !v)}
              className="text-[10px] font-medium text-[#8B5CF6] hover:text-[#A855F7]"
            >
              {showAllRisks ? "Show less" : `View all (${alerts.length})`}
            </button>
          ) : null}
        </div>
        <ul className="space-y-1.5">
          {visibleAlerts.map((alert) => {
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
                className={["rounded-lg border bg-[#0B0B10] p-2", ALERT_BORDER[alert.tone]].join(
                  " ",
                )}
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
      </section>
    </aside>
  );
}
