"use client";

import * as React from "react";
import { ExternalLink, Mail, Shield, UserPlus } from "lucide-react";

import ArtistAiLookupModal from "@/app/components/artists/ArtistAiLookupModal";
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

function formatScanAudit(discovery?: ArtistContactDiscovery): string {
  const sources = discovery?.sources?.filter(Boolean) ?? [];
  const label = sources.length > 0 ? sources.join(" · ") : "public profiles";
  const when = new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Scanned by ${label} · ${when}`;
}

export default function ArtistContactConfirmModal({
  open,
  artistName,
  discovery,
  loading = false,
  onClose,
  onSkip,
  onSelect,
}: ArtistContactConfirmModalProps) {
  const candidates = (discovery?.candidates ?? []).filter((c) => c.confidence !== "low");
  const hasCandidates = candidates.length > 0;

  return (
    <ArtistAiLookupModal
      open={open}
      zIndexClass="z-[60]"
      maxWidthClass="max-w-2xl"
      title="Confirm contact details"
      subtitle={
        <>
          Booking contacts found for <span className="text-[#E4E4E7]">{artistName}</span>
        </>
      }
      onClose={onClose}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" size="sm" type="button" onClick={onSkip}>
            Skip contact details
          </Button>
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      {loading ? (
        <SoftGlowLoader>
          <p className="rounded-xl border border-[#8B5CF6]/20 bg-[#0A0A0F] px-4 py-12 text-center text-[13px] text-[#C4B5FD]">
            <SearchingEllipsisText text="Scanning official websites and public profiles" />
          </p>
        </SoftGlowLoader>
      ) : null}

      {!loading && !hasCandidates ? (
        <div className="rounded-xl border border-[#232330] bg-[#0A0A0F] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#232330] bg-[#11111A] text-[#71717A]">
                <UserPlus className="size-5" aria-hidden />
              </div>
              <div>
                <p className="text-[15px] font-medium text-[#F5F5F7]">No verified booking contact found</p>
                <p className="mt-1 text-[13px] leading-relaxed text-[#A1A1AA]">
                  We couldn&apos;t find a verified booking contact for{" "}
                  <span className="text-[#E4E4E7]">{artistName}</span>.
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" type="button" className="shrink-0 gap-2" onClick={onSkip}>
              <UserPlus className="size-4" aria-hidden />
              Add contact manually
            </Button>
          </div>
        </div>
      ) : null}

      {!loading && hasCandidates ? (
        <ul className="space-y-3">
          {candidates.map((candidate) => (
            <li
              key={candidate.id}
              className="rounded-xl border border-[#232330] bg-[#0A0A0F] p-5 transition-colors hover:border-[#8B5CF6]/25"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg border border-[#8B5CF6]/35 bg-[#1A1630]/60 px-2.5 py-1 text-[11px] font-medium text-[#C4B5FD]">
                  {contactTypeLabel(candidate.contactType)}
                </span>
                <span
                  className={[
                    "rounded-lg border px-2.5 py-1 text-[11px] font-medium",
                    contactConfidenceClasses(candidate.confidence),
                  ].join(" ")}
                >
                  {contactConfidenceLabel(candidate.confidence)}
                </span>
              </div>

              {candidate.email ? (
                <p className="mt-4 flex items-center gap-2 text-[15px] text-[#F5F5F7]">
                  <Mail className="size-4 shrink-0 text-[#8B5CF6]" aria-hidden />
                  {candidate.email}
                </p>
              ) : null}

              {candidate.agencyName ? (
                <p className="mt-2 text-[13px] text-[#A1A1AA]">Agency: {candidate.agencyName}</p>
              ) : null}

              <a
                href={candidate.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-[12px] text-[#8B5CF6] hover:text-[#A78BFA]"
              >
                View source page <ExternalLink className="size-3" />
              </a>

              {candidate.warnings.length > 0 ? (
                <p className="mt-2 text-[12px] text-amber-200/90">{candidate.warnings.join(" · ")}</p>
              ) : null}

              <Button
                variant="primary"
                size="sm"
                type="button"
                className="mt-4"
                onClick={() => onSelect(candidate)}
              >
                Use this contact
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && discovery ? (
        <p className="mt-5 flex items-center gap-2 text-[12px] text-[#71717A]">
          <Shield className="size-3.5 shrink-0" aria-hidden />
          {formatScanAudit(discovery)}
        </p>
      ) : null}
    </ArtistAiLookupModal>
  );
}
