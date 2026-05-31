"use client";

import Lenis from "lenis";
import * as React from "react";

import { usePrefersReducedMotion } from "@/app/components/marketing/landing/usePrefersReducedMotion";

type LenisContextValue = {
  lenis: Lenis | null;
  /** Current scroll position — used for hero parallax when Lenis is active. */
  scroll: number;
};

const LenisContext = React.createContext<LenisContextValue>({
  lenis: null,
  scroll: 0,
});

export function useLandingScroll() {
  return React.useContext(LenisContext);
}

type LenisProviderProps = {
  children: React.ReactNode;
};

/**
 * Smooth scroll for marketing pages via Lenis.
 * Skipped entirely when prefers-reduced-motion is set — native scroll remains.
 */
export default function LenisProvider({ children }: LenisProviderProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [scroll, setScroll] = React.useState(0);
  const [disableLenis, setDisableLenis] = React.useState(false);
  const lenisRef = React.useRef<Lenis | null>(null);

  React.useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 767px)");
    const mqCoarse = window.matchMedia("(pointer: coarse)");
    const update = () => setDisableLenis(mqMobile.matches || mqCoarse.matches);
    update();
    mqMobile.addEventListener("change", update);
    mqCoarse.addEventListener("change", update);
    return () => {
      mqMobile.removeEventListener("change", update);
      mqCoarse.removeEventListener("change", update);
    };
  }, []);

  React.useEffect(() => {
    if (reducedMotion || disableLenis) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    lenisRef.current = lenis;

    lenis.on("scroll", ({ scroll: nextScroll }: { scroll: number }) => {
      setScroll(nextScroll);
    });

    let frame = 0;
    function raf(time: number) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    }
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion, disableLenis]);

  React.useEffect(() => {
    if (reducedMotion || disableLenis) return;
    document.documentElement.classList.add("lenis", "lenis-smooth");
    return () => {
      document.documentElement.classList.remove("lenis", "lenis-smooth");
    };
  }, [reducedMotion, disableLenis]);

  const value = React.useMemo(
    () => ({ lenis: lenisRef.current, scroll }),
    [scroll],
  );

  return <LenisContext.Provider value={value}>{children}</LenisContext.Provider>;
}
