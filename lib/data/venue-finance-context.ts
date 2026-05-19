import { getStoredSession, getSupabaseConfig } from "@/lib/supabase/browser";

export type VenueFinanceContext = {
  venueId?: string;
  venueName?: string;
  venueCapacity?: number;
  venueHireFee?: number;
  securityRequired?: boolean;
  equipmentProvided?: boolean;
};

type VenueFinanceRow = {
  id: string;
  name: string;
  max_capacity: number | null;
  hire_fee_cents: number | null;
  security_required: boolean | null;
  equipment_provided: boolean | null;
};

async function readSupabaseError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as {
      message?: string;
      error_description?: string;
      hint?: string;
    };
    return data.message ?? data.error_description ?? data.hint ?? fallback;
  } catch {
    return fallback;
  }
}

export async function loadVenueFinanceContext(venueId: string): Promise<VenueFinanceContext> {
  if (!venueId || venueId.startsWith("seed-")) return {};

  const session = getStoredSession();
  const config = getSupabaseConfig();
  if (!session || !config) return {};

  const response = await fetch(
    `${config.url}/rest/v1/venues?select=id,name,max_capacity,hire_fee_cents,security_required,equipment_provided&id=eq.${venueId}&limit=1`,
    {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(await readSupabaseError(response, "Unable to load venue finance details."));
  }

  const rows = (await response.json()) as VenueFinanceRow[];
  const venue = rows[0];
  if (!venue) return {};

  return {
    venueId: venue.id,
    venueName: venue.name,
    venueCapacity: venue.max_capacity ?? 0,
    venueHireFee: venue.hire_fee_cents ? Math.round(venue.hire_fee_cents / 100) : 0,
    securityRequired: venue.security_required ?? false,
    equipmentProvided: venue.equipment_provided ?? false,
  };
}

export function getInventoryCap(context: VenueFinanceContext) {
  return context.venueCapacity && context.venueCapacity > 0
    ? Math.round(context.venueCapacity)
    : undefined;
}

export function getVenueFee(context: VenueFinanceContext, defaultVenueFee = 3000) {
  return context.venueHireFee && context.venueHireFee > 0
    ? context.venueHireFee
    : defaultVenueFee;
}
