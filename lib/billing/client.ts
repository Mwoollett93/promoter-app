import { BETA_PAYMENTS_DISABLED_MESSAGE, paymentsDisabledInBeta } from "@/lib/beta/config";
import type { CheckoutPlanId } from "@/lib/billing/plans";
import { getStoredSession } from "@/lib/supabase/browser";

function authHeaders() {
  const session = getStoredSession();
  if (!session?.accessToken) throw new Error("Sign in required.");
  return {
    Authorization: `Bearer ${session.accessToken}`,
    "Content-Type": "application/json",
  };
}

export async function fetchBillingStatus(workspaceId: string) {
  const response = await fetch(
    `/api/billing/status?workspaceId=${encodeURIComponent(workspaceId)}`,
    { headers: authHeaders() },
  );
  const payload = (await response.json()) as { error?: string; billing?: unknown; stripeConfigured?: boolean };
  if (!response.ok) throw new Error(payload.error ?? "Unable to load billing.");
  return payload;
}

export async function startCheckout(workspaceId: string, planId: CheckoutPlanId) {
  if (paymentsDisabledInBeta()) {
    throw new Error(BETA_PAYMENTS_DISABLED_MESSAGE);
  }
  const response = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ workspaceId, planId }),
  });
  const payload = (await response.json()) as { error?: string; url?: string };
  if (!response.ok) throw new Error(payload.error ?? "Checkout failed.");
  if (!payload.url) throw new Error("Missing checkout URL.");
  window.location.href = payload.url;
}

export async function openBillingPortal(workspaceId: string) {
  if (paymentsDisabledInBeta()) {
    throw new Error(BETA_PAYMENTS_DISABLED_MESSAGE);
  }
  const response = await fetch("/api/billing/portal", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ workspaceId }),
  });
  const payload = (await response.json()) as { error?: string; url?: string };
  if (!response.ok) throw new Error(payload.error ?? "Unable to open billing portal.");
  if (!payload.url) throw new Error("Missing portal URL.");
  window.location.href = payload.url;
}
