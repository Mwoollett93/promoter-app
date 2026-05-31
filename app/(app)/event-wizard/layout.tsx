import type { ReactNode } from "react";
import WizardShell from "@/app/components/layout/WizardShell";

export default function EventWizardLayout({ children }: { children: ReactNode }) {
  return <WizardShell title="Create New Event">{children}</WizardShell>;
}