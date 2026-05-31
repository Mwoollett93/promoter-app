import { Suspense } from "react";

import DashboardShell from "@/app/components/layout/DashboardShell";
import SettingsPage from "@/app/components/settings/SettingsPage";

function SettingsLoading() {
  return (
    <div className="mx-auto w-full max-w-[1180px] py-10 text-[14px] text-[#A1A1AA]">Loading settings...</div>
  );
}

export default function SettingsRoutePage() {
  return (
    <DashboardShell>
      <Suspense fallback={<SettingsLoading />}>
        <SettingsPage />
      </Suspense>
    </DashboardShell>
  );
}
