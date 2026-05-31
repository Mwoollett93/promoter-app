import { NextResponse } from "next/server";

import { assertSameOrigin } from "@/lib/security/origin-check";
import { clearSessionIndicator } from "@/lib/security/session-cookie";

export async function POST(request: Request) {
  const originBlock = assertSameOrigin(request);
  if (originBlock) return originBlock;

  const response = NextResponse.json({ ok: true });
  return clearSessionIndicator(response);
}
