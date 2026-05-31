"use client";

import { getMemberLabelByUserId } from "@/lib/collaboration/member-display";
import type { WorkspaceMember } from "@/lib/types/collaboration";

type AddedByLineProps = {
  userId?: string | null;
  members: WorkspaceMember[];
  className?: string;
};

export default function AddedByLine({ userId, members, className }: AddedByLineProps) {
  const name = getMemberLabelByUserId(members, userId);
  if (!name) return null;

  return (
    <span className={className ?? "text-xs text-[#71717A]"}>
      Added by {name}
    </span>
  );
}
