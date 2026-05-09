"use client";

import * as React from "react";
import Sidebar from "./Sidebar";
import WizardHeader from "./WizardHeader";

type WizardShellProps = {
  children: React.ReactNode;
  title?: string;
};

export default function WizardShell({ children, title }: WizardShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  return (
    <div className="min-h-screen bg-[#0B0B10]">
      <div
        className="grid min-h-screen transition-[grid-template-columns] duration-300 ease-out"
        style={{ gridTemplateColumns: sidebarOpen ? "218px 1fr" : "72px 1fr" }}
      >
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />

        <section className="min-w-0 bg-[#0B0B10]">
          {/* No mx-auto/max-w so content can fill to right edge */}
          <div className="h-full px-5 py-5">
            <WizardHeader title={title} />
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}