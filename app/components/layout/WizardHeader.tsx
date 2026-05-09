"use client";

import { X } from "lucide-react";
import Button from "@/app/components/ui/Button";

type WizardHeaderProps = {
  title?: string;
  onClose?: () => void;
  onSaveDraft?: () => void;
};

export default function WizardHeader({
  title = "Create New Event",
  onClose,
  onSaveDraft,
}: WizardHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <h1 className="flex-1 text-[32px] font-bold leading-[36px] text-[#F5F5F7]">
        {title}
      </h1>

      <Button variant="ghost" size="md" type="button" onClick={onSaveDraft}>
        Save Draft
      </Button>

      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#71717A] text-[#F5F5F7] transition-colors hover:border-[#71717A] hover:bg-[#181824] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50"
        aria-label="Close"
      >
        <X className="h-6 w-6" strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}