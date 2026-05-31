import { NextResponse } from "next/server";

import { jsonError } from "@/lib/security/api-response";
import { assertSameOrigin } from "@/lib/security/origin-check";
import { attachSessionIndicator } from "@/lib/security/session-cookie";
import { getBearerToken, getUserFromAccessToken } from "@/lib/supabase/server-user";

function isDemoAuthEnabled() {
  if (process.env.NEXT_PUBLIC_DEMO_AUTH === "false") return false;
  if (process.env.NEXT_PUBLIC_DEMO_AUTH === "true") return true;
  return process.env.NODE_ENV !== "production";
}

/** Sets the ps-auth indicator cookie after client-side OAuth or demo sign-in. */
export async function POST(request: Request) {
  const originBlock = assertSameOrigin(request);
  if (originBlock) return originBlock;

  let body: { demo?: boolean } = {};
  try {
    body = (await request.json()) as { demo?: boolean };
  } catch {
    /* empty body is fine for bearer auth */
  }

  if (body.demo) {
    if (!isDemoAuthEnabled()) {
      return jsonError("Forbidden.", 403);
    }
    const response = NextResponse.json({ ok: true });
    return attachSessionIndicator(response, request);
  }

  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return jsonError("Unauthorized.", 401);
  }

  const user = await getUserFromAccessToken(accessToken);
  if (!user?.id) {
    return jsonError("Unauthorized.", 401);
  }

  const response = NextResponse.json({ ok: true });
  return attachSessionIndicator(response, request);
}
