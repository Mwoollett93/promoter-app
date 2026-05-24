"use client";

import * as React from "react";

import Button from "@/app/components/ui/Button";
import {
  enrollTotpMfa,
  listMfaFactors,
  unenrollMfaFactor,
  verifyTotpEnrollment,
} from "@/lib/auth/mfa";
import { useAsyncAction } from "@/lib/ui/use-async-action";

export default function MfaSetupPanel({
  onEnabledChange,
}: {
  onEnabledChange: (enabled: boolean) => void;
}) {
  const [enroll, setEnroll] = React.useState<{ factorId: string; qrCode: string; secret: string } | null>(
    null,
  );
  const [code, setCode] = React.useState("");
  const [factorId, setFactorId] = React.useState<string | null>(null);
  const { loading, error, run, clearError } = useAsyncAction();

  React.useEffect(() => {
    void listMfaFactors()
      .then((data) => {
        const verified = data.totp?.find((f) => f.status === "verified");
        setFactorId(verified?.id ?? null);
        onEnabledChange(Boolean(verified));
      })
      .catch(() => {
        /* MFA may be disabled in Supabase project */
      });
  }, [onEnabledChange]);

  async function handleStartEnroll() {
    clearError();
    const data = await run(async () => enrollTotpMfa());
    if (data) setEnroll(data);
  }

  async function handleVerify() {
    if (!enroll) return;
    clearError();
    const ok = await run(async () => {
      await verifyTotpEnrollment(enroll.factorId, code);
      setEnroll(null);
      setCode("");
      const data = await listMfaFactors();
      const verified = data.totp?.find((f) => f.status === "verified");
      setFactorId(verified?.id ?? null);
      onEnabledChange(Boolean(verified));
      return true;
    });
    if (ok) void 0;
  }

  async function handleDisable() {
    if (!factorId) return;
    clearError();
    await run(async () => {
      await unenrollMfaFactor(factorId);
      setFactorId(null);
      onEnabledChange(false);
      return true;
    });
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-[13px] text-red-300">{error}</p> : null}

      {factorId ? (
        <div>
          <p className="text-[13px] text-[#86EFAC]">Two-factor authentication is enabled for your account.</p>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="mt-4 px-6"
            disabled={loading}
            onClick={() => void handleDisable()}
          >
            {loading ? "Working…" : "Disable 2FA"}
          </Button>
        </div>
      ) : enroll ? (
        <div className="space-y-4">
          <p className="text-[13px] text-[#A1A1AA]">
            Scan this QR code with your authenticator app, then enter the 6-digit code.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={enroll.qrCode}
            alt="Authenticator QR code"
            className="inline-block rounded-lg border border-[#232330] bg-white p-3"
            width={180}
            height={180}
          />
          <p className="text-[11px] text-[#71717A]">Manual secret: {enroll.secret}</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            className="w-full max-w-[200px] rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 py-2 text-[14px] text-[#F5F5F7]"
          />
          <div className="flex gap-2">
            <Button variant="primary" size="sm" type="button" disabled={loading} onClick={() => void handleVerify()}>
              Verify & enable
            </Button>
            <Button variant="ghost" size="sm" type="button" onClick={() => setEnroll(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" size="sm" type="button" className="px-6" disabled={loading} onClick={() => void handleStartEnroll()}>
          {loading ? "Loading…" : "Enable 2FA"}
        </Button>
      )}
    </div>
  );
}
