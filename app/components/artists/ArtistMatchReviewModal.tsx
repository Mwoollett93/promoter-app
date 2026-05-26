"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";

import ArtistAiLookupModal from "@/app/components/artists/ArtistAiLookupModal";
import ArtistAvatar from "@/app/components/artists/ArtistAvatar";
import Button from "@/app/components/ui/Button";
import { SearchingEllipsisText, SoftGlowLoader } from "@/app/components/ui/SoftGlowLoader";
import {
  imageConfidenceClasses,
  imageConfidenceLabel,
} from "@/lib/ai/artist-portrait-types";
import type { ArtistMatch } from "@/lib/ai/artistSchema";

type ArtistMatchReviewModalProps = {
  open: boolean;
  artistQuery: string;
  matches: ArtistMatch[];
  loading?: boolean;
  profileLoading?: boolean;
  enriching?: boolean;
  loadingStep?: string;
  error?: string | null;
  onClose: () => void;
  onSelect: (match: ArtistMatch) => void;
};

function confidenceLabel(confidence: ArtistMatch["confidence"]): string {
  if (confidence === "high") return "High confidence";
  if (confidence === "medium") return "Medium confidence";
  return "Low confidence";
}

function confidenceClasses(confidence: ArtistMatch["confidence"]): string {
  if (confidence === "high") return "border-[#14532D]/50 bg-[#0F2417] text-[#86EFAC]";
  if (confidence === "medium") return "border-[#8B5CF6]/30 bg-[#1A1630]/50 text-[#C4B5FD]";
  return "border-[#3F3F46] bg-[#11111A] text-[#A1A1AA]";
}

function bioPreview(description: string): string {
  const trimmed = description.trim();
  if (!trimmed) return "";
  const sentences = trimmed.split(/(?<=[.!?])\s+/).slice(0, 2);
  const preview = sentences.join(" ");
  return preview.length > 280 ? `${preview.slice(0, 277)}…` : preview;
}

function StatusBanner({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 rounded-xl border border-[#8B5CF6]/20 bg-[#1A1630]/25 px-4 py-2.5 text-[13px] text-[#C4B5FD]">
      {children}
    </p>
  );
}

export default function ArtistMatchReviewModal({
  open,
  artistQuery,
  matches,
  loading = false,
  profileLoading = false,
  enriching = false,
  loadingStep = "Finding artist…",
  error = null,
  onClose,
  onSelect,
}: ArtistMatchReviewModalProps) {
  const hasMatches = matches.length > 0;

  return (
    <ArtistAiLookupModal
      open={open}
      title="Confirm artist match"
      subtitle={
        <>
          Results for <span className="text-[#E4E4E7]">&ldquo;{artistQuery}&rdquo;</span> — pick the correct
          profile.
        </>
      }
      onClose={onClose}
      footer={
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            {hasMatches && !loading ? "Cancel" : "Close"}
          </Button>
        </div>
      }
    >
      {loading ? (
        <SoftGlowLoader>
          <p className="rounded-xl border border-[#8B5CF6]/20 bg-[#0A0A0F] px-4 py-14 text-center text-[13px] text-[#C4B5FD]">
            <SearchingEllipsisText text={loadingStep.replace(/…$/, "")} />
          </p>
        </SoftGlowLoader>
      ) : null}

      {!loading && profileLoading ? (
        <StatusBanner>Pulling bio and profile details…</StatusBanner>
      ) : null}

      {!loading && enriching ? (
        <StatusBanner>Checking contacts and extra sources…</StatusBanner>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-200">
          {error}
        </p>
      ) : null}

      {!loading && !error && !hasMatches ? (
        <div className="rounded-xl border border-[#232330] bg-[#0A0A0F] px-6 py-10 text-center">
          <p className="text-[16px] font-medium text-[#F5F5F7]">No confident match found</p>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-[#A1A1AA]">
            We couldn&apos;t find a reliable public profile for this name. Continue filling the form manually.
          </p>
        </div>
      ) : null}

      {!loading && hasMatches ? (
        <ul className="space-y-4">
          {matches.map((match, index) => (
            <li
              key={`${match.artistName}-${index}`}
              className="overflow-hidden rounded-xl border border-[#232330] bg-[#0A0A0F]"
            >
              <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start">
                <div className="shrink-0">
                  <ArtistAvatar name={match.artistName} imageUrl={match.imageUrl} size={96} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-[#F5F5F7]">{match.artistName}</h3>
                    <span
                      className={[
                        "rounded-lg border px-2.5 py-0.5 text-[11px] font-medium",
                        confidenceClasses(match.confidence),
                      ].join(" ")}
                    >
                      {confidenceLabel(match.confidence)}
                    </span>
                    {match.imageConfidence && match.imageUrl ? (
                      <span
                        className={[
                          "rounded-lg border px-2.5 py-0.5 text-[11px] font-medium",
                          imageConfidenceClasses(match.imageConfidence),
                        ].join(" ")}
                        title={match.imageWarnings?.join(" · ")}
                      >
                        {imageConfidenceLabel(match.imageConfidence)}
                      </span>
                    ) : null}
                  </div>

                  {!match.imageUrl &&
                  (match.imageConfidence === "low" || match.imageSource === "manual_required") ? (
                    <p className="mt-2 text-[12px] text-[#A1A1AA]">
                      {match.enrichStatus === "preview" || match.enrichStatus === "partial"
                        ? "Finding press photo…"
                        : "No press photo found — you can add one in the next step."}
                    </p>
                  ) : null}

                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-[#A1A1AA]">
                    {match.location ? <span>{match.location}</span> : null}
                    {match.classification ? (
                      <span className="text-[#C4B5FD]">{match.classification}</span>
                    ) : null}
                  </div>

                  {match.genres.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {match.genres.slice(0, 6).map((genre) => (
                        <span
                          key={genre}
                          className="rounded-md border border-[#232330] bg-[#11111A] px-2 py-0.5 text-[11px] text-[#C4B5FD]"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {profileLoading && !match.description.trim() ? (
                    <div className="mt-4 space-y-2" aria-hidden>
                      <div className="h-3 w-full animate-pulse rounded-md bg-[#232330]" />
                      <div className="h-3 w-[85%] animate-pulse rounded-md bg-[#232330]" />
                      <p className="text-[12px] text-[#71717A]">Loading bio…</p>
                    </div>
                  ) : match.description.trim() ? (
                    <p className="mt-4 text-[14px] leading-relaxed text-[#D4D4D8]">
                      {bioPreview(match.description)}
                    </p>
                  ) : null}

                  {(match.spotify || match.instagram) && (
                    <div className="mt-4 flex flex-wrap gap-4">
                      {match.spotify ? (
                        <a
                          href={match.spotify}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] text-[#8B5CF6] hover:text-[#A78BFA]"
                        >
                          Spotify <ExternalLink className="size-3" />
                        </a>
                      ) : null}
                      {match.instagram ? (
                        <a
                          href={match.instagram}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] text-[#8B5CF6] hover:text-[#A78BFA]"
                        >
                          Instagram <ExternalLink className="size-3" />
                        </a>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-[#232330] bg-[#0D0D12] px-5 py-3">
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => onSelect(match)}
                >
                  Use this artist
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </ArtistAiLookupModal>
  );
}
