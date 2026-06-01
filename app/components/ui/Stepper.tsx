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

/** Connector between steps 1 and 2 — matches Figma component set (40:1804). */
function lineBetween12(current: number) {
  if (current === 1) return "linear-gradient(90deg, #7C3AED 0%, #71717A 100%)";
  if (current === 2) return "linear-gradient(90deg, #22C55E 0%, #7C3AED 100%)";
  return "#22C55E";
}

/** Connector between steps 2 and 3. */
function lineBetween23(current: number) {
  if (current === 1) return "#71717A";
  if (current === 2) return "linear-gradient(90deg, #7C3AED 0%, #71717A 100%)";
  if (current === 3) return "linear-gradient(90deg, #22C55E 0%, #7C3AED 100%)";
  return "#22C55E";
}

/** Connector between steps 3 and 4. */
function lineBetween34(current: number) {
  if (current <= 2) return "#71717A";
  if (current === 3) return "linear-gradient(90deg, #7C3AED 0%, #71717A 100%)";
  return "linear-gradient(90deg, #22C55E 0%, #7C3AED 100%)";
}

function DesktopStepper({ current }: { current: number }) {
  return (
    <nav
      aria-label="Event wizard progress"
      className="relative h-[65px] w-[884px] shrink-0"
    >
      <div className="relative z-10 flex items-center gap-[180px]">
        {steps.map((label, i) => {
          const step = i + 1;
          const isCompleted = step < current;
          const isActive = step === current;

          return (
            <div key={label} className="flex w-[86px] shrink-0 flex-col items-center gap-[10px]">
              <div
                className={[
                  "flex size-[35px] shrink-0 items-center justify-center overflow-hidden rounded-[50px]",
                  isActive
                    ? "bg-[#7C3AED]"
                    : isCompleted
                      ? "border border-solid border-[#22C55E]"
                      : "border border-solid border-[#71717A]",
                ].join(" ")}
              >
                {isCompleted ? (
                  <Check className="size-5 text-[#22C55E]" strokeWidth={3} aria-hidden />
                ) : (
                  <span className="text-[14px] font-medium leading-5 text-[#F5F5F7]">{step}</span>
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
        aria-hidden
        className="absolute left-[62px] top-[17px] h-[2px] w-[228px] rounded-[1px]"
        style={{ background: lineBetween12(current) }}
      />
      <div
        aria-hidden
        className="absolute left-[328px] top-[17px] h-[2px] w-[228px] rounded-[1px]"
        style={{ background: lineBetween23(current) }}
      />
      <div
        aria-hidden
        className="absolute left-[594px] top-[17px] h-[2px] w-[228px] rounded-[1px]"
        style={{ background: lineBetween34(current) }}
      />
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
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      isActive
                        ? "bg-[#7C3AED]"
                        : isCompleted
                          ? "border border-[#22C55E]"
                          : "border border-[#71717A]",
                    ].join(" ")}
                  >
                    {isCompleted ? (
                      <Check className="size-4 text-[#22C55E]" strokeWidth={3} aria-hidden />
                    ) : (
                      <span className="text-[12px] font-medium text-[#F5F5F7]">{step}</span>
                    )}
                  </div>
                  <p
                    className={[
                      "w-full truncate text-center text-[10px] leading-tight text-[#F5F5F7]",
                      isActive ? "font-medium" : "font-normal",
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
