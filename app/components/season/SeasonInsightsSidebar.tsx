"use client";

import { AlertTriangle, Info, TrendingUp } from "lucide-react";

import CurrencyText from "@/app/components/ui/CurrencyText";
import type { SeasonAlert, SeasonSnapshot } from "@/lib/season/season-insights";
import { SECTION_CARD, SECTION_CARD_PADDING, FIELD_LABEL } from "@/lib/ui/page-surfaces";

function TrendChart({ values }: { values: number[] }) {
  const width = 280;
  const height = 72;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const points = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  });

  const line = points.join(" ");
  const area = `M0,${height} L ${line} L ${width},${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[72px] w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="season-trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#season-trend-fill)" />
      <polyline
        points={line}
        fill="none"
        stroke="#A855F7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ALERT_ICON = {
  danger: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

const ALERT_COLOR = {
  danger: "text-[#FCA5A5]",
  warning: "text-[#FCD34D]",
  info: "text-[#A78BFA]",
};

type SeasonInsightsSidebarProps = {
  snapshot: SeasonSnapshot;
  alerts: SeasonAlert[];
  trendValues: number[];
  targetProfit?: number;
};

export default function SeasonInsightsSidebar({
  snapshot,
  alerts,
  trendValues,
  targetProfit,
}: SeasonInsightsSidebarProps) {
  const profitPositive = snapshot.projectedProfit >= 0;

  return (
    <aside className="space-y-3 lg:sticky lg:top-5 lg:self-start">
      <section className={[SECTION_CARD, SECTION_CARD_PADDING, "space-y-4"].join(" ")}>
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-[#8B5CF6]" strokeWidth={2} aria-hidden />
          <h2 className="text-[14px] font-semibold text-[#F5F5F7]">Season snapshot</h2>
        </div>

        <div className="rounded-lg border border-[#8B5CF6]/25 bg-[#1A1630]/50 px-3 py-3">
          <p className={FIELD_LABEL}>Projected P/L</p>
          <p
            className={[
              "mt-0.5 text-[22px] font-bold tabular-nums tracking-tight",
              profitPositive ? "text-emerald-400" : "text-[#FCA5A5]",
            ].join(" ")}
          >
            <CurrencyText value={snapshot.projectedProfit} />
          </p>
          {targetProfit != null ? (
            <p className="mt-1 text-[11px] text-[#71717A]">
              Target <CurrencyText value={targetProfit} />
            </p>
          ) : null}
        </div>

        <dl className="grid grid-cols-2 gap-3">
          {[
            { label: "Total shows", value: String(snapshot.totalShows) },
            {
              label: "Proj. attendance",
              value: snapshot.projectedAttendance.toLocaleString(),
            },
            { label: "Avg capacity", value: snapshot.avgCapacity.toLocaleString() },
            {
              label: "Profit margin",
              value: `${snapshot.profitMarginPct}%`,
            },
            {
              label: "Total revenue",
              value: <CurrencyText value={snapshot.totalRevenue} />,
            },
            {
              label: "Avg break-even",
              value: <CurrencyText value={snapshot.avgBreakEven} />,
            },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-[#232330] bg-[#0B0B10] px-2.5 py-2">
              <dt className={FIELD_LABEL}>{item.label}</dt>
              <dd className="mt-0.5 text-[14px] font-semibold tabular-nums text-[#F5F5F7]">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={[SECTION_CARD, SECTION_CARD_PADDING].join(" ")}>
        <h2 className="text-[14px] font-semibold text-[#F5F5F7]">Performance trend</h2>
        <p className="mt-0.5 text-[11px] text-[#71717A]">Monthly projected profit</p>
        <div className="mt-3 rounded-lg bg-[#0B0B10] ring-1 ring-[#232330]">
          <TrendChart values={trendValues.length > 0 ? trendValues : [0, 0]} />
        </div>
      </section>

      <section className={[SECTION_CARD, SECTION_CARD_PADDING].join(" ")}>
        <h2 className="text-[14px] font-semibold text-[#F5F5F7]">Operational risks</h2>
        <ul className="mt-3 space-y-2">
          {alerts.map((alert) => {
            const Icon = ALERT_ICON[alert.tone];
            return (
              <li
                key={alert.id}
                className="flex gap-2 rounded-lg border border-[#232330] bg-[#0B0B10] p-2.5"
              >
                <Icon
                  className={["mt-0.5 size-3.5 shrink-0", ALERT_COLOR[alert.tone]].join(" ")}
                  strokeWidth={2}
                />
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-[#F5F5F7]">{alert.title}</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-[#71717A]">{alert.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
}
