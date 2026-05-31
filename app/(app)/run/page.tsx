import RunPageContent from "@/app/components/run/RunPageContent";
import DashboardShell from "@/app/components/layout/DashboardShell";

export const metadata = {
  title: "Run Overview | PromoSync",
};

export default function RunPage() {
  return (
    <DashboardShell>
      <RunPageContent />
    </DashboardShell>
  );
}
