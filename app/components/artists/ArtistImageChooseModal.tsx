"use client";

import * as React from "react";
import { Upload, X } from "lucide-react";

import Button from "@/app/components/ui/Button";
import type { PortraitImageCandidate } from "@/lib/ai/artist-portrait-candidate-types";
import {
  imageConfidenceClasses,
  imageConfidenceLabel,
  portraitSourceLabel,
} from "@/lib/ai/artist-portrait-types";
import { portraitScoreToConfidence } from "@/lib/ai/artist-portrait-scoring";

type ArtistImageChooseModalProps = {
  open: boolean;
  artistName: string;
  candidates: PortraitImageCandidate[];
  onClose: () => void;
  onUseImage: (candidate: PortraitImageCandidate) => void;
  onUploadManually: () => void;
};

function primaryWarning(candidate: PortraitImageCandidate): string | undefined {
  return candidate.warnings.find((w) => w.includes("Square") || w.includes("release") || w.includes("check"));
}

export default function ArtistImageChooseModal({
  open,
  artistName,
  candidates,
  onClose,
  onUseImage,
  onUploadManually,
}: ArtistImageChooseModalProps) {
  if (!open) return null;

  const list = candidates.slice(0, 3);

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/75 p-4" onClick={onClose}>
      <section
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#232330] bg-[#11111A] shadow-[0_0_40px_rgba(139,92,246,0.12)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#232330] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#F5F5F7]">Choose artist image</h2>
            <p className="mt-1 text-[13px] text-[#A1A1AA]">
              Pick a press photo for <span className="text-[#E4E4E7]">{artistName}</span>, or upload your own.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-[#71717A] hover:text-white" aria-label="Close">
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {list.length === 0 ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-6 text-center text-amber-100">
              <p className="text-[15px] font-medium">No suitable portrait candidates found.</p>
              <p className="mt-2 text-[13px] text-amber-200/90">Upload a press photo manually.</p>
            </div>
          ) : (
            list.map((candidate) => {
              const confidence = portraitScoreToConfidence(candidate.score);
              const warning = primaryWarning(candidate);
              return (
                <article
                  key={candidate.id}
                  className="flex gap-4 rounded-xl border border-[#232330] bg-[#0F0F17] p-4"
                >
                  <div className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-[#232330] bg-[#18181F]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={candidate.imageUrl}
                      alt={`${artistName} candidate`}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-[#8B5CF6]/40 bg-[#1A1630]/50 px-2 py-0.5 text-[11px] font-medium text-[#C4B5FD]">
                        {portraitSourceLabel(candidate.sourceType)}
                      </span>
                      <span
                        className={[
                          "rounded-md border px-2 py-0.5 text-[11px] font-medium",
                          imageConfidenceClasses(confidence),
                        ].join(" ")}
                      >
                        {imageConfidenceLabel(confidence)} · score {candidate.score}
                      </span>
                    </div>
                    {candidate.width && candidate.height ? (
                      <p className="mt-2 text-[12px] text-[#71717A]">
                        {candidate.width}×{candidate.height}px
                      </p>
                    ) : null}
                    {warning ? (
                      <p className="mt-2 text-[12px] text-amber-200">{warning}</p>
                    ) : null}
                    {candidate.vision ? (
                      <p className="mt-1 text-[12px] text-[#A1A1AA]">
                        AI: {candidate.vision.isLikelyArtistPhoto ? "Likely press photo" : "May not be a portrait"} —{" "}
                        {candidate.vision.reason}
                      </p>
                    ) : null}
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      className="mt-3"
                      onClick={() => onUseImage(candidate)}
                    >
                      Use image
                    </Button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#232330] px-5 py-4">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Back
          </Button>
          <Button variant="secondary" size="sm" type="button" className="gap-1.5" onClick={onUploadManually}>
            <Upload className="size-4" aria-hidden />
            Upload manually
          </Button>
        </footer>
      </section>
    </div>
  );
}
