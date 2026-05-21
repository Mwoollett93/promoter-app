/** Mini wizard flow strip for marketing */
export default function WizardShowcase() {
  const steps = [
    { label: "Event Basics", active: true },
    { label: "Lineup & Schedule", active: false },
    { label: "Finance & Forecast", active: false },
    { label: "Review & Create", active: false },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-[#232330] bg-[#11111A] shadow-[0px_24px_60px_rgba(0,0,0,0.5)]">
      <div className="border-b border-[#232330] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B5CF6]">
          Event wizard
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {steps.map((step) => (
            <span
              key={step.label}
              className={[
                "rounded-full px-3 py-1 text-[11px] font-medium",
                step.active
                  ? "bg-[#7C3AED] text-white"
                  : "border border-[#3F3F46] text-[#71717A]",
              ].join(" ")}
            >
              {step.label}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[#232330] bg-[#0B0B10] p-4">
          <p className="text-[10px] uppercase text-[#71717A]">Venue</p>
          <p className="mt-1 text-[14px] font-semibold text-[#F5F5F7]">Sub Club · Melbourne</p>
          <p className="mt-3 text-[10px] uppercase text-[#71717A]">Date</p>
          <p className="text-[13px] text-[#E4E4E7]">Sat 14 Jun · 22:00</p>
        </div>
        <div className="rounded-xl border border-[#232330] bg-[#0B0B10] p-4">
          <p className="text-[10px] uppercase text-[#71717A]">Projected profit</p>
          <p className="mt-1 text-[22px] font-bold text-[#86EFAC]">£4,280</p>
          <p className="mt-2 text-[11px] text-[#A1A1AA]">Break-even: 186 tickets</p>
        </div>
      </div>
    </div>
  );
}
