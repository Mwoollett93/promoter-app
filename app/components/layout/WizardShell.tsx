"use client";

import * as React from "react";
import Sidebar from "./Sidebar";
import WizardHeader from "./WizardHeader";
import { SHELL_PADDING_X, SHELL_PADDING_Y } from "@/lib/layout/page-layout";
import { SettingsProvider } from "@/lib/settings/SettingsProvider";

type WizardShellProps = {
  children: React.ReactNode;
  title?: string;
};

export default function WizardShell({ children, title }: WizardShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  return (
    <SettingsProvider>
    <div className="h-screen overflow-hidden bg-[#0B0B10]">
      <div
        className="isolate grid h-full transition-[grid-template-columns] duration-300 ease-out"
        style={{ gridTemplateColumns: sidebarOpen ? "218px 1fr" : "72px 1fr" }}
      >
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />

        <section
          className={`relative z-0 box-border min-h-0 min-w-0 w-full overflow-x-hidden overflow-y-auto bg-[#0B0B10] ${SHELL_PADDING_X} ${SHELL_PADDING_Y}`}
        >
          {/* No mx-auto/max-w so content can fill to right edge */}
          <WizardHeader title={title} />
          {children}
        </section>
      </div>
    </div>
    </SettingsProvider>
  );
}
