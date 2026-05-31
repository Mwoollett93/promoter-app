"use client";

import { SoftGlowLoader, SearchingEllipsisText } from "@/app/components/ui/SoftGlowLoader";
import { PAGE_EYEBROW } from "@/lib/ui/page-surfaces";

type WorkspaceLoadingScreenProps = {
  message?: string;
};

export default function WorkspaceLoadingScreen({
  message = "Loading workspace",
}: WorkspaceLoadingScreenProps) {
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0B0B10]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_42%_at_50%_44%,rgba(124,58,237,0.14),transparent_72%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_35%_28%_at_50%_58%,rgba(139,92,246,0.06),transparent_70%)]"
      />

      <div className="relative flex flex-col items-center gap-6 px-6">
        <SoftGlowLoader className="size-[76px] rounded-lg">
          <div className="flex size-full items-center justify-center rounded-[calc(0.5rem-1px)] bg-[#11111A]">
            <img
              src="/Promosync_icon.svg"
              alt=""
              width={44}
              height={44}
              className="size-11 shrink-0 object-contain brightness-0 invert"
            />
          </div>
        </SoftGlowLoader>

        <div className="text-center">
          <p className="text-[22px] font-bold leading-7 tracking-tight text-[#F5F5F7]">PromoSync</p>
          <p className={`mt-1 ${PAGE_EYEBROW}`}>Promoter OS</p>
        </div>

        <SearchingEllipsisText message={message} className="text-[14px] leading-5 text-[#A1A1AA]" />

        <div className="h-1 w-44 overflow-hidden rounded-full bg-[#232330]">
          <div className="promosync-loader-shimmer h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent" />
        </div>
      </div>
    </main>
  );
}
