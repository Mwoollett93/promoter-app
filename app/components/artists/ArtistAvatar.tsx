"use client";

import * as React from "react";
import { UserRound } from "lucide-react";

import { isDisplayableArtistImageUrl } from "@/lib/ai/artist-image";

type ArtistAvatarProps = {
  name: string;
  imageUrl?: string;
  size?: number;
  className?: string;
};

export default function ArtistAvatar({ name, imageUrl, size = 72, className = "" }: ArtistAvatarProps) {
  const [failed, setFailed] = React.useState(false);
  const safeUrl = isDisplayableArtistImageUrl(imageUrl) ? imageUrl : undefined;
  const showImage = Boolean(safeUrl) && !failed;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  React.useEffect(() => {
    setFailed(false);
  }, [safeUrl]);

  return (
    <div
      className={[
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#232330] bg-[#0B0B10]",
        className,
      ].join(" ")}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <img
          src={safeUrl}
          alt=""
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center text-[#71717A]">
          {initials ? (
            <span className="text-[18px] font-semibold text-[#C4B5FD]">{initials}</span>
          ) : (
            <UserRound className="size-6" aria-hidden />
          )}
        </div>
      )}
    </div>
  );
}
