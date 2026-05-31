"use client";

import Button from "@/app/components/ui/Button";

type WizardMobileNavBarProps = {
  onBack?: () => void;
  onContinue: () => void;
  continueDisabled?: boolean;
  continueLabel?: string;
  backLabel?: string;
  showBack?: boolean;
};

/** Sticky Continue / Back bar on phone — hidden md+. */
export default function WizardMobileNavBar({
  onBack,
  onContinue,
  continueDisabled = false,
  continueLabel = "Continue",
  backLabel = "Back",
  showBack = true,
}: WizardMobileNavBarProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-[#232330] bg-[#11111A]/95 px-4 py-3 backdrop-blur md:hidden"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      {showBack && onBack ? (
        <Button type="button" variant="secondary" size="md" onClick={onBack} className="min-h-[44px]">
          {backLabel}
        </Button>
      ) : null}
      <Button
        type="button"
        variant="primary"
        size="md"
        disabled={continueDisabled}
        onClick={onContinue}
        className="min-h-[44px] flex-1"
      >
        {continueLabel}
      </Button>
    </div>
  );
}
