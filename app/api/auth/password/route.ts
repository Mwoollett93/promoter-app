import { NextResponse } from "next/server";

import { serverUpdatePassword } from "@/lib/supabase/server-auth";
import { getBearerToken, getUserFromAccessToken } from "@/lib/supabase/server-user";

export async function PUT(request: Request) {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromAccessToken(accessToken);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { password?: string };
    const password = body.password?.trim();

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    await serverUpdatePassword(accessToken, password);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Password update failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
