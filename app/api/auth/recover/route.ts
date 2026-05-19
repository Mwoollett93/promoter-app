import { NextResponse } from "next/server";

import { getSupabaseServerConfig, serverSendPasswordRecovery } from "@/lib/supabase/server-auth";

export async function POST(request: Request) {
  try {
    if (!getSupabaseServerConfig()) {
      return NextResponse.json(
        {
          error:
            "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel, then redeploy.",
        },
        { status: 500 },
      );
    }

    let body: { email?: string; redirectTo?: string };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const email = body.email?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    await serverSendPasswordRecovery({ email, redirectTo: body.redirectTo });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/auth/recover]", error);
    const message = error instanceof Error ? error.message : "Unable to send reset link.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
