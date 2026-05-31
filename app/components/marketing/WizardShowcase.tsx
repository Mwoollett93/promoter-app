import { WIZARD_STEPS, financeWizardPreview } from "@/lib/marketing/app-screens";

type WizardShowcaseProps = {
  /** Highlight a wizard step in the strip. */
  activeStep?: (typeof WIZARD_STEPS)[number];
};

/** Event wizard preview — matches `/event-wizard/*` steps. */
export default function WizardShowcase({ activeStep = "Event Basics" }: WizardShowcaseProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#232330] bg-[#11111A] shadow-[0px_24px_60px_rgba(0,0,0,0.5)]">
      <div className="border-b border-[#232330] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B5CF6]">
          Event wizard
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {WIZARD_STEPS.map((step) => (
            <span
              key={step}
              className={[
                "rounded-full px-3 py-1 text-[11px] font-medium",
                step === activeStep
                  ? "bg-[#7C3AED] text-white"
                  : "border border-[#3F3F46] text-[#71717A]",
              ].join(" ")}
            >
              {step}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[#232330] bg-[#0B0B10] p-4">
          <p className="text-[10px] uppercase text-[#71717A]">Venue</p>
          <p className="mt-1 text-[14px] font-semibold text-[#F5F5F7]">{financeWizardPreview.venue}</p>
          <p className="mt-3 text-[10px] uppercase text-[#71717A]">Date</p>
          <p className="text-[13px] text-[#E4E4E7]">{financeWizardPreview.date}</p>
        </div>
        <div className="rounded-xl border border-[#232330] bg-[#0B0B10] p-4">
          <p className="text-[10px] uppercase text-[#71717A]">Projected profit</p>
          <p className="mt-1 text-[22px] font-bold text-[#86EFAC]">{financeWizardPreview.projectedProfit}</p>
          <p className="mt-2 text-[11px] text-[#A1A1AA]">{financeWizardPreview.breakEven}</p>
          <p className="mt-3 text-[10px] text-[#71717A]">{financeWizardPreview.tiers}</p>
        </div>
      </div>
    </div>
  );
}
