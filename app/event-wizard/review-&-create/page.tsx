"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import Button from "@/app/components/ui/Button";
import Stepper from "@/app/components/ui/Stepper";
import { loadWizardFinanceDraft } from "@/lib/data/wizard-finance-draft";

export default function ReviewCreatePage() {
  const router = useRouter();
  const [summary, setSummary] = React.useState({
    ticketInventory: 0,
    costItems: 0,
    tierCount: 0,
  });

  React.useEffect(() => {
    const draft = loadWizardFinanceDraft();
    if (!draft) return;

    setSummary({
      ticketInventory: draft.ticketInventory,
      costItems: draft.costs.length,
      tierCount: draft.tiers.length,
    });
  }, []);

  return (
    <div className="w-full space-y-3">
      <div className="flex w-full justify-center">
        <Stepper state="Review & Create" />
      </div>

      <section className="rounded-[16px] border border-[#181824] bg-gradient-to-b from-[#11111A] to-[#0D0D14] p-5 shadow-[0px_10px_40px_0px_rgba(0,0,0,0.4)]">
        <h2 className="text-[24px] font-bold leading-[28px] text-[#F5F5F7]">Review &amp; Create</h2>
        <p className="mt-1 max-w-[640px] text-[13px] leading-5 text-[#A1A1AA]">
          The review step is ready for the final polish pass. Your finance data is already flowing
          through, so the wizard can continue without breaking while the final create experience is
          built out.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <ReviewStat label="Ticket Inventory" value={summary.ticketInventory || "—"} />
          <ReviewStat label="Cost Items Saved" value={summary.costItems || "—"} />
          <ReviewStat label="Ticket Tiers Saved" value={summary.tierCount || "—"} />
        </div>

        <div className="mt-5 rounded-[12px] border border-[#232330] bg-[#0F0F17] p-4 text-[13px] leading-5 text-[#A1A1AA]">
          Next up: pull in event basics, lineup details and the finance forecast into a final review
          summary before wiring the real create-event action.
        </div>

        <div className="mt-4 flex items-center gap-3 border-t border-[#181824] pt-4">
          <Button
            variant="ghost"
            size="md"
            type="button"
            onClick={() => router.push("/event-wizard/finance-&-forecast")}
            className="px-6"
          >
            <span className="inline-flex items-center gap-2">
              <ArrowLeft className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              Back
            </span>
          </Button>
        </div>
      </section>
    </div>
  );
}

function ReviewStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[12px] border border-[#232330] bg-[#0F0F17] p-4">
      <p className="text-[12px] uppercase tracking-[0.08em] text-[#71717A]">{label}</p>
      <p className="mt-2 text-[24px] font-bold leading-[28px] text-[#F5F5F7]">{value}</p>
    </div>
  );
}
