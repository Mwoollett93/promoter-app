"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { reactivateAccount } from "@/lib/settings/settings";
import { bootstrapSettingsFromAuth } from "@/lib/settings/user-bootstrap";
import { completeSupabaseHashSession, isDemoSession } from "@/lib/supabase/browser";

export default function SupabaseAuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    completeSupabaseHashSession(window.location.hash)
      .then((session) => {
        if (!isDemoSession(session)) {
          bootstrapSettingsFromAuth({
            userId: session.user.id,
            email: session.user.email,
            metadata: session.user.metadata,
          });
        }
        reactivateAccount();
        router.replace("/dashboard");
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Unable to complete Supabase sign in.");
      });
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B0B10] px-6 text-[#F5F5F7]">
      <section className="w-full max-w-md rounded-2xl border border-[#232330] bg-[#11111A] p-6 text-center shadow-[0px_10px_40px_0px_rgba(0,0,0,0.4)]">
        <h1 className="text-2xl font-bold tracking-tight">
          {error ? "Sign in needs attention" : "Connecting Supabase"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#A1A1AA]">
          {error ??
            "We are completing your Supabase session and will return you to your dashboard."}
        </p>
        {error ? (
          <Link
            href="/"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-lg border border-[#8B5CF6]/60 bg-[#7C3AED] px-5 text-sm font-semibold text-white"
          >
            Back to sign in
          </Link>
        ) : null}
      </section>
    </main>
  );
}
