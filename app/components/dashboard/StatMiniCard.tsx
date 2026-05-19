import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export default function StatMiniCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  trend: string;
  trendUp?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#232330] bg-[#11111A] px-4 py-3 shadow-[0px_8px_24px_rgba(0,0,0,0.35)]">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#1A1630] text-[#C4B5FD] ring-1 ring-[#8B5CF6]/25">
        <Icon className="size-5" strokeWidth={2} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[#71717A]">
          {label}
        </p>
        <p className="mt-0.5 text-[22px] font-bold leading-7 tracking-tight text-[#F5F5F7]">
          {value}
        </p>
        <p
          className={`text-[11px] font-medium ${trendUp !== false ? "text-emerald-400" : "text-red-400"}`}
        >
          {trend}
        </p>
      </div>
    </div>
  );
}
