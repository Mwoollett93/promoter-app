import { NextResponse } from "next/server";

import { getSupabaseServerConfig, serverSignUp } from "@/lib/supabase/server-auth";

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

    let body: {
      email?: string;
      password?: string;
      emailRedirectTo?: string;
      data?: Record<string, string | null>;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const result = await serverSignUp({
      email,
      password,
      emailRedirectTo: body.emailRedirectTo,
      data: body.data,
    });

    if (result.kind === "session") {
      return NextResponse.json({ session: result.session });
    }

    return NextResponse.json({
      needsEmailConfirmation: true,
      message: result.message,
    });
  } catch (error) {
    console.error("[api/auth/signup]", error);
    const message = error instanceof Error ? error.message : "Unable to create account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
