import { Suspense } from "react";

import AddArtistPage from "@/app/components/artists/AddArtistPage";
import DashboardShell from "@/app/components/layout/DashboardShell";

export default function NewArtistPage() {
  return (
    <DashboardShell>
      <Suspense fallback={null}>
        <AddArtistPage />
      </Suspense>
    </DashboardShell>
  );
}
