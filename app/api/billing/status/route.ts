import { NextResponse } from "next/server";

import { getWorkspaceBilling } from "@/lib/billing/workspace-billing";
import { getBearerToken, getUserFromAccessToken } from "@/lib/supabase/server-user";

export async function GET(request: Request) {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromAccessToken(accessToken);
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspaceId = new URL(request.url).searchParams.get("workspaceId")?.trim();
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
    }

    const billing = await getWorkspaceBilling(workspaceId);
    return NextResponse.json({
      billing: billing
        ? {
            plan: billing.plan,
            status: billing.status,
            currentPeriodEnd: billing.current_period_end,
            hasCustomer: Boolean(billing.stripe_customer_id),
            hasSubscription: Boolean(billing.stripe_subscription_id),
          }
        : { plan: "Starter", status: "inactive", hasCustomer: false, hasSubscription: false },
      stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to load billing.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
