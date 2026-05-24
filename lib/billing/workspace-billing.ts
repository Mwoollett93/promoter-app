import type { AccountType } from "@/lib/settings/settings";
import { serviceRest } from "@/lib/supabase/service";

export type WorkspaceBillingRow = {
  workspace_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: AccountType;
  status: string;
  current_period_end: string | null;
};

export async function getWorkspaceBilling(workspaceId: string): Promise<WorkspaceBillingRow | null> {
  const rows = await serviceRest<WorkspaceBillingRow[]>(
    `workspace_billing?workspace_id=eq.${workspaceId}&select=*`,
  );
  return rows[0] ?? null;
}

export async function upsertWorkspaceBilling(input: {
  workspaceId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  plan?: AccountType;
  status?: string;
  currentPeriodEnd?: string | null;
}) {
  const existing = await getWorkspaceBilling(input.workspaceId);
  const body = {
    workspace_id: input.workspaceId,
    stripe_customer_id: input.stripeCustomerId ?? existing?.stripe_customer_id ?? null,
    stripe_subscription_id: input.stripeSubscriptionId ?? existing?.stripe_subscription_id ?? null,
    plan: input.plan ?? existing?.plan ?? "Starter",
    status: input.status ?? existing?.status ?? "inactive",
    current_period_end: input.currentPeriodEnd ?? existing?.current_period_end ?? null,
  };

  if (existing) {
    await serviceRest(`workspace_billing?workspace_id=eq.${input.workspaceId}`, {
      method: "PATCH",
      body,
      prefer: "return=minimal",
    });
  } else {
    await serviceRest("workspace_billing", {
      method: "POST",
      body,
      prefer: "return=minimal",
    });
  }
}

export async function getWorkspaceBillingByCustomerId(
  customerId: string,
): Promise<WorkspaceBillingRow | null> {
  const rows = await serviceRest<WorkspaceBillingRow[]>(
    `workspace_billing?stripe_customer_id=eq.${encodeURIComponent(customerId)}&select=*`,
  );
  return rows[0] ?? null;
}
