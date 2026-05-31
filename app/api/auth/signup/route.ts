import { NextResponse } from "next/server";

import { validatePasswordPolicy } from "@/lib/auth/password-policy";
import {
  jsonError,
  logRouteError,
  safeAuthError,
} from "@/lib/security/api-response";
import { signUpSchema, parseJsonBody } from "@/lib/security/auth-schemas";
import { assertSameOrigin } from "@/lib/security/origin-check";
import { checkSignupIpLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { attachSessionIndicator } from "@/lib/security/session-cookie";
import { getSupabaseServerConfig, serverSignUp } from "@/lib/supabase/server-auth";

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

    const signupLimit = await checkSignupIpLimit(request);
    if (!signupLimit.ok) return rateLimitResponse(signupLimit);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid request body.", 400);
    }

    const parsed = parseJsonBody(signUpSchema, body);
    if (!parsed.ok) return jsonError(parsed.error, 400);

    const { email, password, emailRedirectTo, data } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    const passwordCheck = validatePasswordPolicy(password);
    if (!passwordCheck.ok) return jsonError(passwordCheck.message, 400);

    const result = await serverSignUp({
      email: normalizedEmail,
      password,
      emailRedirectTo,
      data,
    });

    if (result.kind === "session") {
      const response = NextResponse.json({ session: result.session });
      return attachSessionIndicator(response, request);
    }

    return NextResponse.json({
      needsEmailConfirmation: true,
      message: result.message,
    });
  } catch (error) {
    logRouteError("api/auth/signup", error);
    return jsonError(safeAuthError(error, "Unable to create account."), 400);
  }
}
