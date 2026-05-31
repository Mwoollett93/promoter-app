"use client";

import { Check } from "lucide-react";

type StepperState =
  | "Event Basics"
  | "Lineup & Schedule"
  | "Finance & Forecast"
  | "Review & Create";

type StepperProps = {
  state?: StepperState;
  className?: string;
};

const steps = [
  "Event Basics",
  "Lineup & Schedule",
  "Finance & Forecast",
  "Review & Create",
] as const;

const shortLabels = ["Basics", "Lineup", "Finance", "Review"] as const;

const stateToIndex: Record<StepperState, number> = {
  "Event Basics": 1,
  "Lineup & Schedule": 2,
  "Finance & Forecast": 3,
  "Review & Create": 4,
};

function stepCircleClass(isActive: boolean, isCompleted: boolean) {
  if (isActive) return "border-[#7C3AED] bg-[#7C3AED] text-[#F5F5F7]";
  if (isCompleted) return "border-2 border-[#22C55E] bg-[#0B0B10] text-[#F5F5F7]";
  return "border border-[#71717A] text-[#71717A]";
}

export default function Stepper({ state = "Event Basics", className = "" }: StepperProps) {
  const current = stateToIndex[state];

  return (
    <div className={className}>
      {/* Mobile — compact 4-step strip */}
      <div className="w-full md:hidden">
        <div className="flex items-start justify-between gap-1">
          {steps.map((label, i) => {
            const step = i + 1;
            const isCompleted = step < current;
            const isActive = step === current;
            return (
              <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <div
                  className={[
                    "flex size-8 shrink-0 items-center justify-center rounded-full border text-[12px] font-medium",
                    stepCircleClass(isActive, isCompleted),
                  ].join(" ")}
                >
                  {isCompleted ? (
                    <Check className="size-4" strokeWidth={3} aria-hidden />
                  ) : (
                    step
                  )}
                </div>
                <p
                  className={[
                    "w-full truncate text-center text-[10px] leading-tight",
                    isActive ? "font-medium text-[#F5F5F7]" : "text-[#71717A]",
                  ].join(" ")}
                >
                  {shortLabels[i]}
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-center text-[12px] text-[#A1A1AA]">
          Step {current} of 4 · {state}
        </p>
      </div>

      {/* Desktop — full stepper */}
      <div className="hidden w-full overflow-x-auto pb-1 md:block">
        <div className="relative mx-auto min-w-[884px] w-max">
          <div className="relative z-10 flex items-center gap-[180px]">
            {steps.map((label, i) => {
              const step = i + 1;
              const isCompleted = step < current;
              const isActive = step === current;

              return (
                <div key={label} className="flex w-[86px] flex-col items-center gap-[10px]">
                  <div
                    className={[
                      "flex size-[35px] shrink-0 items-center justify-center rounded-[50px] border",
                      isActive
                        ? "border-[#7C3AED] bg-[#7C3AED] text-[#F5F5F7]"
                        : isCompleted
                          ? "border-2 border-[#22C55E] bg-[#0B0B10] text-[#F5F5F7]"
                          : "border border-[#71717A] text-[#F5F5F7]",
                    ].join(" ")}
                  >
                    {isCompleted ? (
                      <Check className="size-5 text-[#F5F5F7]" strokeWidth={3} aria-hidden />
                    ) : (
                      <span className="text-[14px] leading-5">{step}</span>
                    )}
                  </div>
                  <p
                    className={[
                      "whitespace-nowrap text-center text-[14px] leading-5 text-[#F5F5F7]",
                      isActive ? "font-medium" : "font-normal",
                    ].join(" ")}
                  >
                    {label}
                  </p>
                </div>
              );
            })}
          </div>

          <div
            className="absolute left-[62px] top-[17px] h-[2px] w-[228px] rounded-[1px]"
            style={{
              background:
                current === 1
                  ? "linear-gradient(90deg, #7C3AED 0%, #71717A 100%)"
                  : current === 2
                    ? "linear-gradient(90deg, #22C55E 0%, #7C3AED 100%)"
                    : "#22C55E",
            }}
          />
          <div
            className="absolute left-[328px] top-[17px] h-[2px] w-[228px] rounded-[1px]"
            style={{
              background:
                current === 1
                  ? "#71717A"
                  : current === 2
                    ? "linear-gradient(90deg, #7C3AED 0%, #71717A 100%)"
                    : current === 3
                      ? "linear-gradient(90deg, #22C55E 0%, #7C3AED 100%)"
                      : "#22C55E",
            }}
          />
          <div
            className="absolute left-[594px] top-[17px] h-[2px] w-[228px] rounded-[1px]"
            style={{
              background:
                current <= 2
                  ? "#71717A"
                  : current === 3
                    ? "linear-gradient(90deg, #7C3AED 0%, #71717A 100%)"
                    : "linear-gradient(90deg, #22C55E 0%, #7C3AED 100%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
