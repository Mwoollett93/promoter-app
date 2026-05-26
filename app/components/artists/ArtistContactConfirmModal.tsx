"use client";

import * as React from "react";
import { ExternalLink, Mail, X } from "lucide-react";

import Button from "@/app/components/ui/Button";
import { SearchingEllipsisText, SoftGlowLoader } from "@/app/components/ui/SoftGlowLoader";
import {
  contactConfidenceClasses,
  contactConfidenceLabel,
  contactTypeLabel,
  type ArtistContactCandidate,
  type ArtistContactDiscovery,
} from "@/lib/ai/artist-contact-types";

type ArtistContactConfirmModalProps = {
  open: boolean;
  artistName: string;
  discovery?: ArtistContactDiscovery;
  loading?: boolean;
  onClose: () => void;
  onSkip: () => void;
  onSelect: (candidate: ArtistContactCandidate) => void;
};

export default function ArtistContactConfirmModal({
  open,
  artistName,
  discovery,
  loading = false,
  onClose,
  onSkip,
  onSelect,
}: ArtistContactConfirmModalProps) {
  if (!open) return null;

  const candidates = (discovery?.candidates ?? []).filter((c) => c.confidence !== "low");
  const hasCandidates = candidates.length > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4" onClick={onClose}>
      <section
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#232330] bg-[#11111A] shadow-[0_0_40px_rgba(139,92,246,0.12)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#232330] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#F5F5F7]">Confirm contact details</h2>
            <p className="mt-1 text-[13px] text-[#A1A1AA]">
              Booking contacts found for <span className="text-[#E4E4E7]">{artistName}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-[#71717A] hover:text-white" aria-label="Close">
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <SoftGlowLoader>
              <p className="border border-[#8B5CF6]/25 bg-[#1A1630]/30 px-4 py-10 text-center text-[13px] text-[#C4B5FD] shadow-[inset_0_0_32px_rgba(139,92,246,0.06)]">
                <SearchingEllipsisText text="Scanning official websites and public profiles" />
              </p>
            </SoftGlowLoader>
          ) : null}

          {!loading && !hasCandidates ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-6 text-center">
              <p className="text-[15px] font-medium text-amber-100">
                No verified booking contact found — add manually.
              </p>
              {discovery?.warnings && discovery.warnings.length > 0 ? (
                <p className="mt-2 text-[12px] text-amber-200/80">{discovery.warnings.join(" · ")}</p>
              ) : null}
            </div>
          ) : null}

          {!loading && hasCandidates ? (
            <ul className="space-y-3">
              {candidates.map((candidate) => (
                <li
                  key={candidate.id}
                  className="rounded-xl border border-[#232330] bg-[#0F0F17] p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-[#8B5CF6]/40 bg-[#1A1630]/50 px-2 py-0.5 text-[11px] font-medium text-[#C4B5FD]">
                      {contactTypeLabel(candidate.contactType)}
                    </span>
                    <span
                      className={[
                        "rounded-md border px-2 py-0.5 text-[11px] font-medium",
                        contactConfidenceClasses(candidate.confidence),
                      ].join(" ")}
                    >
                      {contactConfidenceLabel(candidate.confidence)}
                    </span>
                  </div>

                  {candidate.email ? (
                    <p className="mt-3 flex items-center gap-2 text-[14px] text-[#F5F5F7]">
                      <Mail className="size-4 shrink-0 text-[#8B5CF6]" aria-hidden />
                      {candidate.email}
                    </p>
                  ) : null}

                  {candidate.agencyName ? (
                    <p className="mt-1 text-[13px] text-[#A1A1AA]">Agency: {candidate.agencyName}</p>
                  ) : null}

                  <p className="mt-2 text-[11px] text-[#71717A]">
                    Source: {candidate.sourceDomain}
                  </p>

                  <a
                    href={candidate.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#8B5CF6] hover:text-[#A78BFA]"
                  >
                    View source page <ExternalLink className="size-3" />
                  </a>

                  {candidate.warnings.length > 0 ? (
                    <p className="mt-2 text-[11px] text-amber-200/90">{candidate.warnings.join(" · ")}</p>
                  ) : null}

                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    className="mt-3 w-full sm:w-auto"
                    onClick={() => onSelect(candidate)}
                  >
                    Use this contact
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}

          {!loading && discovery && discovery.sources.length > 0 ? (
            <p className="mt-4 text-[11px] text-[#71717A]">
              Scanned: {discovery.sources.join(" · ")}
            </p>
          ) : null}
        </div>

        <footer className="flex justify-end gap-2 border-t border-[#232330] px-5 py-4">
          <Button variant="ghost" size="sm" type="button" onClick={onSkip}>
            Skip contact details
          </Button>
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
        </footer>
      </section>
    </div>
  );
}
