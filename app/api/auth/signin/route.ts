import { NextResponse } from "next/server";

import { getSupabaseServerConfig, serverSignIn } from "@/lib/supabase/server-auth";

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

    let body: { email?: string; password?: string };

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

    const session = await serverSignIn({ email, password });
    return NextResponse.json({ session });
  } catch (error) {
    console.error("[api/auth/signin]", error);
    const message = error instanceof Error ? error.message : "Unable to sign in.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
