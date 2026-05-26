"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import ArtistContactConfirmModal from "@/app/components/artists/ArtistContactConfirmModal";
import ArtistImageChooseModal from "@/app/components/artists/ArtistImageChooseModal";
import ArtistMatchReviewModal from "@/app/components/artists/ArtistMatchReviewModal";
import ArtistOverwriteConfirmDialog from "@/app/components/artists/ArtistOverwriteConfirmDialog";
import Button from "@/app/components/ui/Button";
import { buildAppliedArtistDraft, listArtistFieldConflicts } from "@/lib/ai/apply-artist-match";
import type { ArtistContactCandidate } from "@/lib/ai/artist-contact-types";
import type { PortraitImageCandidate } from "@/lib/ai/artist-portrait-candidate-types";
import { mapPortraitSourceToArtistSource, portraitScoreToConfidence } from "@/lib/ai/artist-portrait-scoring";
import { mergeArtistMatches } from "@/lib/ai/merge-artist-matches";
import type { ArtistMatch } from "@/lib/ai/artistSchema";
import { readJsonResponse } from "@/lib/api/read-json-response";
import { getStoredSession } from "@/lib/supabase/browser";
import type { ArtistDraft } from "@/lib/types/artist";

type ArtistAiFillButtonProps = {
  artistName: string;
  draft: ArtistDraft;
  onApply: (next: ArtistDraft) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  /** Matches input height when placed beside the artist name field. */
  compact?: boolean;
  className?: string;
};

