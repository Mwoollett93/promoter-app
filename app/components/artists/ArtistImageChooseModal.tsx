"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, CloudUpload, Sparkles, Upload } from "lucide-react";

import ArtistAiLookupModal from "@/app/components/artists/ArtistAiLookupModal";
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

function candidateInsight(candidate: PortraitImageCandidate, confidence: "low" | "medium" | "high"): string {
  if (candidate.vision?.reason?.trim()) return candidate.vision.reason;
  if (confidence === "high") {
    return "This image appears to be an official press photo. High quality and recognisable across sources.";
  }
  const squareWarning = candidate.warnings.find((w) => w.includes("Square"));
  if (squareWarning) {
    return "Square image — verify this is a press photo, not album or release artwork, before saving.";
  }
  return "Review this image before saving it to your artist profile.";
}

export default function ArtistImageChooseModal({
  open,
  artistName,
  candidates,
  onClose,
  onUseImage,
  onUploadManually,
}: ArtistImageChooseModalProps) {
  const list = candidates.slice(0, 3);
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (!open) setIndex(0);
  }, [open]);

  React.useEffect(() => {
    if (index >= list.length) setIndex(0);
  }, [index, list.length]);

  const candidate = list[index];
  const confidence = candidate ? portraitScoreToConfidence(candidate.score) : "low";

  return (
    <ArtistAiLookupModal
      open={open}
      zIndexClass="z-[55]"
      maxWidthClass="max-w-4xl"
      title="Choose artist image"
      subtitle={
        <>
          Pick a press photo for <span className="text-[#E4E4E7]">{artistName}</span>, or upload your own.
        </>
      }
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Back
          </Button>
          <Button variant="primary" size="sm" type="button" className="gap-2" onClick={onUploadManually}>
            <Upload className="size-4" aria-hidden />
            Upload manually
          </Button>
        </div>
      }
    >
      {list.length === 0 ? (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[#3F3F46] bg-[#0A0A0F] px-6 py-12 text-center">
            <CloudUpload className="size-10 text-[#71717A]" aria-hidden />
            <p className="mt-4 text-[15px] font-medium text-[#F5F5F7]">No suitable images found</p>
            <p className="mt-2 max-w-sm text-[13px] text-[#A1A1AA]">
              We couldn&apos;t find a confident press photo. Upload your own image to continue.
            </p>
            <Button variant="primary" size="sm" type="button" className="mt-6" onClick={onUploadManually}>
              Upload manually
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
          <div className="flex shrink-0 flex-col items-center gap-3 lg:w-[200px]">
            <div className="relative size-[180px] overflow-hidden rounded-xl border border-[#232330] bg-[#0A0A0F] shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={candidate.imageUrl}
                alt={`${artistName} press photo`}
                className="size-full object-cover"
              />
            </div>
            {list.length > 1 ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-[#232330] p-1.5 text-[#A1A1AA] hover:border-[#8B5CF6]/40 hover:text-white disabled:opacity-40"
                  disabled={index === 0}
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="text-[12px] text-[#71717A]">
                  {index + 1} of {list.length}
                </span>
                <button
                  type="button"
                  className="rounded-lg border border-[#232330] p-1.5 text-[#A1A1AA] hover:border-[#8B5CF6]/40 hover:text-white disabled:opacity-40"
                  disabled={index >= list.length - 1}
                  onClick={() => setIndex((i) => Math.min(list.length - 1, i + 1))}
                  aria-label="Next image"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-[#8B5CF6]/35 bg-[#1A1630]/60 px-2.5 py-1 text-[11px] font-medium text-[#C4B5FD]">
                {portraitSourceLabel(candidate.sourceType)}
              </span>
              <span
                className={[
                  "rounded-lg border px-2.5 py-1 text-[11px] font-medium",
                  imageConfidenceClasses(confidence),
                ].join(" ")}
              >
                {imageConfidenceLabel(confidence)} · score {candidate.score}
              </span>
            </div>

            <div className="flex gap-3 rounded-xl border border-[#8B5CF6]/20 bg-[#1A1630]/30 px-4 py-3.5">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-[#8B5CF6]" aria-hidden />
              <p className="text-[13px] leading-relaxed text-[#D4D4D8]">
                {candidateInsight(candidate, confidence)}
              </p>
            </div>

            {candidate.width && candidate.height ? (
              <p className="text-[12px] text-[#71717A]">
                {candidate.width} × {candidate.height}px
              </p>
            ) : null}

            <Button
              variant="secondary"
              size="sm"
              type="button"
              className="w-fit"
              onClick={() => onUseImage(candidate)}
            >
              Use this image
            </Button>
          </div>

          <div className="hidden items-stretch gap-4 lg:flex">
            <div className="flex flex-col items-center justify-center">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#52525B]">or</span>
            </div>
            <button
              type="button"
              onClick={onUploadManually}
              className="flex w-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-[#3F3F46] bg-[#0A0A0F] px-4 py-8 text-center transition-colors hover:border-[#8B5CF6]/40 hover:bg-[#12121A]"
            >
              <CloudUpload className="size-9 text-[#71717A]" aria-hidden />
              <span className="mt-4 text-[14px] font-medium text-[#F5F5F7]">Upload your own</span>
              <span className="mt-1 text-[12px] text-[#71717A]">JPG, PNG or WebP</span>
            </button>
          </div>
        </div>
      )}

      {list.length > 0 ? (
        <button
          type="button"
          onClick={onUploadManually}
          className="mt-6 flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#3F3F46] bg-[#0A0A0F] px-4 py-8 text-center transition-colors hover:border-[#8B5CF6]/40 lg:hidden"
        >
          <CloudUpload className="size-8 text-[#71717A]" aria-hidden />
          <span className="mt-3 text-[14px] font-medium text-[#F5F5F7]">Upload your own</span>
          <span className="mt-1 text-[12px] text-[#71717A]">JPG, PNG or WebP</span>
        </button>
      ) : null}
    </ArtistAiLookupModal>
  );
}
