"use client";

import type { LucideIcon } from "lucide-react";

type WorkspaceStatCardProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: string;
};

export default function WorkspaceStatCard({
  label,
  value,
  icon: Icon,
  tone = "text-[#F5F5F7]",
}: WorkspaceStatCardProps) {
  return (
    <div className="rounded-xl border border-[#232330]/90 bg-gradient-to-b from-[#14141F] to-[#0F0F17] px-3 py-2.5 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] transition-all hover:border-[#3F3F46] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-2">
        <Icon className={`size-3.5 shrink-0 ${tone}`} strokeWidth={2} />
        <span className="text-[10px] font-medium uppercase tracking-wide text-[#71717A]">
          {label}
        </span>
      </div>
      <p className={`mt-1 text-[20px] font-semibold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
