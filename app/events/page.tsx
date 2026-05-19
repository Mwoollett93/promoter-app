import EventManagementPage from "@/app/components/events/EventManagementPage";
import DashboardShell from "@/app/components/layout/DashboardShell";

export default function EventsPage() {
  return (
    <DashboardShell>
      <EventManagementPage />
    </DashboardShell>
  );
}
