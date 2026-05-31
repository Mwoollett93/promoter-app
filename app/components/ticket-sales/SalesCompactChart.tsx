"use client";

import {
  buildAreaPath,
  buildSmoothLinePath,
  normalizeChartValues,
  seriesToPoints,
} from "@/lib/ticket-sales/chart-paths";
import { SECTION_CARD, SECTION_TITLE } from "@/lib/ui/page-surfaces";
import { cn } from "@/lib/utils";

type SalesCompactChartProps = {
  title: string;
  values: number[];
  gradientId: string;
  emptyLabel: string;
  className?: string;
  height?: number;
  /** When true, omit outer card chrome (for nested panels). */
  embedded?: boolean;
};

export default function SalesCompactChart({
  title,
  values,
  gradientId,
  emptyLabel,
  className,
  height = 72,
  embedded = false,
}: SalesCompactChartProps) {
  const width = 320;
  const chartHeight = height;
  const hasData = values.length > 0;
  const chartValues = normalizeChartValues(values);
  const points = seriesToPoints(chartValues, width, chartHeight);
  const linePath = buildSmoothLinePath(points);
  const areaPath = buildAreaPath(linePath, width, chartHeight);

  return (
    <section
      className={cn(
        embedded ? "flex min-h-0 flex-col" : SECTION_CARD,
        !embedded && "p-3",
        "flex min-h-0 flex-col",
        className,
      )}
    >
      <h4 className={SECTION_TITLE}>{title}</h4>
      {!hasData ? (
        <p className="mt-2 flex flex-1 items-center text-[11px] text-[#71717A]">{emptyLabel}</p>
      ) : (
        <div
          className="relative mt-2 min-h-0 flex-1 overflow-hidden rounded-lg bg-[#0B0B10] ring-1 ring-[#232330]"
          style={{ minHeight: chartHeight }}
        >
          <svg
            viewBox={`0 0 ${width} ${chartHeight}`}
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
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
                strokeLinejoin="round"
              />
            ) : null}
          </svg>
        </div>
      )}
    </section>
  );
}
