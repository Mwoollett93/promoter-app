"use client";

import { Check } from "lucide-react";

export type StepperState =
  | "Event Basics"
  | "Lineup & Schedule"
  | "Finance & Forecast"
  | "Review & Create";

type StepperProps = {
  state?: StepperState;
  className?: string;
  /** Desktop-only strip for wizard header (no mobile duplicate). */
  variant?: "full" | "desktop";
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

function connectorBackground(afterStep: number, current: number) {
  if (afterStep < current) return "#22C55E";
  if (afterStep === current) {
    return "linear-gradient(90deg, #7C3AED 0%, #71717A 100%)";
  }
  return "#71717A";
}

function stepCircleClass(isActive: boolean, isCompleted: boolean) {
  if (isActive) return "border-[#7C3AED] bg-[#7C3AED] text-[#F5F5F7]";
  if (isCompleted) return "border-2 border-[#22C55E] bg-[#0B0B10] text-[#F5F5F7]";
  return "border border-[#71717A] text-[#F5F5F7]";
}

function DesktopStepper({ current }: { current: number }) {
  return (
    <nav aria-label="Event wizard progress" className="w-full max-w-[920px] px-2">
      <div className="flex items-start">
        {steps.map((label, i) => {
          const step = i + 1;
          const isCompleted = step < current;
          const isActive = step === current;

          return (
            <div key={label} className="contents">
              {i > 0 ? (
                <div
                  aria-hidden
                  className="mt-[17px] h-[2px] min-w-[48px] flex-1"
                  style={{ background: connectorBackground(step - 1, current) }}
                />
              ) : null}
              <div className="flex w-[86px] shrink-0 flex-col items-center gap-[10px]">
                <div
                  className={[
                    "flex size-[35px] shrink-0 items-center justify-center rounded-full border",
                    stepCircleClass(isActive, isCompleted),
                  ].join(" ")}
                >
                  {isCompleted ? (
                    <Check className="size-5 text-[#22C55E]" strokeWidth={3} aria-hidden />
                  ) : (
                    <span className="text-[14px] leading-5">{step}</span>
                  )}
                </div>
                <p
                  className={[
                    "whitespace-nowrap text-center text-[14px] leading-5",
                    isActive
                      ? "font-medium text-[#F5F5F7]"
                      : isCompleted
                        ? "font-normal text-[#F5F5F7]"
                        : "font-normal text-[#71717A]",
                  ].join(" ")}
                >
                  {label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

export default function Stepper({
  state = "Event Basics",
  className = "",
  variant = "full",
}: StepperProps) {
  const current = stateToIndex[state];
  const showMobile = variant === "full";

  return (
    <div className={className}>
      {showMobile ? (
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
                      <Check className="size-4 text-[#22C55E]" strokeWidth={3} aria-hidden />
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
      ) : null}

      <div className={showMobile ? "hidden md:block" : "block"}>
        <DesktopStepper current={current} />
      </div>
    </div>
  );
}

export function wizardStepFromPathname(pathname: string | null): StepperState {
  if (!pathname) return "Event Basics";
  if (pathname.includes("lineup")) return "Lineup & Schedule";
  if (pathname.includes("finance")) return "Finance & Forecast";
  if (pathname.includes("review")) return "Review & Create";
  return "Event Basics";
}
