import { Suspense } from "react";

import AddVenuePage from "@/app/components/venues/AddVenuePage";
import DashboardShell from "@/app/components/layout/DashboardShell";

export default function NewVenuePage() {
  return (
    <DashboardShell>
      <Suspense fallback={null}>
        <AddVenuePage />
      </Suspense>
    </DashboardShell>
  );
}
