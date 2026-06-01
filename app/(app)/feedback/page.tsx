"use client";

import PageContent from "@/app/components/layout/PageContent";
import DashboardShell from "@/app/components/layout/DashboardShell";
import BetaFeedbackForm from "@/app/components/beta/BetaFeedbackForm";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import { getStoredSession } from "@/lib/supabase/session-store";
import { PAGE_DESCRIPTION, PAGE_TITLE } from "@/lib/ui/page-surfaces";

export default function FeedbackPage() {
  const { workspace } = useWorkspace();
  const session = getStoredSession();

  return (
    <DashboardShell>
      <PageContent maxWidth={640}>
        <header>
          <h1 className={PAGE_TITLE}>Give feedback</h1>
          <p className={`${PAGE_DESCRIPTION} mt-2 max-w-xl`}>
            Help us improve PromoSync during the private beta. Bug reports, UX notes, and feature
            ideas are all welcome.
          </p>
        </header>
        <div className="mt-8">
          <BetaFeedbackForm
            workspaceId={workspace?.id}
            userId={session?.user.id}
          />
        </div>
      </PageContent>
    </DashboardShell>
  );
}
