import DashboardShell from "@/app/components/layout/DashboardShell";
import TasksPageContent from "@/app/components/tasks/TasksPageContent";

export default function TasksPage() {
  return (
    <DashboardShell>
      <TasksPageContent />
    </DashboardShell>
  );
}
