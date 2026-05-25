/** Turn PostgREST / Supabase REST error bodies into user-facing messages. */
export function formatServiceError(raw: string, status: number): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{")) {
    return trimmed || `Service request failed (${status}).`;
  }

  try {
    const parsed = JSON.parse(trimmed) as {
      code?: string;
      message?: string;
      hint?: string;
    };

    if (parsed.code === "PGRST205" && parsed.message?.includes("workspace_billing")) {
      return "Billing is not set up in the database. Run promoter-app/supabase/sprint2-billing.sql in the Supabase SQL editor, then reload this page.";
    }

    if (parsed.message) return parsed.message;
  } catch {
    /* fall through */
  }

  return trimmed || `Service request failed (${status}).`;
}
