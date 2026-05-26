"use client";

import { Sparkles } from "lucide-react";

import type { OperationalSuggestion } from "@/lib/tasks/operational-suggestions";

type OperationalSuggestionsBarProps = {
  suggestions: OperationalSuggestion[];
  onCreateFromSuggestion: (suggestion: OperationalSuggestion) => void;
};

export default function OperationalSuggestionsBar({
  suggestions,
  onCreateFromSuggestion,
}: OperationalSuggestionsBarProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#8B5CF6]/20 bg-gradient-to-r from-[#1A1630]/60 to-[#0F0F17] p-3">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="size-4 text-[#A78BFA]" />
        <p className="text-[12px] font-semibold text-[#C4B5FD]">Operational intelligence</p>
        <span className="text-[11px] text-[#71717A]">Auto-detected from your events</span>
      </div>
      <ul className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onCreateFromSuggestion(s)}
              className="group rounded-lg border border-[#3F3F46]/80 bg-[#11111A]/90 px-3 py-2 text-left transition-all hover:border-[#8B5CF6]/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.12)]"
            >
              <p className="text-[12px] font-medium text-[#F5F5F7] group-hover:text-[#E9D5FF]">
                {s.title}
              </p>
              <p className="mt-0.5 text-[10px] text-[#71717A]">
                {s.eventName} · {s.label}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
