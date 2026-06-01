"use client";

import { isBetaMode } from "@/lib/beta/config";
import BetaFeedbackFab from "@/app/components/beta/BetaFeedbackFab";

export default function BetaShell() {
  if (!isBetaMode()) return null;
  return <BetaFeedbackFab />;
}
