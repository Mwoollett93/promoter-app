"use client";

import type { PresenceState } from "@/lib/team/presence";

const TONE: Record<PresenceState, string> = {
  online: "bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.6)]",
  idle: "bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.45)]",
  offline: "bg-[#52525B]",
};

type PresenceIndicatorProps = {
  state: PresenceState;
  activity?: string;
  showLabel?: boolean;
};

export default function PresenceIndicator({
  state,
  activity,
  showLabel = false,
}: PresenceIndicatorProps) {
  return (
    <span className="inline-flex items-center gap-1.5" title={activity}>
      <span className={["size-2 rounded-full", TONE[state]].join(" ")} aria-hidden />
      {showLabel ? (
        <span className="text-[10px] capitalize text-[#71717A]">{state}</span>
      ) : null}
    </span>
  );
}
