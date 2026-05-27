"use client";

export type SeasonViewMode = "timeline" | "calendar" | "analytics";

const MODES: { id: SeasonViewMode; label: string }[] = [
  { id: "timeline", label: "Timeline" },
  { id: "calendar", label: "Calendar" },
  { id: "analytics", label: "Analytics" },
];

type SeasonViewToggleProps = {
  value: SeasonViewMode;
  onChange: (mode: SeasonViewMode) => void;
};

export default function SeasonViewToggle({ value, onChange }: SeasonViewToggleProps) {
  return (
    <div
      className="inline-flex rounded-lg border border-[#232330] bg-[#0B0B10] p-0.5"
      role="tablist"
      aria-label="Season view"
    >
      {MODES.map((mode) => (
        <button
          key={mode.id}
          type="button"
          role="tab"
          aria-selected={value === mode.id}
          onClick={() => onChange(mode.id)}
          className={[
            "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
            value === mode.id
              ? "bg-[#1A1630] text-[#C4B5FD] ring-1 ring-[#8B5CF6]/30"
              : "text-[#71717A] hover:text-[#A1A1AA]",
          ].join(" ")}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
