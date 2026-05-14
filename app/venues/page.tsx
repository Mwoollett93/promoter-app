import DashboardShell from "@/app/components/layout/DashboardShell";
import VenueManagementPage from "@/app/components/venues/VenueManagementPage";

export default function VenuesPage() {
  return (
    <DashboardShell>
      <VenueManagementPage />
    </DashboardShell>
  );
}
