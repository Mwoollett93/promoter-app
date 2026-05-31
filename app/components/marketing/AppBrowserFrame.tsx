import type { ReactNode } from "react";

type AppBrowserFrameProps = {
  path: string;
  children: ReactNode;
  className?: string;
  minHeight?: string;
};

/** Browser chrome + optional sidebar gutter — matches in-app shell. */
export default function AppBrowserFrame({
  path,
  children,
  className = "",
  minHeight = "min-h-[320px]",
}: AppBrowserFrameProps) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border border-[#232330] bg-[#0B0B10]",
        "shadow-[0px_30px_80px_rgba(0,0,0,0.55)] ring-1 ring-[#8B5CF6]/20",
        minHeight,
        className,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -left-20 -top-20 size-64 rounded-full bg-[#7C3AED]/20 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-16 -right-10 size-72 rounded-full bg-[#4C1D95]/25 blur-[90px]" />

      <div className="relative flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-[#232330] bg-[#11111A] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-[#3F3F46]" />
            <span className="size-2.5 rounded-full bg-[#3F3F46]" />
            <span className="size-2.5 rounded-full bg-[#3F3F46]" />
          </div>
          <span className="ml-2 truncate text-[11px] font-medium uppercase tracking-[0.12em] text-[#71717A]">
            promosync.app{path}
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
