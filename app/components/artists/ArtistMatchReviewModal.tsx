"use client";

import * as React from "react";
import { ExternalLink, Sparkles, X } from "lucide-react";

import ArtistAvatar from "@/app/components/artists/ArtistAvatar";
import Button from "@/app/components/ui/Button";
import type { ArtistMatch } from "@/lib/ai/artistSchema";

type ArtistMatchReviewModalProps = {
  open: boolean;
  artistQuery: string;
  matches: ArtistMatch[];
  loading?: boolean;
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
  if (confidence === "medium") return "border-[#8B5CF6]/30 bg-[#1A1630]/40 text-[#C4B5FD]";
  return "border-[#3F3F46] bg-[#11111A] text-[#A1A1AA]";
}

function bioPreview(description: string): string {
  const trimmed = description.trim();
  if (!trimmed) return "No bio available.";
  const sentences = trimmed.split(/(?<=[.!?])\s+/).slice(0, 2);
  const preview = sentences.join(" ");
  return preview.length > 220 ? `${preview.slice(0, 217)}…` : preview;
}

export default function ArtistMatchReviewModal({
  open,
  artistQuery,
  matches,
  loading = false,
  error = null,
  onClose,
  onSelect,
}: ArtistMatchReviewModalProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!open) setHoveredIndex(null);
  }, [open]);

  if (!open) return null;

  const hasMatches = matches.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <section
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#232330] bg-[#11111A] shadow-[0_0_40px_rgba(139,92,246,0.12)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#232330] px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-[#8B5CF6]">
              <Sparkles className="size-4" aria-hidden />
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em]">AI artist lookup</span>
            </div>
            <h2 className="mt-1 text-lg font-semibold text-[#F5F5F7]">Confirm artist match</h2>
            <p className="mt-1 text-[13px] text-[#A1A1AA]">
              Results for <span className="text-[#E4E4E7]">&ldquo;{artistQuery}&rdquo;</span> — pick the correct profile.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-[#71717A] hover:text-white" aria-label="Close">
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="rounded-lg border border-[#8B5CF6]/25 bg-[#1A1630]/30 px-4 py-8 text-center text-[13px] text-[#C4B5FD]">
              Searching for artist profiles…
            </p>
          ) : null}

          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-200">
              {error}
            </p>
          ) : null}

          {!loading && !error && !hasMatches ? (
            <div className="rounded-xl border border-[#232330] bg-[#0F0F17] px-4 py-8 text-center">
              <p className="text-[15px] font-medium text-[#F5F5F7]">No confident match found</p>
              <p className="mt-2 text-[13px] leading-6 text-[#A1A1AA]">
                We couldn&apos;t find a reliable public profile for this name. Continue filling the form manually.
              </p>
            </div>
          ) : null}

          {!loading && hasMatches ? (
            <ul className="space-y-3">
              {matches.map((match, index) => {
                const hovered = hoveredIndex === index;
                return (
                  <li
                    key={`${match.artistName}-${index}`}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={[
                      "flex flex-col gap-4 rounded-xl border p-4 transition-colors sm:flex-row sm:items-stretch",
                      hovered
                        ? "border-[#8B5CF6]/55 bg-[#1A1430]/50 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                        : "border-[#232330] bg-[#0F0F17]",
                    ].join(" ")}
                  >
                    <div className="flex shrink-0 items-start sm:w-[88px]">
                      <ArtistAvatar name={match.artistName} imageUrl={match.imageUrl} size={72} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[16px] font-semibold text-[#F5F5F7]">{match.artistName}</h3>
                        <span
                          className={[
                            "rounded-md border px-2 py-0.5 text-[11px] font-medium",
                            confidenceClasses(match.confidence),
                          ].join(" ")}
                        >
                          {confidenceLabel(match.confidence)}
                        </span>
                      </div>
                      {match.location ? (
                        <p className="mt-1 text-[13px] text-[#A1A1AA]">{match.location}</p>
                      ) : null}
                      {match.classification ? (
                        <p className="mt-1 text-[12px] text-[#8B5CF6]">{match.classification}</p>
                      ) : null}
                      {match.agencyName || match.managementCompany ? (
                        <p className="mt-1 text-[12px] text-[#71717A]">
                          {[match.agencyName, match.managementCompany].filter(Boolean).join(" · ")}
                          {match.contactName ? ` · ${match.contactName}` : ""}
                        </p>
                      ) : null}
                      {match.genres.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
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
                      <p className="mt-2 text-[13px] leading-5 text-[#D4D4D8]">{bioPreview(match.description)}</p>
                      {match.sources && match.sources.length > 0 ? (
                        <p className="mt-2 text-[11px] text-[#71717A]">
                          Sources: {match.sources.join(" · ")}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-col items-stretch justify-between gap-2 sm:w-[148px]">
                      <div className="flex flex-wrap gap-2 sm:flex-col">
                        {match.spotify ? (
                          <a
                            href={match.spotify}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#8B5CF6] hover:text-[#A78BFA]"
                          >
                            Spotify <ExternalLink className="size-3" />
                          </a>
                        ) : null}
                        {match.instagram ? (
                          <a
                            href={match.instagram}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#8B5CF6] hover:text-[#A78BFA]"
                          >
                            Instagram <ExternalLink className="size-3" />
                          </a>
                        ) : null}
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        type="button"
                        className="w-full"
                        onClick={() => onSelect(match)}
                      >
                        Use this artist
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <footer className="flex justify-end gap-2 border-t border-[#232330] px-5 py-4">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            {hasMatches && !loading ? "Cancel" : "Close"}
          </Button>
        </footer>
      </section>
    </div>
  );
}
