"use client";

import * as React from "react";

import { WIZARD_FLUSH_REQUEST } from "@/lib/event-wizard/persist-wizard-draft";

/** Run `onFlush` when the wizard header Save Draft / Close actions need current step state. */
export function useWizardFlush(onFlush: () => void) {
  const onFlushRef = React.useRef(onFlush);
  onFlushRef.current = onFlush;

  React.useEffect(() => {
    const handler = () => onFlushRef.current();
    window.addEventListener(WIZARD_FLUSH_REQUEST, handler);
    return () => window.removeEventListener(WIZARD_FLUSH_REQUEST, handler);
  }, []);
}
