"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import MfaLoginChallenge from "@/app/components/auth/MfaLoginChallenge";
import { getMfaLoginRequirement, verifyTotpLogin } from "@/lib/auth/mfa";
import { getLandingPagePath, reactivateAccount } from "@/lib/settings/settings";
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
  const exchangedRef = useRef(false);

  useEffect(() => {
    if (exchangedRef.current) return;
    exchangedRef.current = true;

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
        setError(err instanceof Error ? err.message : "Unable to finish sign-in. Please try again.");
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
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#151320]">
              <img
                src="/Promosync_icon.svg"
                alt=""
                width={28}
                height={28}
                className="size-7 object-contain brightness-0 invert"
              />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight">
              {error ? "Couldn't finish sign-in" : "Signing you in"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#A1A1AA]">
              {error ?? "Just a moment — we're getting your workspace ready."}
            </p>
            {error ? (
              <Link
                href="/login"
                className="mt-5 inline-flex h-11 items-center justify-center rounded-lg border border-[#8B5CF6]/60 bg-[#7C3AED] px-5 text-sm font-semibold text-white"
              >
                Back to sign in
              </Link>
            ) : (
              <div
                className="mx-auto mt-6 size-8 animate-spin rounded-full border-2 border-[#3F3F46] border-t-[#8B5CF6]"
                aria-hidden
              />
            )}
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
  try {
    await establishSessionIndicator(session);
  } catch (err) {
    await signOutOfSupabase();
    throw err;
  }
  reactivateAccount();
  router.replace(getLandingPagePath());
}
