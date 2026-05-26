"use client";

import { ROLE_BADGE_TONES, TEAM_ROLE_LABELS } from "@/lib/team/role-display";
import type { WorkspaceRole } from "@/lib/types/collaboration";

type RoleBadgeProps = {
  role: WorkspaceRole;
  size?: "sm" | "md";
  title?: string;
};

export default function RoleBadge({ role, size = "sm", title }: RoleBadgeProps) {
  const tone = ROLE_BADGE_TONES[role];
  return (
    <span
      title={title}
      className={[
        "inline-flex items-center rounded-full border font-semibold uppercase tracking-wide",
        tone.border,
        tone.bg,
        tone.text,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
      ].join(" ")}
    >
      {TEAM_ROLE_LABELS[role]}
    </span>
  );
}
