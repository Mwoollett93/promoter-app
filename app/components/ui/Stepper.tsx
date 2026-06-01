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

      {/* Desktop — centered, no horizontal scroll */}
      <nav
        aria-label="Event wizard progress"
        className="mx-auto hidden w-full max-w-4xl px-2 md:block"
      >
        <ol className="flex items-start justify-center">
          {steps.map((label, i) => {
            const step = i + 1;
            const isCompleted = step < current;
            const isActive = step === current;
            const isLast = i === steps.length - 1;

            return (
              <li
                key={label}
                className={[
                  "relative flex min-w-0 flex-1 flex-col items-center",
                  !isLast ? "pr-2 sm:pr-4" : "",
                ].join(" ")}
              >
                {!isLast ? (
                  <div
                    aria-hidden
                    className="absolute left-[calc(50%+20px)] right-0 top-[17px] h-[2px] -translate-y-1/2"
                    style={{
                      background: isCompleted
                        ? "#22C55E"
                        : isActive
                          ? "linear-gradient(90deg, #7C3AED 0%, #71717A 100%)"
                          : "#71717A",
                    }}
                  />
                ) : null}
                <div
                  className={[
                    "relative z-10 flex size-[35px] shrink-0 items-center justify-center rounded-full border",
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
                    "mt-2.5 max-w-[9.5rem] text-center text-[12px] leading-4 text-[#F5F5F7] sm:text-[13px] sm:leading-5 lg:text-[14px]",
                    isActive ? "font-medium" : "font-normal text-[#A1A1AA]",
                  ].join(" ")}
                >
                  {label}
                </p>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
