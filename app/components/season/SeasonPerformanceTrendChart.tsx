"use client";

import * as React from "react";

import CurrencyText from "@/app/components/ui/CurrencyText";
import type { TrendMonthPoint } from "@/lib/season/season-insights";

type SeasonPerformanceTrendChartProps = {
  months: TrendMonthPoint[];
};

export default function SeasonPerformanceTrendChart({ months }: SeasonPerformanceTrendChartProps) {
  const [hovered, setHovered] = React.useState<number | null>(null);

  if (months.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[#3F3F46] py-6 text-center text-[11px] text-[#52525B]">
        No monthly data yet
      </p>
    );
  }

  const width = 280;
  const height = 88;
  const padX = 8;
  const padY = 10;

  const values = months.map((m) => m.profit);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const points = months.map((m, index) => {
    const x =
      months.length === 1
        ? width / 2
        : padX + (index / (months.length - 1)) * (width - padX * 2);
    const y = height - padY - ((m.profit - min) / range) * (height - padY * 2);
    return { x, y, month: m };
  });

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `M${padX},${height - padY} L ${line} L ${width - padX},${height - padY} Z`;
  const zeroY =
    min < 0 && max > 0
      ? height - padY - ((0 - min) / range) * (height - padY * 2)
      : null;

  const active = hovered != null ? months[hovered] : null;

  return (
    <div>
      {active ? (
        <div className="mb-2 flex items-center justify-between rounded-md border border-[#232330] bg-[#0B0B10] px-2.5 py-1.5 text-[11px]">
          <span className="font-medium text-[#E4E4E7]">{active.label}</span>
          <span
            className={[
              "font-semibold tabular-nums",
              active.profit >= 0 ? "text-emerald-400" : "text-[#FCA5A5]",
            ].join(" ")}
          >
            <CurrencyText value={active.profit} />
          </span>
        </div>
      ) : (
        <p className="mb-2 text-[10px] text-[#52525B]">Hover a point for monthly P/L</p>
      )}

      <div className="relative rounded-lg bg-[#0B0B10] ring-1 ring-[#232330]">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[88px] w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="season-trend-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {zeroY != null ? (
            <line
              x1={padX}
              y1={zeroY}
              x2={width - padX}
              y2={zeroY}
              stroke="#3F3F46"
              strokeDasharray="4 3"
            />
          ) : null}
          <path d={area} fill="url(#season-trend-area)" />
          <polyline
            points={line}
            fill="none"
            stroke="#A855F7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((p, i) => (
            <g key={p.month.monthKey}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hovered === i ? 5 : 3.5}
                fill={p.month.profit >= 0 ? "#10B981" : "#EF4444"}
                stroke="#11111A"
                strokeWidth="1.5"
                className="cursor-pointer"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            </g>
          ))}
        </svg>
        <div className="flex justify-between border-t border-[#232330] px-2 py-1.5">
          {months.map((m) => (
            <span key={m.monthKey} className="text-[9px] font-medium text-[#71717A]">
              {m.shortLabel}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
