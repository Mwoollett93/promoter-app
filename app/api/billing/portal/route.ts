import { NextResponse } from "next/server";

import { getStripe } from "@/lib/billing/stripe";
import { getWorkspaceBilling } from "@/lib/billing/workspace-billing";
import { isStripeConfigured } from "@/lib/billing/plans";
import { getBearerToken, getUserFromAccessToken } from "@/lib/supabase/server-user";

function appOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromAccessToken(accessToken);
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as { workspaceId?: string };
    const workspaceId = body.workspaceId?.trim();
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
    }

    const billing = await getWorkspaceBilling(workspaceId);
    if (!billing?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account yet. Subscribe to a plan first." },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const origin = appOrigin(request);
    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripe_customer_id,
      return_url: `${origin}/settings?tab=billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Portal session failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
