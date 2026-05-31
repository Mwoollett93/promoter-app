"use client";

import * as React from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import AuthField from "@/app/components/auth/AuthField";

type MfaLoginChallengeProps = {
  loading: boolean;
  error: string | null;
  onSubmit: (code: string) => void;
  onCancel: () => void;
};

export default function MfaLoginChallenge({
  loading,
  error,
  onSubmit,
  onCancel,
}: MfaLoginChallengeProps) {
  const [code, setCode] = React.useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    onSubmit(code.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <header className="text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl border border-[#8B5CF6]/30 bg-[#151322]">
          <ShieldCheck className="size-6 text-[#C4B5FD]" aria-hidden />
        </div>
        <h1 className="text-[32px] font-bold leading-9 tracking-tight text-[#F5F5F7]">
          Two-factor authentication
        </h1>
        <p className="mt-1 text-[14px] leading-5 text-[#A1A1AA]">
          Enter the 6-digit code from your authenticator app.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-[#7F1D1D] bg-[#2B0F14] px-4 py-3 text-[13px] text-[#FCA5A5]">
          {error}
        </div>
      ) : null}

      <AuthField
        label="Authentication code"
        type="text"
        value={code}
        onChange={setCode}
        placeholder="000000"
        autoComplete="one-time-code"
      />

      <button
        type="submit"
        disabled={loading || code.trim().length < 6}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#8B5CF6]/60 bg-[#7C3AED] text-sm font-semibold text-white transition-colors hover:bg-[#8B5CF6] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Verifying…" : "Verify and continue"}
      </button>

      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#3F3F46] bg-[#11111A] text-sm font-medium text-[#E4E4E7] transition-colors hover:border-[#71717A] disabled:opacity-60"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to sign in
      </button>
    </form>
  );
}
