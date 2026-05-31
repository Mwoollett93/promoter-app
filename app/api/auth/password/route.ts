import { NextResponse } from "next/server";

import { validatePasswordPolicy } from "@/lib/auth/password-policy";
import { jsonError, logRouteError, safeAuthError } from "@/lib/security/api-response";
import { passwordUpdateSchema, parseJsonBody } from "@/lib/security/auth-schemas";
import { assertSameOrigin } from "@/lib/security/origin-check";
import { serverUpdatePassword } from "@/lib/supabase/server-auth";
import { getBearerToken, getUserFromAccessToken } from "@/lib/supabase/server-user";

export async function PUT(request: Request) {
  const originBlock = assertSameOrigin(request);
  if (originBlock) return originBlock;

  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) {
      return jsonError("Unauthorized.", 401);
    }

    const user = await getUserFromAccessToken(accessToken);
    if (!user?.id) {
      return jsonError("Unauthorized.", 401);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid request body.", 400);
    }

    const parsed = parseJsonBody(passwordUpdateSchema, body);
    if (!parsed.ok) return jsonError(parsed.error, 400);

    const passwordCheck = validatePasswordPolicy(parsed.data.password);
    if (!passwordCheck.ok) return jsonError(passwordCheck.message, 400);

    await serverUpdatePassword(accessToken, parsed.data.password.trim());
    return NextResponse.json({ ok: true });
  } catch (error) {
    logRouteError("api/auth/password", error);
    return jsonError(safeAuthError(error, "Password update failed."), 400);
  }
}
