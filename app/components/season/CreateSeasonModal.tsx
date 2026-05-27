"use client";

import { X } from "lucide-react";

import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import { INPUT_SURFACE } from "@/lib/ui/page-surfaces";

type CreateSeasonModalProps = {
  open: boolean;
  name: string;
  startDate: string;
  endDate: string;
  onNameChange: (v: string) => void;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
  onQuickQuarter: () => void;
};

export default function CreateSeasonModal({
  open,
  name,
  startDate,
  endDate,
  onNameChange,
  onStartChange,
  onEndChange,
  onClose,
  onSave,
  onQuickQuarter,
}: CreateSeasonModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-season-title"
    >
      <div className="w-full max-w-md rounded-xl border border-[#232330] bg-[#11111A] p-5 shadow-[0px_10px_40px_0px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8B5CF6]">
              New season
            </p>
            <h2 id="create-season-title" className="mt-1 text-[18px] font-semibold text-[#F5F5F7]">
              Create a run
            </h2>
            <p className="mt-1 text-[12px] text-[#71717A]">
              Group shows into a tour, residency, or quarter.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#71717A] hover:bg-[#232330] hover:text-[#F5F5F7]"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <Input state="default" label="Season name" value={name} onChange={onNameChange} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#71717A]">
                Start
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartChange(e.target.value)}
                className={INPUT_SURFACE}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#71717A]">
                End
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndChange(e.target.value)}
                className={INPUT_SURFACE}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onQuickQuarter}>
            This quarter
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={onSave}>
            Create season
          </Button>
        </div>
      </div>
    </div>
  );
}
