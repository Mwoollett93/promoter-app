import { NextResponse } from "next/server";

import {
  jsonError,
  logRouteError,
  safeAuthError,
} from "@/lib/security/api-response";
import { recoverSchema, parseJsonBody } from "@/lib/security/auth-schemas";
import { assertSameOrigin } from "@/lib/security/origin-check";
import { checkRecoverLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { getSupabaseServerConfig, serverSendPasswordRecovery } from "@/lib/supabase/server-auth";

export async function POST(request: Request) {
  const originBlock = assertSameOrigin(request);
  if (originBlock) return originBlock;

  try {
    if (!getSupabaseServerConfig()) {
      return jsonError(
        "Authentication is not configured. Please contact support.",
        500,
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid request body.", 400);
    }

    const parsed = parseJsonBody(recoverSchema, body);
    if (!parsed.ok) return jsonError(parsed.error, 400);

    const normalizedEmail = parsed.data.email.trim().toLowerCase();

    const recoverLimit = await checkRecoverLimit(request, normalizedEmail);
    if (!recoverLimit.ok) return rateLimitResponse(recoverLimit);

    await serverSendPasswordRecovery({
      email: normalizedEmail,
      redirectTo: parsed.data.redirectTo,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logRouteError("api/auth/recover", error);
    return jsonError(safeAuthError(error, "Unable to send reset link."), 400);
  }
}
