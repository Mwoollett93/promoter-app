"use client";

import * as React from "react";

import { memberInitials } from "@/lib/tasks/task-board-utils";

type MemberAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
  textClassName?: string;
};

export default function MemberAvatar({
  name,
  avatarUrl,
  size = 44,
  className = "",
  textClassName = "",
}: MemberAvatarProps) {
  const [failed, setFailed] = React.useState(false);
  const safeUrl = avatarUrl?.trim() || undefined;
  const showImage = Boolean(safeUrl) && !failed;

  React.useEffect(() => {
    setFailed(false);
  }, [safeUrl]);

  return (
    <div
      className={[
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#3F3F46] bg-[#1A1630] font-bold text-[#C4B5FD]",
        className,
      ].join(" ")}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {showImage ? (
        <img
          src={safeUrl}
          alt=""
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={textClassName || (size <= 32 ? "text-[9px]" : size <= 40 ? "text-[11px]" : "text-[13px]")}>
          {memberInitials(name)}
        </span>
      )}
    </div>
  );
}
