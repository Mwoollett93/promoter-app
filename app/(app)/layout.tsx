"use client";

import { SettingsProvider } from "@/lib/settings/SettingsProvider";
import { WorkspaceProvider } from "@/lib/collaboration/WorkspaceContext";

export default function AuthenticatedAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <WorkspaceProvider>{children}</WorkspaceProvider>
    </SettingsProvider>
  );
}
