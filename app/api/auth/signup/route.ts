import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createClient(url.replace(/\/$/, ""), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: Request) {
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured on the server." }, { status: 500 });
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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: body.emailRedirectTo,
      data: body.data,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (data.session) {
    return NextResponse.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        user: { id: data.session.user.id, email: data.session.user.email },
      },
    });
  }

  return NextResponse.json({
    needsEmailConfirmation: true,
    message: "Account created. Check your email to confirm your address, then sign in.",
  });
}
