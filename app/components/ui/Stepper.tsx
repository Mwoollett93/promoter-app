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

const stateToIndex: Record<StepperState, number> = {
  "Event Basics": 1,
  "Lineup & Schedule": 2,
  "Finance & Forecast": 3,
  "Review & Create": 4,
};

export default function Stepper({
  state = "Event Basics",
  className = "",
}: StepperProps) {
  const current = stateToIndex[state];

  return (
    <div className={`relative w-[884px] ${className}`}>
      {/* Steps row */}
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
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 14,
                      lineHeight: "20px",
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    {step}
                  </span>
                )}
              </div>

              <p
                className="whitespace-nowrap text-center text-[#F5F5F7]"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  lineHeight: "20px",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Connectors (exact geometry) */}
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
  );
}