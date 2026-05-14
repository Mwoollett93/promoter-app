const STORAGE_KEY = "promosync:wizard-finance-draft";

export type WizardFinanceCostItemV1 = {
  id: string;
  label: string;
  amount: number;
};

export type WizardFinanceTierV1 = {
  id: string;
  name: string;
  price: number;
  allocationPct: number;
  sellThroughPct: number;
};

export type WizardFinanceDraftV1 = {
  v: 1;
  ticketInventory: number;
  costs: WizardFinanceCostItemV1[];
  tiers: WizardFinanceTierV1[];
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseCostItem(raw: unknown): WizardFinanceCostItemV1 | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.label) || !isFiniteNumber(value.amount)) {
    return null;
  }

  return {
    id: value.id,
    label: value.label.trim(),
    amount: Math.max(0, Math.round(value.amount * 100) / 100),
  };
}

function parseTier(raw: unknown): WizardFinanceTierV1 | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.name) ||
    !isFiniteNumber(value.price) ||
    !isFiniteNumber(value.allocationPct) ||
    !isFiniteNumber(value.sellThroughPct)
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name.trim(),
    price: Math.max(0, Math.round(value.price * 100) / 100),
    allocationPct: Math.max(0, Math.round(value.allocationPct * 100) / 100),
    sellThroughPct: Math.max(0, Math.round(value.sellThroughPct * 100) / 100),
  };
}

export function loadWizardFinanceDraft(): WizardFinanceDraftV1 | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<WizardFinanceDraftV1>;
    if (
      parsed?.v !== 1 ||
      !isFiniteNumber(parsed.ticketInventory) ||
      !Array.isArray(parsed.costs) ||
      !Array.isArray(parsed.tiers)
    ) {
      return null;
    }

    const costs = parsed.costs.map(parseCostItem);
    const tiers = parsed.tiers.map(parseTier);
    if (costs.some((item) => item === null) || tiers.some((item) => item === null)) {
      return null;
    }

    return {
      v: 1,
      ticketInventory: Math.max(0, Math.round(parsed.ticketInventory)),
      costs: costs.filter((item): item is WizardFinanceCostItemV1 => item !== null),
      tiers: tiers.filter((item): item is WizardFinanceTierV1 => item !== null),
    };
  } catch {
    return null;
  }
}

export function saveWizardFinanceDraft(
  draft: Omit<WizardFinanceDraftV1, "v"> | WizardFinanceDraftV1
): void {
  if (typeof window === "undefined") return;

  const payload: WizardFinanceDraftV1 = {
    v: 1,
    ticketInventory: Math.max(0, Math.round(draft.ticketInventory)),
    costs: draft.costs
      .filter((item) => isNonEmptyString(item.id) && isNonEmptyString(item.label))
      .map((item) => ({
        id: item.id,
        label: item.label.trim(),
        amount: Math.max(0, Math.round(item.amount * 100) / 100),
      })),
    tiers: draft.tiers
      .filter((item) => isNonEmptyString(item.id) && isNonEmptyString(item.name))
      .map((item) => ({
        id: item.id,
        name: item.name.trim(),
        price: Math.max(0, Math.round(item.price * 100) / 100),
        allocationPct: Math.max(0, Math.round(item.allocationPct * 100) / 100),
        sellThroughPct: Math.max(0, Math.round(item.sellThroughPct * 100) / 100),
      })),
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}
