"use client";

import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import Button from "@/app/components/ui/Button";
import Stepper, { wizardStepFromPathname } from "@/app/components/ui/Stepper";

type WizardHeaderProps = {
  title?: string;
  onClose?: () => void;
  onSaveDraft?: () => void;
  savingDraft?: boolean;
};

export default function WizardHeader({
  title = "Create New Event",
  onClose,
  onSaveDraft,
  savingDraft = false,
}: WizardHeaderProps) {
  const pathname = usePathname();
  const stepperState = wizardStepFromPathname(pathname);

  return (
    <div className="relative mb-4 hidden min-h-[72px] items-center md:flex">
      <h1 className="relative z-10 shrink-0 text-[32px] font-bold leading-[36px] text-[#F5F5F7]">
        {title}
      </h1>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
        <Stepper state={stepperState} variant="desktop" className="pointer-events-auto" />
      </div>

      <div className="relative z-10 ml-auto flex shrink-0 items-center gap-3">
        <Button
          variant="ghost"
          size="md"
          type="button"
          disabled={!onSaveDraft || savingDraft}
          onClick={onSaveDraft}
        >
          {savingDraft ? "Saving…" : "Save Draft"}
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
    </div>
  );
}
