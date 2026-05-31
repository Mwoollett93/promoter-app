"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ScrollFadeContainerProps = {
  children: React.ReactNode;
  className?: string;
  /** Card background the fade blends into. */
  fadeColor?: string;
};

/** Scrollable region with a subtle bottom fade when more content is below the fold. */
export default function ScrollFadeContainer({
  children,
  className,
  fadeColor = "#11111A",
}: ScrollFadeContainerProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [showFade, setShowFade] = React.useState(false);

  const updateFade = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const canScroll = el.scrollHeight > el.clientHeight + 2;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 6;
    setShowFade(canScroll && !atBottom);
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateFade();
    el.addEventListener("scroll", updateFade, { passive: true });
    const observer = new ResizeObserver(updateFade);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateFade);
      observer.disconnect();
    };
  }, [updateFade, children]);

  return (
    <div className={cn("relative min-h-0 flex-1", className)}>
      <div
        ref={scrollRef}
        className="h-full min-h-0 overflow-y-auto overscroll-contain pr-1"
      >
        {children}
      </div>
      {showFade ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-7"
          style={{
            background: `linear-gradient(to bottom, transparent 0%, ${fadeColor}CC 55%, ${fadeColor} 100%)`,
          }}
        />
      ) : null}
    </div>
  );
}
