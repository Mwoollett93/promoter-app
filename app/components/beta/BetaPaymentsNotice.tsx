import { BETA_PAYMENTS_DISABLED_MESSAGE } from "@/lib/beta/config";

export default function BetaPaymentsNotice() {
  return (
    <p className="rounded-lg border border-[#8B5CF6]/30 bg-[#1A1630]/50 px-4 py-3 text-[13px] leading-5 text-[#C4B5FD]">
      {BETA_PAYMENTS_DISABLED_MESSAGE}
    </p>
  );
}
