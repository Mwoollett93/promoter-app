"use client";

import * as React from "react";
import Sidebar from "./Sidebar";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  return (
    <div className="min-h-screen bg-[#0B0B10]">
      <div
        className="isolate grid min-h-screen transition-[grid-template-columns] duration-300 ease-out"
        style={{ gridTemplateColumns: sidebarOpen ? "218px 1fr" : "72px 1fr" }}
      >
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />

        <section className="relative z-0 min-w-0 overflow-x-hidden bg-[#0B0B10]">
          <div className="h-full px-5 py-5">{children}</div>
        </section>
      </div>
    </div>
  );
}
