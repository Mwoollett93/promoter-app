import ArtistManagementPage from "@/app/components/artists/ArtistManagementPage";
import DashboardShell from "@/app/components/layout/DashboardShell";

export default function ArtistsPage() {
  return (
    <DashboardShell>
      <ArtistManagementPage />
    </DashboardShell>
  );
}
