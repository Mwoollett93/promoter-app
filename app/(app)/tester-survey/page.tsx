"use client";

import PageContent from "@/app/components/layout/PageContent";
import DashboardShell from "@/app/components/layout/DashboardShell";
import TesterSurveyForm from "@/app/components/beta/TesterSurveyForm";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { getStoredSession } from "@/lib/supabase/session-store";
import { PAGE_DESCRIPTION, PAGE_TITLE } from "@/lib/ui/page-surfaces";

export default function TesterSurveyPage() {
  const { workspace } = useWorkspace();
  const session = getStoredSession();

  return (
    <DashboardShell>
      <PageContent maxWidth={720}>
        <header>
          <h1 className={PAGE_TITLE}>Tester survey</h1>
          <p className={`${PAGE_DESCRIPTION} mt-2 max-w-xl`}>
            A short survey after you have explored the app. Your answers go directly to the
            PromoSync team.
          </p>
        </header>
        <div className="mt-8">
          <TesterSurveyForm workspaceId={workspace?.id} userId={session?.user.id} />
        </div>
      </PageContent>
    </DashboardShell>
  );
}
