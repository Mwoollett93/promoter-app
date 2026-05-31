import { NextResponse } from "next/server";

import {
  CHECKOUT_PLANS,
  isStripeConfigured,
  stripePriceIdForPlan,
  type CheckoutPlanId,
} from "@/lib/billing/plans";
import { getStripe } from "@/lib/billing/stripe";
import { getWorkspaceBilling, upsertWorkspaceBilling } from "@/lib/billing/workspace-billing";
import { assertSameOrigin } from "@/lib/security/origin-check";
import { getBearerToken, getUserFromAccessToken } from "@/lib/supabase/server-user";

function appOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const originBlock = assertSameOrigin(request);
  if (originBlock) return originBlock;

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY and price IDs to your environment." },
      { status: 503 },
    );
  }

  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromAccessToken(accessToken);
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as { workspaceId?: string; planId?: CheckoutPlanId };
    const workspaceId = body.workspaceId?.trim();
    const planId = body.planId;

    if (!workspaceId || !planId || !CHECKOUT_PLANS[planId]) {
      return NextResponse.json({ error: "workspaceId and valid planId are required." }, { status: 400 });
    }

    const priceId = stripePriceIdForPlan(planId);
    if (!priceId) {
      return NextResponse.json(
        { error: `Missing ${CHECKOUT_PLANS[planId].priceEnv} in environment.` },
        { status: 503 },
      );
    }

    const stripe = getStripe();
    const origin = appOrigin(request);
    let billing = await getWorkspaceBilling(workspaceId);

    let customerId = billing?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { workspace_id: workspaceId, user_id: user.id },
      });
      customerId = customer.id;
      await upsertWorkspaceBilling({
        workspaceId,
        stripeCustomerId: customerId,
        plan: "Starter",
        status: "inactive",
      });
      billing = await getWorkspaceBilling(workspaceId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId!,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/settings?tab=billing&checkout=success`,
      cancel_url: `${origin}/settings?tab=billing&checkout=canceled`,
      metadata: { workspace_id: workspaceId, plan_id: planId },
      subscription_data: {
        metadata: { workspace_id: workspaceId, plan_id: planId },
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Unable to create checkout session." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
