import DashboardPageContent from "@/app/components/dashboard/DashboardPageContent";
import DashboardShell from "@/app/components/layout/DashboardShell";

export default function DashboardPage() {
  return (
    <DashboardShell viewportLock>
      <DashboardPageContent />
    </DashboardShell>
  );
}
