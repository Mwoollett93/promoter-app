import type { AccountType } from "@/lib/settings/settings";

export type CheckoutPlanId = "professional" | "enterprise";

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

export function stripePriceIdForPlan(planId: CheckoutPlanId): string | null {
  const envName = CHECKOUT_PLANS[planId].priceEnv;
  return process.env[envName]?.trim() || null;
}

export function planFromStripePriceId(priceId: string): AccountType {
  const pro = process.env.STRIPE_PRICE_PROFESSIONAL?.trim();
  const ent = process.env.STRIPE_PRICE_ENTERPRISE?.trim();
  if (priceId && priceId === ent) return "Enterprise";
  if (priceId && priceId === pro) return "Professional";
  return "Professional";
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}
