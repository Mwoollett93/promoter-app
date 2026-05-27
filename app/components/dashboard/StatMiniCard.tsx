import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export default function StatMiniCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
  dense = false,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  trend: string;
  trendUp?: boolean;
  dense?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center rounded-xl border border-[#232330] bg-[#11111A] shadow-[0px_8px_24px_rgba(0,0,0,0.35)]",
        dense ? "gap-2 px-2.5 py-2" : "gap-3 px-4 py-3",
      ].join(" ")}
    >
      <div
        className={[
          "flex shrink-0 items-center justify-center rounded-lg bg-[#1A1630] text-[#C4B5FD] ring-1 ring-[#8B5CF6]/25",
          dense ? "size-8" : "size-11",
        ].join(" ")}
      >
        <Icon className={dense ? "size-4" : "size-5"} strokeWidth={2} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={[
            "font-medium uppercase tracking-wide text-[#71717A]",
            dense ? "text-[9px] leading-3" : "text-[11px]",
          ].join(" ")}
        >
          {label}
        </p>
        <p
          className={[
            "font-bold tracking-tight text-[#F5F5F7]",
            dense ? "text-[18px] leading-5" : "mt-0.5 text-[22px] leading-7",
          ].join(" ")}
        >
          {value}
        </p>
        <p
          className={[
            "truncate font-medium",
            dense ? "text-[10px]" : "text-[11px]",
            trendUp !== false ? "text-emerald-400" : "text-red-400",
          ].join(" ")}
        >
          {trend}
        </p>
      </div>
    </div>
  );
}
