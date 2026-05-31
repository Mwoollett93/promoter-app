"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import MfaLoginChallenge from "@/app/components/auth/MfaLoginChallenge";
import { getMfaLoginRequirement, verifyTotpLogin } from "@/lib/auth/mfa";
import { reactivateAccount } from "@/lib/settings/settings";
import { bootstrapSettingsFromAuth } from "@/lib/settings/user-bootstrap";
import {
  completeSupabaseOAuthCallback,
  establishSessionIndicator,
  isDemoSession,
  signOutOfSupabase,
} from "@/lib/supabase/browser";
import type { SupabaseSession } from "@/lib/types/artist";

export default function SupabaseAuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    completeSupabaseOAuthCallback(window.location.search, window.location.hash)
      .then(async (session) => {
        if (!isDemoSession(session)) {
          bootstrapSettingsFromAuth({
            userId: session.user.id,
            email: session.user.email,
            metadata: session.user.metadata,
          });
        }

        const mfa = await getMfaLoginRequirement(session);
        if (mfa.required && mfa.factorId) {
          setMfaFactorId(mfa.factorId);
          return;
        }

        await finishSignIn(session, router);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Unable to complete Supabase sign in.");
      });
  }, [router]);

  async function handleMfaVerify(code: string) {
    if (!mfaFactorId) return;

    setLoading(true);
    setError(null);

    try {
      const session = await verifyTotpLogin(mfaFactorId, code);
      await finishSignIn(session, router);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid authentication code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMfaCancel() {
    await signOutOfSupabase();
    router.replace("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B0B10] px-6 text-[#F5F5F7]">
      <section className="w-full max-w-md rounded-2xl border border-[#232330] bg-[#11111A] p-6 shadow-[0px_10px_40px_0px_rgba(0,0,0,0.4)]">
        {mfaFactorId ? (
          <MfaLoginChallenge
            loading={loading}
            error={error}
            onSubmit={handleMfaVerify}
            onCancel={handleMfaCancel}
          />
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              {error ? "Sign in needs attention" : "Connecting Supabase"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#A1A1AA]">
              {error ??
                "We are completing your Supabase session and will return you to your dashboard."}
            </p>
            {error ? (
              <Link
                href="/login"
                className="mt-5 inline-flex h-11 items-center justify-center rounded-lg border border-[#8B5CF6]/60 bg-[#7C3AED] px-5 text-sm font-semibold text-white"
              >
                Back to sign in
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}

async function finishSignIn(
  session: SupabaseSession,
  router: { replace: (href: string) => void },
) {
  await establishSessionIndicator(session);
  reactivateAccount();
  router.replace("/dashboard");
}
