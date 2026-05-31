"use client";

import { buildAreaPath, buildSmoothLinePath, seriesToPoints } from "@/lib/ticket-sales/chart-paths";
import { SECTION_CARD, SECTION_CARD_PADDING, SECTION_TITLE } from "@/lib/ui/page-surfaces";
import type { SalesChartSeries } from "@/lib/ticket-sales/types";

type SalesChartsPanelProps = {
  series: SalesChartSeries;
  chartId: string;
};

function LineChart({
  title,
  values,
  gradientId,
  emptyLabel,
}: {
  title: string;
  values: number[];
  gradientId: string;
  emptyLabel: string;
}) {
  const width = 360;
  const height = 120;
  const points = seriesToPoints(values, width, height);
  const linePath = buildSmoothLinePath(points);
  const areaPath = buildAreaPath(linePath, width, height);

  return (
    <div className={[SECTION_CARD, SECTION_CARD_PADDING, "min-w-0"].join(" ")}>
      <h4 className={SECTION_TITLE}>{title}</h4>
      {values.length === 0 ? (
        <p className="mt-6 text-center text-[12px] text-[#71717A]">{emptyLabel}</p>
      ) : (
        <div className="relative mt-3 h-[120px] w-full overflow-hidden rounded-lg bg-[#0B0B10] ring-1 ring-[#232330]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
              </linearGradient>
              <linearGradient id={`${gradientId}-line`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6D28D9" />
                <stop offset="100%" stopColor="#A855F7" />
              </linearGradient>
            </defs>
            {areaPath ? <path d={areaPath} fill={`url(#${gradientId}-fill)`} /> : null}
            {linePath ? (
              <path
                d={linePath}
                fill="none"
                stroke={`url(#${gradientId}-line)`}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            ) : null}
          </svg>
        </div>
      )}
    </div>
  );
}

function TierBarChart({
  tiers,
}: {
  tiers: Array<{ name: string; sold: number; revenue: number }>;
}) {
  const max = Math.max(...tiers.map((t) => t.sold), 1);

  return (
    <div className={[SECTION_CARD, SECTION_CARD_PADDING, "min-w-0"].join(" ")}>
      <h4 className={SECTION_TITLE}>Sales by ticket tier</h4>
      {tiers.length === 0 ? (
        <p className="mt-6 text-center text-[12px] text-[#71717A]">
          Import a CSV with tier rows to see breakdown.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {tiers.map((tier) => (
            <li key={tier.name}>
              <div className="mb-1 flex justify-between text-[11px]">
                <span className="truncate text-[#E4E4E7]">{tier.name}</span>
                <span className="tabular-nums text-[#A1A1AA]">{tier.sold} sold</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#0B0B10] ring-1 ring-[#232330]">
                <div
                  className="h-full rounded-full bg-[#7C3AED]"
                  style={{ width: `${(tier.sold / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function VelocityChart({ points }: { points: Array<{ date: string; tickets: number }> }) {
  const values = points.map((p) => p.tickets);
  return (
    <LineChart
      title="Daily sales velocity"
      values={values}
      gradientId="velocity"
      emptyLabel="Add two or more checkpoints to calculate velocity."
    />
  );
}

export default function SalesChartsPanel({ series, chartId }: SalesChartsPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-[12px] lg:grid-cols-2">
      <LineChart
        title="Tickets sold over time"
        values={series.ticketsOverTime.map((p) => p.value)}
        gradientId={`${chartId}-tickets`}
        emptyLabel="No checkpoints yet."
      />
      <LineChart
        title="Revenue over time (net)"
        values={series.revenueOverTime.map((p) => p.net)}
        gradientId={`${chartId}-revenue`}
        emptyLabel="No revenue checkpoints yet."
      />
      <TierBarChart tiers={series.tierBreakdown} />
      <VelocityChart points={series.dailyVelocity} />
    </div>
  );
}
