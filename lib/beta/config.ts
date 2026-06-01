/** Master switch — set NEXT_PUBLIC_BETA_MODE=true in Vercel for private beta builds. */
export function isBetaMode() {
  const raw = process.env.NEXT_PUBLIC_BETA_MODE?.trim().toLowerCase();
  return raw === "true" || raw === "1";
}

export function paymentsDisabledInBeta() {
  return isBetaMode();
}

export const BETA_PAYMENTS_DISABLED_MESSAGE =
  "Payments are currently disabled during beta.";

export const BETA_FEEDBACK_SUCCESS =
  "Thanks — your feedback was sent. We read every note during the beta.";

export const BETA_SURVEY_SUCCESS =
  "Thanks — your survey response was sent. We appreciate you taking the time.";

const GOOGLE_FORMS_HOST = "docs.google.com";

/** Optional Google Form URL for /tester-survey embed or link. */
export function betaSurveyEmbedUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_BETA_SURVEY_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!url.hostname.endsWith(GOOGLE_FORMS_HOST)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** API routes return 404 when beta mode is off (easy rollback). */
export function betaApiUnavailableResponse() {
  return new Response(JSON.stringify({ error: "Not found." }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}
