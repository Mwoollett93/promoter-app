"use client";

import * as React from "react";

type SoftGlowLoaderProps = {
  children: React.ReactNode;
  className?: string;
};

/** Subtle rotating glow on the outer border only (not inside the panel). */
export function SoftGlowLoader({ children, className = "" }: SoftGlowLoaderProps) {
  return (
    <div className={`promosync-border-glow-wrap ${className}`}>
      <div className="promosync-border-glow-inner">{children}</div>
    </div>
  );
}

/** Cycles "Searching for artist profiles" + 1–3 trailing dots. */
export function SearchingEllipsisText({
  text = "Searching for artist profiles",
  className = "",
}: {
  text?: string;
  className?: string;
}) {
  const [dotCount, setDotCount] = React.useState(1);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setDotCount((current) => (current % 3) + 1);
    }, 450);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <span className={className}>
      {text}
      <span className="inline-block w-[1.1em] text-left" aria-hidden>
        {".".repeat(dotCount)}
      </span>
      <span className="sr-only">, please wait</span>
    </span>
  );
}
