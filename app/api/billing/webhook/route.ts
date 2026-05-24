import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { planFromStripePriceId } from "@/lib/billing/plans";
import { getStripe } from "@/lib/billing/stripe";
import {
  getWorkspaceBillingByCustomerId,
  upsertWorkspaceBilling,
} from "@/lib/billing/workspace-billing";

export const runtime = "nodejs";

async function syncSubscription(subscription: Stripe.Subscription) {
  const workspaceId =
    subscription.metadata?.workspace_id ||
    (await getWorkspaceBillingByCustomerId(String(subscription.customer)))?.workspace_id;

  if (!workspaceId) return;

  const priceId = subscription.items.data[0]?.price?.id ?? "";
  const plan = planFromStripePriceId(priceId);

  await upsertWorkspaceBilling({
    workspaceId,
    stripeCustomerId: String(subscription.customer),
    stripeSubscriptionId: subscription.id,
    plan,
    status: subscription.status,
    currentPeriodEnd:
      "current_period_end" in subscription && typeof subscription.current_period_end === "number"
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured." }, { status: 503 });
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature." }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId = session.metadata?.workspace_id;
        if (workspaceId && session.customer) {
          await upsertWorkspaceBilling({
            workspaceId,
            stripeCustomerId: String(session.customer),
            status: "active",
          });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler failed.";
    console.error("[stripe webhook]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
