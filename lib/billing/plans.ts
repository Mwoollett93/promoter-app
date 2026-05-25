import type { AccountType } from "@/lib/settings/settings";

export type CheckoutPlanId = "professional" | "enterprise";

/** Shown on billing buttons (Stripe Checkout uses your Price IDs). */
export const CHECKOUT_PLAN_DISPLAY = {
  professional: { label: "Upgrade to Pro", priceHint: "$49 / month" },
  enterprise: { label: "Enterprise", priceHint: "from $99 / month" },
} as const;

export const CHECKOUT_PLANS: Record<
  CheckoutPlanId,
  { settingsPlan: AccountType; label: string; priceEnv: string }
> = {
  professional: {
    settingsPlan: "Professional",
    label: "Professional (Pro)",
    priceEnv: "STRIPE_PRICE_PROFESSIONAL",
  },
  enterprise: {
    settingsPlan: "Enterprise",
    label: "Enterprise (Collective)",
    priceEnv: "STRIPE_PRICE_ENTERPRISE",
  },
};

/**
 * When true, swaps which Stripe Price ID maps to Pro vs Enterprise (fixes reversed Vercel env vars).
 * Prefer swapping STRIPE_PRICE_PROFESSIONAL and STRIPE_PRICE_ENTERPRISE in Vercel instead.
 */
function effectiveCheckoutPlanId(planId: CheckoutPlanId): CheckoutPlanId {
  if (process.env.STRIPE_SWAP_PLAN_PRICES?.trim() === "true") {
    return planId === "professional" ? "enterprise" : "professional";
  }
  return planId;
}

export function stripePriceIdForPlan(planId: CheckoutPlanId): string | null {
  const resolved = effectiveCheckoutPlanId(planId);
  const envName = CHECKOUT_PLANS[resolved].priceEnv;
  return process.env[envName]?.trim() || null;
}

export function planFromStripePriceId(priceId: string): AccountType {
  const swap = process.env.STRIPE_SWAP_PLAN_PRICES?.trim() === "true";
  const pro = process.env.STRIPE_PRICE_PROFESSIONAL?.trim();
  const ent = process.env.STRIPE_PRICE_ENTERPRISE?.trim();
  if (priceId && priceId === ent) return swap ? "Professional" : "Enterprise";
  if (priceId && priceId === pro) return swap ? "Enterprise" : "Professional";
  return "Professional";
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}