export default function ArtistAiFillButton({
  artistName,
  draft,
  onApply,
  onError,
  onSuccess,
  compact = false,
  className = "",
}: ArtistAiFillButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [enriching, setEnriching] = React.useState(false);
  const [loadingStep, setLoadingStep] = React.useState<string>("Finding artist…");
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [imageOpen, setImageOpen] = React.useState(false);
  const [contactOpen, setContactOpen] = React.useState(false);
  const [matches, setMatches] = React.useState<ArtistMatch[]>([]);
  const [reviewError, setReviewError] = React.useState<string | null>(null);
  const [pendingMatch, setPendingMatch] = React.useState<ArtistMatch | null>(null);
  const [pendingContact, setPendingContact] = React.useState<ArtistContactCandidate | null>(null);
  const [overwriteOpen, setOverwriteOpen] = React.useState(false);
  const [conflicts, setConflicts] = React.useState<ReturnType<typeof listArtistFieldConflicts>>([]);

  const disabled = !artistName.trim() || loading || profileLoading;

  async function handleFindArtist() {
    const name = artistName.trim();
    if (!name) return;

    const session = getStoredSession();
    if (!session?.accessToken) {
      onError("Sign in to use AI artist lookup.");
      return;
    }

    setLoading(true);
    setProfileLoading(false);
    setEnriching(false);
    setLoadingStep("Finding artist…");
    setReviewError(null);
    setMatches([]);
    setReviewOpen(true);

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    };

    let sawPreview = false;

    const previewPromise = fetch("/api/ai/artist-fill/preview", {
      method: "POST",
      headers,
      body: JSON.stringify({ artistName: name }),
    })
      .then(async (response) => {
        const payload = await readJsonResponse<{ error?: string; matches?: ArtistMatch[] }>(response);
        if (!response.ok || !payload.matches?.length) return;
        sawPreview = true;
        setMatches(payload.matches ?? []);
        setLoading(false);
        setProfileLoading(true);
        setLoadingStep("Pulling profile…");
      })
      .catch(() => {
        /* full request still runs */
      });

    try {
      const [, fullMatches] = await Promise.all([
        previewPromise,
        fetch("/api/ai/artist-fill", {
          method: "POST",
          headers,
          body: JSON.stringify({ artistName: name }),
        }).then(async (response) => {
          const payload = await readJsonResponse<{ error?: string; matches?: ArtistMatch[] }>(
            response,
          );
          if (!response.ok) {
            throw new Error(payload.error ?? "Unable to find artist matches.");
          }
          const nextMatches = payload.matches ?? [];
          if (nextMatches.length === 0) {
            throw new Error("No confident match found. Try a more specific artist name.");
          }
          return nextMatches;
        }),
      ]);

      if (!fullMatches?.length) {
        if (!sawPreview) {
          setReviewError("No confident match found. Try a more specific artist name.");
        }
        setLoading(false);
        setProfileLoading(false);
        return;
      }

      setMatches((prev) => mergeArtistMatches(prev, fullMatches));
      setLoading(false);
      setProfileLoading(false);
      setLoadingStep("Checking contacts…");
      setEnriching(true);

      void fetch("/api/ai/artist-fill/enrich", {
        method: "POST",
        headers,
        body: JSON.stringify({ matches: fullMatches }),
      })
        .then(async (enrichRes) => {
          const enriched = await readJsonResponse<{ error?: string; matches?: ArtistMatch[] }>(
            enrichRes,
          );
          if (!enrichRes.ok || !enriched.matches?.length) return;
          setMatches((prev) => mergeArtistMatches(prev, enriched.matches ?? []));
        })
        .catch(() => {
          /* keep partial results */
        })
        .finally(() => {
          setEnriching(false);
          setProfileLoading(false);
          setLoadingStep("Done");
        });
    } catch (err) {
      if (!sawPreview) {
        const message = err instanceof Error ? err.message : "Artist lookup failed.";
        setReviewError(message);
        onError(message);
      }
      setLoading(false);
      setProfileLoading(false);
      setEnriching(false);
    }
  }

  function proceedAfterImage(match: ArtistMatch) {
    setPendingMatch(match);
    setPendingContact(null);
    setImageOpen(false);
    setContactOpen(true);
  }

  function handleSelectMatch(match: ArtistMatch) {
    setReviewOpen(false);
    const needsChoice =
      match.requiresImageChoice ||
      (match.imageCandidates && match.imageCandidates.length > 0 && !match.imageUrl);
    if (needsChoice && (match.imageCandidates?.length ?? 0) > 0) {
      setPendingMatch(match);
      setImageOpen(true);
      return;
    }
    proceedAfterImage(match);
  }

  function applyChosenImage(candidate: PortraitImageCandidate) {
    if (!pendingMatch) return;
    const next: ArtistMatch = {
      ...pendingMatch,
      imageUrl: candidate.imageUrl,
      imageSource: mapPortraitSourceToArtistSource(candidate.sourceType),
      imageConfidence: portraitScoreToConfidence(candidate.score),
      imageWarnings: candidate.warnings,
      imageAttribution: candidate.attribution,
      requiresImageChoice: false,
    };
    proceedAfterImage(next);
  }

  function handleUploadManually() {
    if (!pendingMatch) return;
    proceedAfterImage({
      ...pendingMatch,
      imageUrl: undefined,
      imageSource: "manual_required",
      imageConfidence: "low",
      imageWarnings: ["Portrait skipped — upload manually on the artist form."],
      requiresImageChoice: false,
    });
  }

  function tryApplyMatch(match: ArtistMatch, contact: ArtistContactCandidate | null) {
    const proposed = buildAppliedArtistDraft(draft, match, contact, { overwrite: false });
    const fieldConflicts = listArtistFieldConflicts(draft, proposed);

    if (fieldConflicts.length > 0) {
      setPendingContact(contact);
      setConflicts(fieldConflicts);
      setOverwriteOpen(true);
      return;
    }

    finishApply(match, contact, false);
  }

  function handleSelectContact(candidate: ArtistContactCandidate) {
    if (!pendingMatch) return;
    setContactOpen(false);
    tryApplyMatch(pendingMatch, candidate);
  }

  function handleSkipContact() {
    if (!pendingMatch) return;
    setContactOpen(false);
    tryApplyMatch(pendingMatch, null);
  }

  function finishApply(match: ArtistMatch, contact: ArtistContactCandidate | null, overwrite: boolean) {
    const next = buildAppliedArtistDraft(draft, match, contact, { overwrite });
    onApply(next);
    setReviewOpen(false);
    setImageOpen(false);
    setContactOpen(false);
    setOverwriteOpen(false);
    setPendingMatch(null);
    setPendingContact(null);
    setConflicts([]);

    const contactNote = contact
      ? ` Applied ${contact.contactType} contact.`
      : "";
    onSuccess(`Applied profile for ${match.artistName}.${contactNote} Review each step before saving.`);
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        type="button"
        disabled={disabled}
        onClick={() => void handleFindArtist()}
        className={[
          "shrink-0 gap-1.5",
          compact ? "h-11 px-4 text-sm" : "px-4",
          className,
        ].join(" ")}
        title={disabled ? "Enter an artist name first" : "Find artist profile with AI"}
      >
        <Sparkles className="size-4 shrink-0" aria-hidden />
        {loading ? "Finding…" : profileLoading ? "Loading…" : enriching ? "Enriching…" : "Find Artist"}
      </Button>

      <ArtistMatchReviewModal
        open={reviewOpen}
        artistQuery={artistName.trim()}
        matches={matches}
        loading={loading && matches.length === 0}
        profileLoading={profileLoading}
        enriching={enriching}
        loadingStep={loadingStep}
        error={reviewError}
        onClose={() => {
          if (!loading) {
            setReviewOpen(false);
            setReviewError(null);
          }
        }}
        onSelect={handleSelectMatch}
      />

      <ArtistImageChooseModal
        open={imageOpen}
        artistName={pendingMatch?.artistName ?? ""}
        candidates={pendingMatch?.imageCandidates ?? []}
        onClose={() => {
          setImageOpen(false);
          setPendingMatch(null);
          setReviewOpen(true);
        }}
        onUseImage={applyChosenImage}
        onUploadManually={handleUploadManually}
      />

      <ArtistContactConfirmModal
        open={contactOpen}
        artistName={pendingMatch?.artistName ?? ""}
        discovery={pendingMatch?.contactDiscovery}
        onClose={() => {
          setContactOpen(false);
          setPendingMatch(null);
          if (pendingMatch?.requiresImageChoice && (pendingMatch.imageCandidates?.length ?? 0) > 0) {
            setImageOpen(true);
          } else {
            setReviewOpen(true);
          }
        }}
        onSkip={handleSkipContact}
        onSelect={handleSelectContact}
      />

      <ArtistOverwriteConfirmDialog
        open={overwriteOpen}
        artistName={pendingMatch?.artistName ?? ""}
        conflicts={conflicts}
        onCancel={() => {
          if (pendingMatch) finishApply(pendingMatch, pendingContact, false);
          setOverwriteOpen(false);
        }}
        onConfirm={() => {
          if (pendingMatch) finishApply(pendingMatch, pendingContact, true);
        }}
      />
    </>
  );
}
