import { NextResponse } from "next/server";

import {
  jsonError,
  logRouteError,
  randomFailedSignInDelay,
  safeAuthError,
} from "@/lib/security/api-response";
import { signInSchema, parseJsonBody } from "@/lib/security/auth-schemas";
import { assertSameOrigin } from "@/lib/security/origin-check";
import {
  checkSignInFailureLimit,
  checkSignInIpLimit,
  rateLimitResponse,
  recordSignInFailure,
} from "@/lib/security/rate-limit";
import { attachSessionIndicator } from "@/lib/security/session-cookie";
import { getSupabaseServerConfig, serverSignIn } from "@/lib/supabase/server-auth";

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

    const ipLimit = await checkSignInIpLimit(request);
    if (!ipLimit.ok) return rateLimitResponse(ipLimit);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid request body.", 400);
    }

    const parsed = parseJsonBody(signInSchema, body);
    if (!parsed.ok) return jsonError(parsed.error, 400);

    const { email, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    const failureLimit = await checkSignInFailureLimit(request, normalizedEmail);
    if (!failureLimit.ok) return rateLimitResponse(failureLimit);

    try {
      const session = await serverSignIn({ email: normalizedEmail, password });
      const response = NextResponse.json({ session });
      return attachSessionIndicator(response, request);
    } catch (signInError) {
      await recordSignInFailure(request, normalizedEmail);
      await randomFailedSignInDelay();
      logRouteError("api/auth/signin", signInError);
      return jsonError(safeAuthError(signInError, "Unable to sign in."), 400);
    }
  } catch (error) {
    logRouteError("api/auth/signin", error);
    return jsonError("Unable to sign in.", 400);
  }
}
