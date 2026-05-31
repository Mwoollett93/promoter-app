"use client";

import * as React from "react";

const MOBILE_MAX = 767;
const DESKTOP_NAV_MIN = 768;
const LARGE_DESKTOP_MIN = 1024;

function createMediaQuery(query: string) {
  if (typeof window === "undefined") return null;
  return window.matchMedia(query);
}

function subscribe(query: string, callback: () => void) {
  const mq = createMediaQuery(query);
  if (!mq) return () => {};
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getMatches(query: string, fallback: boolean) {
  const mq = createMediaQuery(query);
  return mq?.matches ?? fallback;
}

/** Viewports below 768px — mobile drawer nav. */
export function useIsMobile(defaultValue = false) {
  const [isMobile, setIsMobile] = React.useState(() =>
    getMatches(`(max-width: ${MOBILE_MAX}px)`, defaultValue),
  );

  React.useEffect(() => {
    const mq = createMediaQuery(`(max-width: ${MOBILE_MAX}px)`);
    if (!mq) return;
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMobile;
}

/** Viewports 768px and up — persistent sidebar rail. */
export function useIsDesktopNav(defaultValue = true) {
  const [isDesktop, setIsDesktop] = React.useState(() =>
    getMatches(`(min-width: ${DESKTOP_NAV_MIN}px)`, defaultValue),
  );

  React.useEffect(() => {
    return subscribe(`(min-width: ${DESKTOP_NAV_MIN}px)`, () =>
      setIsDesktop(getMatches(`(min-width: ${DESKTOP_NAV_MIN}px)`, true)),
    );
  }, []);

  return isDesktop;
}

/** Viewports 1024px and up — viewport-lock dashboards. */
export function useIsLargeDesktop(defaultValue = true) {
  const [isLarge, setIsLarge] = React.useState(() =>
    getMatches(`(min-width: ${LARGE_DESKTOP_MIN}px)`, defaultValue),
  );

  React.useEffect(() => {
    return subscribe(`(min-width: ${LARGE_DESKTOP_MIN}px)`, () =>
      setIsLarge(getMatches(`(min-width: ${LARGE_DESKTOP_MIN}px)`, true)),
    );
  }, []);

  return isLarge;
}
