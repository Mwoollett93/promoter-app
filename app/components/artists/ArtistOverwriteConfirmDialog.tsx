"use client";

import { X } from "lucide-react";

import Button from "@/app/components/ui/Button";
import type { ArtistFieldConflict } from "@/lib/ai/apply-artist-match";

type ArtistOverwriteConfirmDialogProps = {
  open: boolean;
  artistName: string;
  conflicts: ArtistFieldConflict[];
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ArtistOverwriteConfirmDialog({
  open,
  artistName,
  conflicts,
  onCancel,
  onConfirm,
}: ArtistOverwriteConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4" onClick={onCancel}>
      <section
        className="w-full max-w-md rounded-2xl border border-[#232330] bg-[#11111A] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[#232330] px-5 py-4">
          <h3 className="text-[16px] font-semibold text-[#F5F5F7]">Overwrite existing fields?</h3>
          <button type="button" onClick={onCancel} className="text-[#71717A] hover:text-white" aria-label="Close">
            <X className="size-5" />
          </button>
        </header>
        <div className="px-5 py-4">
          <p className="text-[13px] leading-6 text-[#A1A1AA]">
            Applying <span className="text-[#E4E4E7]">{artistName}</span> would replace data you already entered in:
          </p>
          <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto">
            {conflicts.map((conflict) => (
              <li
                key={conflict.field}
                className="rounded-lg border border-[#232330] bg-[#0F0F17] px-3 py-2 text-[12px] text-[#D4D4D8]"
              >
                <span className="font-medium text-[#F5F5F7]">{conflict.field}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-[#71717A]">
            Empty fields will still be filled. Only conflicting values need your confirmation.
          </p>
        </div>
        <footer className="flex justify-end gap-2 border-t border-[#232330] px-5 py-4">
          <Button variant="ghost" size="sm" type="button" onClick={onCancel}>
            Keep my entries
          </Button>
          <Button variant="primary" size="sm" type="button" onClick={onConfirm}>
            Overwrite & apply
          </Button>
        </footer>
      </section>
    </div>
  );
}
