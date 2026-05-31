"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

type ManagementDetailOverlayProps = {
  children: ReactNode;
  title?: string;
  onClose: () => void;
};

/** Full-screen detail below xl; inline grid column at xl+. */
export default function ManagementDetailOverlay({
  children,
  title,
  onClose,
}: ManagementDetailOverlayProps) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#0B0B10] xl:static xl:inset-auto xl:z-auto xl:bg-transparent">
      <header
        className="flex shrink-0 items-center gap-3 border-b border-[#232330] bg-[#11111A] px-4 py-3 xl:hidden"
        style={{ paddingTop: "max(0px, env(safe-area-inset-top))" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-[#E4E4E7] hover:bg-[#181824]"
          aria-label="Close detail"
        >
          <X className="size-5" aria-hidden />
        </button>
        {title ? (
          <h2 className="min-w-0 flex-1 truncate text-[16px] font-semibold text-[#F5F5F7]">{title}</h2>
        ) : null}
      </header>
      <div
        className="min-h-0 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)] xl:overflow-visible"
      >
        {children}
      </div>
    </div>
  );
}
