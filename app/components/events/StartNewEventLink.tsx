"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { resetEventWizardForNewEvent } from "@/lib/event-wizard/reset-wizard";

type StartNewEventLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href?: string;
};

export default function StartNewEventLink({
  href = "/event-wizard/event-basics",
  onClick,
  ...props
}: StartNewEventLinkProps) {
  return (
    <Link
      href={href}
      {...props}
      onClick={(event) => {
        resetEventWizardForNewEvent();
        onClick?.(event);
      }}
    />
  );
}

/** Call before `router.push("/event-wizard/...")` when starting a new event. */
export function beginNewEventWizard() {
  resetEventWizardForNewEvent();
}
